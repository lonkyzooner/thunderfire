/**
 * Mapbox Service for LARK
 * 
 * Provides geospatial intelligence including navigation, geocoding,
 * route optimization, and location-aware assistance for law enforcement
 */

import { getCurrentLocation } from '../utils/locationTracker';

export interface NavigationRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: string; // encoded polyline
  steps: NavigationStep[];
  eta: Date;
  traffic?: 'low' | 'moderate' | 'heavy' | 'severe';
}

export interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  geometry: string;
}

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  address: string;
  placeName: string;
  placeType: string[];
  relevance: number;
  context?: Array<{
    id: string;
    text: string;
  }>;
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distance: number; // meters
  address?: string;
  phone?: string;
  hours?: string;
  emergency?: boolean;
}

export interface LocationContext {
  jurisdiction: string;
  district?: string;
  beat?: string;
  riskLevel: 'low' | 'medium' | 'high';
  nearbyUnits?: Array<{
    unitId: string;
    distance: number;
    eta: number;
  }>;
  landmarks?: string[];
}

class MapboxService {
  private accessToken: string;
  private isInitialized = false;
  private currentLocation: { latitude: number; longitude: number } | null = null;

  constructor() {
    // Use environment variable directly since MAPBOX_ACCESS_TOKEN may not be in EnvConfig
    this.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || process.env.VITE_MAPBOX_ACCESS_TOKEN || '';
  }

  async initialize(): Promise<boolean> {
    if (!this.accessToken) {
      console.warn('[MapboxService] No Mapbox access token provided');
      return false;
    }

    try {
      // Test API connectivity
      await this.testConnection();
      this.isInitialized = true;
      console.log('[MapboxService] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[MapboxService] Initialization failed:', error);
      return false;
    }
  }

  private async testConnection(): Promise<void> {
    const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${this.accessToken}`);
    if (!response.ok) {
      throw new Error('Mapbox API connection test failed');
    }
  }

  /**
   * Get navigation route between two points
   */
  async getRoute(
    fromLat: number, 
    fromLng: number, 
    toLat: number, 
    toLng: number,
    profile: 'driving' | 'walking' | 'cycling' = 'driving',
    includeTraffic: boolean = true
  ): Promise<NavigationRoute | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const coordinates = `${fromLng},${fromLat};${toLng},${toLat}`;
      const trafficParam = includeTraffic ? 'driving-traffic' : profile;
      
      const url = `https://api.mapbox.com/directions/v5/mapbox/${trafficParam}/${coordinates}?` +
        `access_token=${this.accessToken}&` +
        `geometries=geojson&` +
        `steps=true&` +
        `overview=full&` +
        `annotations=duration,distance`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox Directions API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        return null;
      }

      const route = data.routes[0];
      const eta = new Date(Date.now() + (route.duration * 1000));

