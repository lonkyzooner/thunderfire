// OfficerMap.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

interface OfficerLocation {
  id: string;
  officer_id: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  status: string;
  incident_id?: string;
  created_at: string;
  updated_at: string;
}

interface ThreatEvent {
  id: string;
  officer_id: string;
  threat_type: string;
  confidence_score: number;
  location_lat?: number;
  location_lng?: number;
  context?: string;
  severity: string;
  acknowledged: boolean;
  created_at: string;
  metadata?: any;
}

interface OfficerMapProps {
  mapCommand?: any; // Optional map command prop
  onLocationChange?: (location: string) => void; // New prop for location change callback
  className?: string;
}

const OfficerMap: React.FC<OfficerMapProps> = ({ 
  mapCommand, 
  onLocationChange, 
  className = '' 
}) => {
  const [officerLocations, setOfficerLocations] = useState<OfficerLocation[]>([]);
  const [threatEvents, setThreatEvents] = useState<ThreatEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show toast notification
  const showToast = useCallback((message: string, duration: number = 5000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  }, []);

  // Handle new officer location updates
  const handleLocationUpdate = useCallback((payload: any) => {
    console.log('[OfficerMap] Location update received:', payload);
    
    const newLocation = payload.new as OfficerLocation;
    
    setOfficerLocations(prev => {
      // Update or add the officer location
      const existingIndex = prev.findIndex(loc => loc.officer_id === newLocation.officer_id);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newLocation;
        return updated;
      } else {
        return [...prev, newLocation];
      }
    });

    // Trigger location change callback if provided
    if (onLocationChange) {
      const locationString = `${newLocation.latitude.toFixed(4)}, ${newLocation.longitude.toFixed(4)}`;
      onLocationChange(locationString);
    }
  }, [onLocationChange]);

  // Handle new threat events
  const handleThreatEvent = useCallback((payload: any) => {
    console.log('[OfficerMap] Threat event received:', payload);
    
    const newThreat = payload.new as ThreatEvent;
    
    setThreatEvents(prev => [newThreat, ...prev.slice(0, 9)]); // Keep last 10 events
    
    // Show toast notification for threat
    const severityColor = newThreat.severity === 'critical' ? '🔴' : 
                         newThreat.severity === 'high' ? '🟠' : 
                         newThreat.severity === 'medium' ? '🟡' : '🟢';
    
    showToast(
      `${severityColor} THREAT ALERT: ${newThreat.threat_type.toUpperCase()} detected (${Math.round(newThreat.confidence_score * 100)}% confidence)`,
      newThreat.severity === 'critical' ? 10000 : 5000
    );
  }, [showToast]);

  // Set up realtime subscriptions
  useEffect(() => {
    console.log('[OfficerMap] Setting up realtime subscriptions...');

    // Subscribe to officer locations
    const locationChannel = supabase
      .channel('officer-locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'officer_locations'
        },
        handleLocationUpdate
      )
      .subscribe((status) => {
        console.log('[OfficerMap] Location channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to threat events
    const threatChannel = supabase
      .channel('threat-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'threat_events'
        },
        handleThreatEvent
      )
      .subscribe((status) => {
        console.log('[OfficerMap] Threat channel status:', status);
      });

    // Load initial data
    const loadInitialData = async () => {
      try {
        // Load recent officer locations
        const { data: locations, error: locError } = await supabase
          .from('officer_locations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (locError) {
          console.error('[OfficerMap] Error loading locations:', locError);
        } else if (locations) {
          // Group by officer_id and keep only the most recent location for each officer
          const latestLocations = locations.reduce((acc, location) => {
            if (!acc[location.officer_id] || 
                new Date(location.created_at) > new Date(acc[location.officer_id].created_at)) {
              acc[location.officer_id] = location;
            }
            return acc;
          }, {} as Record<string, OfficerLocation>);
          
          setOfficerLocations(Object.values(latestLocations));
        }

        // Load recent threat events
        const { data: threats, error: threatError } = await supabase
          .from('threat_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (threatError) {
          console.error('[OfficerMap] Error loading threats:', threatError);
        } else if (threats) {
          setThreatEvents(threats);
        }
      } catch (error) {
        console.error('[OfficerMap] Error loading initial data:', error);
      }
    };

    loadInitialData();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('[OfficerMap] Cleaning up subscriptions...');
      locationChannel.unsubscribe();
      threatChannel.unsubscribe();
    };
  }, [handleLocationUpdate, handleThreatEvent]);

  // Format location for display
  const formatLocation = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  };

  // Get status color for officer
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'busy': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Get severity color for threats
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse max-w-md">
          {toastMessage}
        </div>
      )}

      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
        <h3 className="font-semibold text-lg">Officer Map & Threat Monitor</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Map Area (Placeholder) */}
        <div className="flex-1 bg-gray-200 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <div className="text-lg font-medium">Interactive Map</div>
              <div className="text-sm">Real-time officer locations & threat alerts</div>
              <div className="text-xs mt-2">
                {officerLocations.length} officers • {threatEvents.length} recent threats
              </div>
            </div>
          </div>

          {/* Map Markers (Simulated) */}
          {officerLocations.map((location, index) => (
            <div
              key={location.id}
              className="absolute bg-blue-500 w-4 h-4 rounded-full border-2 border-white shadow-lg"
              style={{
                top: `${20 + (index * 5)}%`,
                left: `${30 + (index * 8)}%`,
                transform: 'translate(-50%, -50%)'
              }}
              title={`Officer ${location.officer_id.slice(-4)} - ${location.status}`}
            >
            </div>
          ))}

          {/* Threat Markers */}
          {threatEvents.map((threat, index) => (
            threat.location_lat && threat.location_lng && (
              <div
                key={threat.id}
                className="absolute bg-red-500 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
                style={{
                  top: `${40 + (index * 7)}%`,
                  left: `${50 + (index * 6)}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                title={`${threat.threat_type} - ${threat.severity}`}
              >
                ⚠
              </div>
            )
          ))}
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l bg-white flex flex-col">
          {/* Officer Locations */}
          <div className="flex-1 p-4">
            <h4 className="font-medium text-gray-800 mb-3">Active Officers ({officerLocations.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {officerLocations.map((location) => (
                <div key={location.id} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Officer {location.officer_id.slice(-4)}</span>
                    <span className={`text-xs ${getStatusColor(location.status)}`}>
                      {location.status}
                    </span>
                  </div>
                  <div className="text-gray-600 text-xs">
                    {formatLocation(location.latitude, location.longitude)}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {new Date(location.updated_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {officerLocations.length === 0 && (
                <div className="text-gray-500 text-sm text-center py-4">
                  No active officers
                </div>
              )}
            </div>
          </div>

          {/* Threat Events */}
          <div className="flex-1 p-4 border-t">
            <h4 className="font-medium text-gray-800 mb-3">Recent Threats ({threatEvents.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {threatEvents.map((threat) => (
                <div key={threat.id} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium capitalize">{threat.threat_type.replace('_', ' ')}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(threat.severity)}`}>
                      {threat.severity}
                    </span>
                  </div>
                  <div className="text-gray-600 text-xs">
                    Confidence: {Math.round(threat.confidence_score * 100)}%
                  </div>
                  {threat.location_lat && threat.location_lng && (
                    <div className="text-gray-600 text-xs">
                      {formatLocation(threat.location_lat, threat.location_lng)}
                    </div>
                  )}
                  <div className="text-gray-500 text-xs">
                    {new Date(threat.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {threatEvents.length === 0 && (
                <div className="text-gray-500 text-sm text-center py-4">
                  No recent threats
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerMap;
