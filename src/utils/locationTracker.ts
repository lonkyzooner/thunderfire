/**
 * Location Tracking Utility for LARK
 *
 * Uses browser geolocation if available, otherwise falls back to Baton Rouge, LA.
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

export interface LocationHistoryEntry extends LocationData {
  id: string;
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
          const { latitude, longitude, accuracy } = position.coords;
          resolve({
            latitude,
            longitude,
            accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
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
