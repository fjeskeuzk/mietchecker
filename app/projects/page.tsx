import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Plus, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Projects - Mietchecker',
  description: 'View all your property projects',
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

export default async function ProjectsPage() {
  const t = await getTranslations();
  const projects = await getProjects();

  const getScoreColor = (score: number) => {
    return score >= 75 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    return score >= 75
      ? 'bg-green-50 dark:bg-green-950/30'
      : score >= 50
        ? 'bg-yellow-50 dark:bg-yellow-950/30'
        : 'bg-red-50 dark:bg-red-950/30';
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
          <div className="glass-strong rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/50">
                  <tr className="text-left">
                    <th className="px-6 py-4 font-semibold text-sm">Project</th>
                    <th className="px-6 py-4 font-semibold text-sm hidden md:table-cell">Address</th>
                    <th className="px-6 py-4 font-semibold text-sm text-center">Score</th>
                    <th className="px-6 py-4 font-semibold text-sm hidden lg:table-cell">Last Updated</th>
                    <th className="px-6 py-4 font-semibold text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium">{project.name}</div>
                        <div className="md:hidden flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          {project.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {project.address || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <div className={`${getScoreBgColor(project.score)} px-4 py-2 rounded-lg`}>
                            <span className={`text-lg font-bold ${getScoreColor(project.score)}`}>
                              {project.score}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-sm text-muted-foreground">
                        {new Date(project.lastUpdated).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/projects/${project.id}`}>
                          <Button size="sm" variant="ghost" className="group">
                            View
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
