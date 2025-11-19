import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabaseServer';

export const metadata: Metadata = {
  title: 'Dashboard - Mietchecker',
  description: 'Manage your property projects',
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Double-check authentication (middleware should handle this, but this is a safety measure)
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <>{children}</>;
}
