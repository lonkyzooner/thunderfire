// OfficerMap.tsx
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Mapbox public access token from environment variable (managed by Doppler)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ""; // Replace with a valid Mapbox access token if VITE_MAPBOX_TOKEN is not set. See https://docs.mapbox.com/api/overview/#access-tokens-and-token-scopes

type Location = {
  latitude: number;
  longitude: number;
  address?: string;
};

const DEFAULT_LOCATION: Location = {
  latitude: 30.4515, // Baton Rouge, LA
  longitude: -91.1871,
};

import { CommandResponse } from "../lib/openai-service";

interface OfficerMapProps {
  onLocationChange?: (cityState: string) => void;
  mapCommand?: CommandResponse | null;
}

const OfficerMap: React.FC<OfficerMapProps> = ({ onLocationChange, mapCommand }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);

  // Handle map commands from LLM/voice
  useEffect(() => {
    if (mapCommand && mapCommand.action) {
      // Example: handle "show_location" action
      if (mapCommand.action === "show_location" && mapCommand.parameters && mapCommand.parameters.latitude && mapCommand.parameters.longitude) {
        setLocation((prev) => ({
          ...prev,
          latitude: Number(mapCommand.parameters.latitude),
          longitude: Number(mapCommand.parameters.longitude),
        }));
      }
      // Add more actions as needed (e.g., plot_perimeter, highlight_route, etc.)
      // For now, just log the command
      // eslint-disable-next-line no-console
      console.log("Received map command:", mapCommand);
    }
  }, [mapCommand]);

  // Watch position for real-time updates
  useEffect(() => {
    let watchId: number | null = null;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
        },
        () => setLocation(DEFAULT_LOCATION),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Fetch address using Mapbox Geocoding API
  useEffect(() => {
    async function fetchAddress(lat: number, lng: number) {
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await resp.json();
      if (data.features && data.features.length > 0) {
        setLocation((prev) => ({
          ...prev,
          address: data.features[0].place_name,
        }));
      }
    }
    fetchAddress(location.latitude, location.longitude);
  }, [location.latitude, location.longitude]);

  // Notify parent of city/state when address changes
  useEffect(() => {
    if (onLocationChange && location.address) {
      // Try to extract "City, State" from the address string
      // Example: "Baton Rouge, Louisiana, United States"
      const parts = location.address.split(',');
      if (parts.length >= 2) {
        const city = parts[0].trim();
        const state = parts[1].trim();
        onLocationChange(`${city}, ${state}`);
      } else {
        onLocationChange(location.address);
      }
    }
  }, [location.address, onLocationChange]);

  // Initialize and update map
  useEffect(() => {
    if (mapContainer.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [location.longitude, location.latitude],
        zoom: 14,
      });

      // Add marker
      new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat([location.longitude, location.latitude])
        .addTo(mapRef.current);
    } else if (mapRef.current) {
      mapRef.current.setCenter([location.longitude, location.latitude]);
      // Remove old markers and add new one
      const markers = document.getElementsByClassName("officer-marker");
      while (markers[0]) markers[0].parentNode?.removeChild(markers[0]);
      new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat([location.longitude, location.latitude])
        .getElement().classList.add("officer-marker");
      new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat([location.longitude, location.latitude])
        .addTo(mapRef.current);
    }
  }, [location.latitude, location.longitude]);

  return (
    <div
      className="w-full max-w-xl mx-auto mb-6 rounded-2xl overflow-hidden shadow border border-gray-200"
      style={{ height: 320 }}
    >
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      <div className="absolute left-0 right-0 bottom-2 flex justify-center pointer-events-none">
        <div className="bg-white/90 text-gray-800 px-4 py-1 rounded shadow text-sm pointer-events-auto">
          {location.address
            ? `Current location: ${location.address}`
            : `Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}`}
        </div>
      </div>
    </div>
  );
};

export default OfficerMap;