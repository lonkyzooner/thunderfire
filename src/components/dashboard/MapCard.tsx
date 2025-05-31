import React, { useEffect, useState } from 'react';
import { getCurrentLocation, LocationData } from '../../utils/locationTracker';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MapCard: React.FC = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getCurrentLocation().then(loc => {
      if (loc) setLocation(loc);
      else setError('Unable to determine location.');
    });
  }, []);

  // Static map URL (Mapbox or OpenStreetMap)
  let mapUrl = '';
  if (location) {
    const { latitude, longitude } = location;
    if (MAPBOX_TOKEN) {
      mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+285A98(${longitude},${latitude})/${longitude},${latitude},15,0/400x250?access_token=${MAPBOX_TOKEN}`;
    } else {
      // Fallback to OpenStreetMap static
      mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&size=400,250&z=15&l=map&pt=${longitude},${latitude},pm2rdm`;
    }
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-2">Officer Location</h2>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {!location && !error && <div className="text-muted-foreground text-sm">Locating officer...</div>}
      {location && (
        <>
          <div className="mb-2 text-sm text-muted-foreground">
            Latitude: {location.latitude.toFixed(5)}, Longitude: {location.longitude.toFixed(5)}
          </div>
          <img
            src={mapUrl}
            alt="Officer Location Map"
            className="rounded border border-border shadow"
            width={400}
            height={250}
          />
          {location.address && <div className="mt-2 text-xs text-muted-foreground">{location.address}</div>}
        </>
      )}
    </div>
  );
};

export default MapCard;

