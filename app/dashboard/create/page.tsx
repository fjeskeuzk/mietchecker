'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Nav from '@/components/Nav';
import { toast } from '@/components/ui/use-toast';

export default function CreateProjectPage() {
  const t = useTranslations();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleGeocodeAddress = async () => {
    if (!address.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie eine Adresse ein',
        variant: 'destructive',
      });
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Geocodierung fehlgeschlagen',
          description: data.error || 'Koordinaten konnten nicht gefunden werden',
          variant: 'destructive',
        });
        return;
      }

      setLatitude(data.latitude.toString());
      setLongitude(data.longitude.toString());

      toast({
        title: 'Koordinaten gefunden!',
        description: `${data.displayName}`,
      });
    } catch (err) {
      toast({
        title: 'Fehler',
        description: 'Geocodierung fehlgeschlagen',
        variant: 'destructive',
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const body: {
        title: string;
        address?: string;
        latitude?: number;
        longitude?: number;
      } = {
        title,
      };

      if (address) body.address = address;
      if (latitude && longitude) {
        body.latitude = parseFloat(latitude);
        body.longitude = parseFloat(longitude);
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create project');
        return;
      }

      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Nav />

      <main className="container mx-auto px-4 py-12">
        <Link href="/dashboard" className="mb-8 inline-block">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="text-3xl">{t('project.create')}</CardTitle>
              <CardDescription>
                Erstellen Sie ein neues Immobilienprojekt für die Analyse
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {t('project.name')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="z.B. Wohnung in Berlin Mitte"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('project.address')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      type="text"
                      placeholder="z.B. Alexanderplatz 1, 10178 Berlin"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={isLoading || isGeocoding}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGeocodeAddress}
                      disabled={isLoading || isGeocoding || !address.trim()}
                      className="shrink-0"
                    >
                      {isGeocoding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Klicken Sie auf das Pin-Symbol, um automatisch Koordinaten zu finden
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('project.coordinates')}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Breitengrad"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        disabled={isLoading}
                        className={latitude ? 'border-green-500' : ''}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Längengrad"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        disabled={isLoading}
                        className={longitude ? 'border-green-500' : ''}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {latitude && longitude
                      ? '✓ Koordinaten sind gesetzt - Daten können abgerufen werden'
                      : 'Koordinaten werden für die Datenabfrage benötigt'}
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isLoading || !title} className="flex-1">
                    {isLoading ? t('common.loading') : t('project.create')}
                  </Button>
                  <Link href="/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      {t('common.cancel')}
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
