import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { MetricCard } from '@/components/MetricCard';
import { Chat } from '@/components/Chat';
import Nav from '@/components/Nav';
import { IngestionButton } from '@/components/IngestionButton';
import { ClientMap } from '@/components/ClientMap';
import { DeleteProjectButton } from '@/components/DeleteProjectButton';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Project Details - Mietchecker',
  description: 'View detailed property analysis and metrics',
};

type Metric = {
  name: string;
  value: number | string;
  score: number;
  interpretation: string;
  icon: string;
};

type ProjectDetail = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  score: number;
  metrics: Metric[];
  lastUpdated: string;
  ingestionStatus?: string;
};

async function getProject(id: string): Promise<ProjectDetail | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return null;
    }

    // Fetch metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('project_metrics')
      .select('*')
      .eq('project_id', id)
      .order('fetched_at', { ascending: false });

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
    }

    // Filter to get only the most recent metric for each metric_key
    const latestMetrics = metrics?.reduce((acc, metric) => {
      if (!acc[metric.metric_key]) {
        acc[metric.metric_key] = metric;
      }
      return acc;
    }, {} as Record<string, typeof metrics[0]>);

    const uniqueMetrics = latestMetrics ? Object.values(latestMetrics) : [];

    // Transform data to match ProjectDetail type
    return {
      id: project.id,
      name: project.title,
      address: project.address || '',
      latitude: project.latitude || 0,
      longitude: project.longitude || 0,
      score: project.overall_score || 0,
      metrics: uniqueMetrics.map((m) => ({
        name: m.metric_key,
        value: m.metric_value || 0,
        score: m.normalized_score || 0,
        interpretation: '', // Can be computed from score
        icon: m.metric_key,
      })),
      lastUpdated: project.updated_at,
    };
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return null;
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations();
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <Nav />
        <main className="container mx-auto px-4 py-12">
          <Link href="/dashboard" className="mb-8">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>
          </Link>
          <div className="glass-strong rounded-2xl p-12 text-center">
            <h1 className="text-2xl font-semibold mb-2">
              {t('errors.notFound')}
            </h1>
            <p className="text-muted-foreground mb-6">
              The project you are looking for does not exist.
            </p>
            <Link href="/dashboard">
              <Button>{t('common.back')}</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const scoreColor = project.score >= 75 ? 'text-green-500' : project.score >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Nav />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>
          </Link>
          <DeleteProjectButton projectId={id} projectName={project.name} />
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
              <p className="text-lg text-muted-foreground">{project.address}</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${scoreColor}`}>
                {project.score}
              </div>
              <p className="text-muted-foreground text-sm">
                {t('project.score')}
              </p>
            </div>
          </div>
        </div>

        {/* Map */}
        <Card className="mb-8 glass-strong overflow-hidden">
          <CardContent className="p-0">
            <ClientMap
              latitude={project.latitude}
              longitude={project.longitude}
              title={project.name}
            />
          </CardContent>
        </Card>

        {/* Ingestion Button */}
        <div className="flex gap-4 mb-8">
          <IngestionButton
            projectId={id}
            hasCoordinates={!!(project.latitude && project.longitude)}
            address={project.address}
          />
          {project.lastUpdated && (
            <p className="text-sm text-muted-foreground flex items-center">
              {t('metrics.fetchedAt')}: {new Date(project.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('project.metrics')}</h2>
          {project.metrics && project.metrics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {project.metrics.map((metric, index) => (
                <MetricCard
                  key={index}
                  name={metric.name}
                  value={metric.value}
                  score={metric.score}
                  interpretation={metric.interpretation}
                  icon={metric.icon}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-strong">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {t('metrics.noData')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('project.chat')}</h2>
          <Card className="glass-strong">
            <CardContent className="p-6">
              <Chat projectId={id} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
