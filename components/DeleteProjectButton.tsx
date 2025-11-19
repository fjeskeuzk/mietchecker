'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/use-toast';

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = confirm(
      `Sind Sie sicher, dass Sie "${projectName}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      toast({
        title: 'Projekt gelöscht',
        description: `${projectName} wurde erfolgreich gelöscht.`,
      });

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Fehler beim Löschen',
        description: 'Das Projekt konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="gap-2"
    >
      {isDeleting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Löschen...
        </>
      ) : (
        <>
          <Trash2 className="w-4 h-4" />
          {t('project.delete')}
        </>
      )}
    </Button>
  );
}
