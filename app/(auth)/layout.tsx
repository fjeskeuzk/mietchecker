import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - Mietchecker',
  description: 'Login or signup to Mietchecker',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
