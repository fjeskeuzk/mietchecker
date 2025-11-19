'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface ClientMapProps {
  latitude: number;
  longitude: number;
  title: string;
}

export function ClientMap({ latitude, longitude, title }: ClientMapProps) {
  return <Map latitude={latitude} longitude={longitude} title={title} />;
}
