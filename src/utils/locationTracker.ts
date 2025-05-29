/**
 * Location Tracking Utility for LARK
 *
 * Uses browser geolocation if available, otherwise falls back to Baton Rouge, LA.
 * Publishes location data to Supabase for realtime tracking.
 */

import { supabase } from '../services/supabaseClient';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationHistoryEntry extends LocationData {
  id: string;
}

export interface OfficerLocationRecord {
  id?: string;
  officer_id: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  status: string;
  incident_id?: string;
}

/**
 * Resolve with a fallback location (Baton Rouge, LA by default for law enforcement context)
 * @param resolve - Promise resolver function
 */
export function resolveFallbackLocation(resolve: (location: LocationData | null) => void): void {
  // Default to Baton Rouge, LA (central Louisiana location for law enforcement context)
  const fallbackLocation: LocationData = {
    latitude: 30.4515,
    longitude: -91.1871,
    accuracy: 1000, // Low accuracy indicator
    timestamp: Date.now(),
    address: 'Baton Rouge, Louisiana' // Hardcoded address
  };
  resolve(fallbackLocation);
}

/**
 * Attempts to get the user's current location using the browser geolocation API.
 * Falls back to Baton Rouge, LA if permission is denied or unavailable.
 */
export function getCurrentLocation(): Promise<LocationData | null> {
  return new Promise((resolve) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
          resolve({
            latitude,
            longitude,
            accuracy: accuracy || undefined,
            altitude: altitude || undefined,
            heading: heading || undefined,
            speed: speed || undefined,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          // On error (denied, unavailable, etc.), use fallback
          resolveFallbackLocation(resolve);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      // Geolocation not supported, use fallback
      resolveFallbackLocation(resolve);
    }
  });
}

/**
 * Publishes officer location to Supabase realtime channel
 */
export async function publishOfficerLocation(
  officerId: string, 
  locationData: LocationData,
  status: string = 'active',
  incidentId?: string
): Promise<boolean> {
  try {
    const locationRecord: Omit<OfficerLocationRecord, 'id'> = {
      officer_id: officerId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      altitude: locationData.altitude,
      accuracy: locationData.accuracy,
      heading: locationData.heading,
      speed: locationData.speed,
      status,
      incident_id: incidentId,
    };

    const { data, error } = await supabase
      .from('officer_locations')
      .insert([locationRecord])
      .select();

    if (error) {
      console.error('Error publishing location:', error.message);
      return false;
    }

    console.log('Location published successfully:', data);
    return true;
  } catch (error) {
    console.error('Error publishing location:', error);
    return false;
  }
}

/**
 * Location Tracker Class for continuous location publishing
 */
export class LocationTracker {
  private intervalId: number | null = null;
  private isTracking = false;
  private officerId: string;
  private status: string;
  private incidentId?: string;

  constructor(officerId: string, status: string = 'active', incidentId?: string) {
    this.officerId = officerId;
    this.status = status;
    this.incidentId = incidentId;
  }

  /**
   * Start continuous location tracking with 5-second intervals
   */
  async startTracking(): Promise<void> {
    if (this.isTracking) {
      console.warn('Location tracking is already active');
      return;
    }

    console.log('Starting location tracking for officer:', this.officerId);
    this.isTracking = true;

    // Publish immediately
    await this.publishCurrentLocation();

    // Set up 5-second interval
    this.intervalId = window.setInterval(async () => {
      if (this.isTracking) {
        await this.publishCurrentLocation();
      }
    }, 5000);
  }

  /**
   * Stop location tracking
   */
  stopTracking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isTracking = false;
    console.log('Location tracking stopped for officer:', this.officerId);
  }

  /**
   * Update tracking parameters
   */
  updateParams(status?: string, incidentId?: string): void {
    if (status !== undefined) this.status = status;
    if (incidentId !== undefined) this.incidentId = incidentId;
  }

  /**
   * Get current tracking status
   */
  getTrackingStatus(): { isTracking: boolean; officerId: string; status: string; incidentId?: string } {
    return {
      isTracking: this.isTracking,
      officerId: this.officerId,
      status: this.status,
      incidentId: this.incidentId
    };
  }

  /**
   * Private method to publish current location
   */
  private async publishCurrentLocation(): Promise<void> {
    try {
      const locationData = await getCurrentLocation();
      if (locationData) {
        const success = await publishOfficerLocation(
          this.officerId,
          locationData,
          this.status,
          this.incidentId
        );
        
        if (!success) {
          console.warn('Failed to publish location data');
        }
      }
    } catch (error) {
      console.error('Error in location tracking:', error);
    }
  }
}

/**
 * Global instance for easy access (can be initialized when officer logs in)
 */
let globalLocationTracker: LocationTracker | null = null;

/**
 * Initialize global location tracker
 */
export function initializeLocationTracking(
  officerId: string, 
  status: string = 'active', 
  incidentId?: string
): LocationTracker {
  if (globalLocationTracker) {
    globalLocationTracker.stopTracking();
  }
  
  globalLocationTracker = new LocationTracker(officerId, status, incidentId);
  return globalLocationTracker;
}

/**
 * Get the global location tracker instance
 */
export function getLocationTracker(): LocationTracker | null {
  return globalLocationTracker;
}

/**
 * Start global location tracking
 */
export async function startGlobalLocationTracking(): Promise<void> {
  if (globalLocationTracker) {
    await globalLocationTracker.startTracking();
  } else {
    console.warn('Location tracker not initialized. Call initializeLocationTracking first.');
  }
}

/**
 * Stop global location tracking
 */
export function stopGlobalLocationTracking(): void {
  if (globalLocationTracker) {
    globalLocationTracker.stopTracking();
  }
}