      return {
        distance: route.distance,
        duration: route.duration,
        geometry: JSON.stringify(route.geometry),
        eta,
        steps: route.legs[0]?.steps?.map((step: any) => ({
          instruction: step.maneuver.instruction,
          distance: step.distance,
          duration: step.duration,
          geometry: JSON.stringify(step.geometry)
        })) || [],
        traffic: this.analyzeTraffic(route.duration, route.distance)
      };

    } catch (error) {
      console.error('[MapboxService] Route calculation error:', error);
      return null;
    }
  }

  /**
   * Geocode an address or place name
   */
  async geocode(query: string, proximity?: { latitude: number; longitude: number }): Promise<GeocodedLocation[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${this.accessToken}&` +
        `country=US&` +
        `limit=5`;

      if (proximity) {
        url += `&proximity=${proximity.longitude},${proximity.latitude}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.features.map((feature: any) => ({
        latitude: feature.center[1],
        longitude: feature.center[0],
        address: feature.place_name,
        placeName: feature.text,
        placeType: feature.place_type,
        relevance: feature.relevance,
        context: feature.context
      }));

    } catch (error) {
      console.error('[MapboxService] Geocoding error:', error);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodedLocation | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?` +
        `access_token=${this.accessToken}&` +
        `limit=1`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox Reverse Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        return null;
      }

      const feature = data.features[0];
      
      return {
        latitude,
        longitude,
        address: feature.place_name,
        placeName: feature.text,
        placeType: feature.place_type,
        relevance: feature.relevance,
        context: feature.context
      };

    } catch (error) {
      console.error('[MapboxService] Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Find nearby places of interest for law enforcement
   */
  async findNearbyPlaces(
    latitude: number,
    longitude: number,
    category: 'hospital' | 'police' | 'fire' | 'courthouse' | 'all' = 'all',
    radius: number = 5000 // meters
  ): Promise<NearbyPlace[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Map categories to Mapbox POI categories
      const categoryMap: Record<string, string> = {
        hospital: 'healthcare',
        police: 'police',
        fire: 'fire_station',
        courthouse: 'courthouse',
        all: 'healthcare,police,fire_station,courthouse,emergency'
      };

      const categories = categoryMap[category] || categoryMap.all;
      
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${categories}.json?` +
        `access_token=${this.accessToken}&` +
        `proximity=${longitude},${latitude}&` +
        `limit=10&` +
        `radius=${radius}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox Places API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.features.map((feature: any) => {
        const distance = this.calculateDistance(
          latitude, longitude,
          feature.center[1], feature.center[0]
        );

        return {
          id: feature.id,
          name: feature.text,
          category: feature.properties?.category || category,
          latitude: feature.center[1],
          longitude: feature.center[0],
          distance,
          address: feature.place_name,
          emergency: this.isEmergencyFacility(feature)
        };
      }).sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance);

    } catch (error) {
      console.error('[MapboxService] Nearby places search error:', error);
      return [];
    }
  }

  /**
   * Get location context for law enforcement operations
   */
  async getLocationContext(latitude: number, longitude: number): Promise<LocationContext> {
    try {
      const location = await this.reverseGeocode(latitude, longitude);
      
      // Extract jurisdiction from context
      const jurisdiction = this.extractJurisdiction(location?.context);
      const district = this.extractDistrict(location?.context);
      
      // Assess risk level based on location characteristics
      const riskLevel = await this.assessLocationRisk(latitude, longitude);

      return {
        jurisdiction: jurisdiction || 'Unknown',
        district,
        riskLevel,
        landmarks: this.extractLandmarks(location?.context)
      };

    } catch (error) {
      console.error('[MapboxService] Location context error:', error);
      return {
        jurisdiction: 'Unknown',
        riskLevel: 'medium'
      };
    }
  }

  /**
   * Navigation assistance for law enforcement scenarios
   */
  async getEmergencyRoute(
    destination: string,
    priority: 'routine' | 'urgent' | 'emergency' = 'routine'
  ): Promise<{
    route: NavigationRoute | null;
    alternativeRoutes: NavigationRoute[];
    safestRoute: NavigationRoute | null;
  }> {
    try {
      // Get current location
      const currentLoc = await getCurrentLocation();
      if (!currentLoc) {
        throw new Error('Current location not available');
      }

      // Geocode destination
      const destinations = await this.geocode(destination, {
        latitude: currentLoc.latitude,
        longitude: currentLoc.longitude
      });

      if (destinations.length === 0) {
        throw new Error('Destination not found');
      }

      const dest = destinations[0];

      // Get primary route
      const profile = priority === 'emergency' ? 'driving' : 'driving';
      const primaryRoute = await this.getRoute(
        currentLoc.latitude, currentLoc.longitude,
        dest.latitude, dest.longitude,
        profile,
        true
      );

      // Get alternative routes (simplified - in real implementation would use alternatives API)
      const alternativeRoutes: NavigationRoute[] = [];

      return {
        route: primaryRoute,
        alternativeRoutes,
        safestRoute: primaryRoute // Simplified - would analyze based on crime data
      };

    } catch (error) {
      console.error('[MapboxService] Emergency route calculation error:', error);
      return {
        route: null,
        alternativeRoutes: [],
        safestRoute: null
      };
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Analyze traffic conditions
   */
  private analyzeTraffic(duration: number, distance: number): 'low' | 'moderate' | 'heavy' | 'severe' {
    const avgSpeed = (distance / 1000) / (duration / 3600); // km/h
    
    if (avgSpeed > 45) return 'low';
    if (avgSpeed > 30) return 'moderate';
    if (avgSpeed > 15) return 'heavy';
    return 'severe';
  }

  /**
   * Check if facility is emergency-related
   */
  private isEmergencyFacility(feature: any): boolean {
    const emergencyCategories = ['hospital', 'police', 'fire_station', 'emergency'];
    return emergencyCategories.some(cat => 
      feature.properties?.category?.includes(cat) || 
      feature.place_type?.includes(cat)
    );
  }

  /**
   * Extract jurisdiction from geocoding context
   */
  private extractJurisdiction(context?: Array<{ id: string; text: string }>): string | undefined {
    if (!context) return undefined;
    
    const jurisdictionContext = context.find(c => 
      c.id.includes('place') || c.id.includes('district') || c.id.includes('region')
    );
    
    return jurisdictionContext?.text;
  }

  /**
   * Extract district/beat information
   */
  private extractDistrict(context?: Array<{ id: string; text: string }>): string | undefined {
    if (!context) return undefined;
    
    const districtContext = context.find(c => 
      c.id.includes('district') || c.id.includes('neighborhood')
    );
    
    return districtContext?.text;
  }

  /**
   * Extract relevant landmarks
   */
  private extractLandmarks(context?: Array<{ id: string; text: string }>): string[] {
    if (!context) return [];
    
    return context
      .filter(c => c.id.includes('poi') || c.id.includes('address'))
      .map(c => c.text)
      .slice(0, 3);
  }

  /**
   * Assess location risk level (simplified)
   */
  private async assessLocationRisk(latitude: number, longitude: number): Promise<'low' | 'medium' | 'high'> {
    try {
      // In a real implementation, this would integrate with crime databases
      // For now, using time of day and location type as proxies
      
      const hour = new Date().getHours();
      const isNightTime = hour >= 22 || hour <= 5;
      
      // Get location details
      const location = await this.reverseGeocode(latitude, longitude);
      const placeTypes = location?.placeType || [];
      
      // Higher risk for certain place types at night
      const highRiskPlaces = ['poi', 'address'];
      const isHighRiskPlace = placeTypes.some(type => highRiskPlaces.includes(type));
      
      if (isNightTime && isHighRiskPlace) return 'high';
      if (isNightTime || isHighRiskPlace) return 'medium';
      return 'low';
      
    } catch (error) {
      console.error('[MapboxService] Risk assessment error:', error);
      return 'medium';
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && !!this.accessToken;
  }

  /**
   * Get current location (cached)
   */
  getCurrentLocation(): { latitude: number; longitude: number } | null {
    return this.currentLocation;
  }

  /**
   * Update current location
   */
  updateCurrentLocation(latitude: number, longitude: number): void {
    this.currentLocation = { latitude, longitude };
  }
}

export const mapboxService = new MapboxService();
