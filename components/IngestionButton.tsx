'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Zap, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/use-toast';

interface IngestionButtonProps {
  projectId: string;
  hasCoordinates: boolean;
  address?: string;
}

export function IngestionButton({ projectId, hasCoordinates, address }: IngestionButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleIngestion = async () => {
    setIsLoading(true);

    try {
      // If no coordinates but we have an address, try to geocode first
      if (!hasCoordinates && address) {
        toast({
          title: 'Geocodierung läuft...',
          description: 'Versuche Koordinaten aus der Adresse zu ermitteln',
        });

        const geocodeResponse = await fetch('/api/geocode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address }),
        });

        const geocodeData = await geocodeResponse.json();

        if (geocodeResponse.ok) {
          // Update project with coordinates
          await fetch(`/api/projects/${projectId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude: geocodeData.latitude,
              longitude: geocodeData.longitude,
            }),
          });

          toast({
            title: 'Koordinaten gefunden!',
            description: 'Starte Datenabfrage...',
          });
        }
      }

      const response = await fetch(`/api/projects/${projectId}/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      toast({
        title: t('project.ingestionComplete'),
        description: `${data.metrics_count} Metriken erfolgreich abgerufen. Gesamtbewertung: ${Math.round(data.overall_score)}`,
      });

      // Refresh the page to show new data
      router.refresh();
    } catch (error) {
      console.error('Ingestion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten';
      const description = errorMessage.includes('coordinates')
        ? 'Bitte fügen Sie GPS-Koordinaten zu diesem Projekt hinzu, um Daten abzurufen.'
        : errorMessage;

      toast({
        title: t('project.ingestionFailed'),
        description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="flex items-center gap-2"
      onClick={handleIngestion}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('project.ingestionRunning')}
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          {t('project.startIngestion')}
        </>
      )}
    </Button>
  );
}
