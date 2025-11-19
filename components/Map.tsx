'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  latitude: number;
  longitude: number;
  title: string;
}

export default function Map({ latitude, longitude, title }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([latitude, longitude], 15);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // Add marker
      L.marker([latitude, longitude])
        .bindPopup(title)
        .openPopup()
        .addTo(map.current);
    } else {
      // Update map if coordinates change
      map.current.setView([latitude, longitude], 15);
    }

    return () => {
      // Cleanup on unmount is handled by Next.js
    };
  }, [latitude, longitude, title]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-96 rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
}
