import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Plus, TrendingUp, TrendingDown, BarChart3, Home, AlertCircle, Clock, Award, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ProjectCard } from '@/components/ProjectCard';
import Nav from '@/components/Nav';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Dashboard - Mietchecker',
  description: 'Manage your property projects',
};

type Project = {
  id: string;
  name: string;
  address: string;
  score: number;
  lastUpdated: string;
};

async function getProjects(): Promise<Project[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    // Transform to match Project type
    return (projects || []).map((p) => ({
      id: p.id,
      name: p.title,
      address: p.address || '',
      score: p.overall_score || 0,
      lastUpdated: p.updated_at,
    }));
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return [];
  }
}

export default async function DashboardPage() {
  const t = await getTranslations();
  const projects = await getProjects();

  // Calculate statistics
  const totalProjects = projects.length;
  const projectsWithScores = projects.filter(p => p.score > 0);
  const averageScore = projectsWithScores.length > 0
    ? Math.round(projectsWithScores.reduce((sum, p) => sum + p.score, 0) / projectsWithScores.length)
    : 0;

  const bestProperty = projects.reduce((best, p) =>
    p.score > (best?.score || 0) ? p : best, projects[0]
  );

  const worstProperty = projects.reduce((worst, p) =>
    p.score < (worst?.score || 100) && p.score > 0 ? p : worst, projects[0]
  );

  const projectsNeedingAttention = projects.filter(p => p.score === 0);

  const recentlyUpdated = [...projects]
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 3);

  const getScoreColor = (score: number) => {
    return score >= 75 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Nav />

      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <Link href="/dashboard/create">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('dashboard.createProject')}
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="glass-strong rounded-2xl p-16 text-center max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              {t('dashboard.noProjects')}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t('dashboard.noProjectsDescription')}
            </p>
            <Link href="/dashboard/create">
              <Button size="lg">
                {t('dashboard.createProject')}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProjects}</div>
                  <p className="text-xs text-muted-foreground">
                    {projectsWithScores.length} with metrics
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                    {averageScore}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all properties
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Best Property</CardTitle>
                  <Award className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {bestProperty?.score || 0}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {bestProperty?.name || 'N/A'}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectsNeedingAttention.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Properties without metrics
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Best and Worst Properties Highlights */}
            {projectsWithScores.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Best Property */}
                {bestProperty && bestProperty.score > 0 && (
                  <Card className="glass-strong border-green-500/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          Top Performer
                        </CardTitle>
                        <div className="text-3xl font-bold text-green-500">
                          {bestProperty.score}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold text-lg mb-2">{bestProperty.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4" />
                        {bestProperty.address}
                      </div>
                      <Link href={`/projects/${bestProperty.id}`}>
                        <Button className="w-full">View Details</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {/* Worst Property */}
                {worstProperty && worstProperty.score > 0 && worstProperty.id !== bestProperty?.id && (
                  <Card className="glass-strong border-red-500/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <TrendingDown className="w-5 h-5 text-red-500" />
                          Needs Improvement
                        </CardTitle>
                        <div className="text-3xl font-bold text-red-500">
                          {worstProperty.score}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold text-lg mb-2">{worstProperty.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4" />
                        {worstProperty.address}
                      </div>
                      <Link href={`/projects/${worstProperty.id}`}>
                        <Button variant="outline" className="w-full">View Details</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Recent Activity */}
            {recentlyUpdated.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  Recent Activity
                </h2>
                <div className="glass-strong rounded-xl p-6">
                  <div className="space-y-4">
                    {recentlyUpdated.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/20 transition-colors">
                          <div className="flex-1">
                            <h3 className="font-semibold">{project.name}</h3>
                            <p className="text-sm text-muted-foreground">{project.address}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className={`text-xl font-bold ${getScoreColor(project.score)}`}>
                                {project.score}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(project.lastUpdated).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* All Projects Grid */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">All Properties</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    title={project.name}
                    address={project.address}
                    score={project.score}
                    lastUpdated={project.lastUpdated}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
