'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ProjectCardProps {
  id: string;
  title: string;
  address: string;
  score: number;
  lastUpdated: string;
}

export function ProjectCard({
  id,
  title,
  address,
  score,
  lastUpdated,
}: ProjectCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();

    const confirmed = confirm(
      `Sind Sie sicher, dass Sie "${title}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      toast({
        title: 'Projekt gelöscht',
        description: `${title} wurde erfolgreich gelöscht.`,
      });

      router.refresh();
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: 'Fehler beim Löschen',
        description: 'Das Projekt konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const scoreColor =
    score >= 75 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';

  const scoreBgColor =
    score >= 75
      ? 'bg-green-50 dark:bg-green-950/20'
      : score >= 50
        ? 'bg-yellow-50 dark:bg-yellow-950/20'
        : 'bg-red-50 dark:bg-red-950/20';

  return (
    <Link href={`/projects/${id}`}>
      <Card className="glass hover:glass-strong transition-all cursor-pointer h-full flex flex-col">
        <CardHeader className="flex-grow">
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-xl">{title}</CardTitle>
            <div className={`text-2xl font-bold ${scoreColor}`}>
              {score}
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {address}
          </div>
        </CardHeader>

        <CardContent>
          <div className={`${scoreBgColor} rounded-lg p-3 mb-4`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Score</span>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-24">
                <div
                  className={`h-full rounded-full transition-all ${scoreColor.replace('text-', 'bg-')}`}
                  style={{ width: `${(score / 100) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(lastUpdated).toLocaleDateString()}
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-2 flex-grow flex items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
          <Button size="sm" className="flex-1 group" disabled={isDeleting}>
            View Details
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
