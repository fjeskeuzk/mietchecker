import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Brain, MessageSquare, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold">Mietchecker</div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Anmelden</Button>
          </Link>
          <Link href="/signup">
            <Button>Jetzt starten</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Finde deine perfekte Wohnung
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          KI-gestützte Immobilienbewertung für deutsche Wohnungssuchende
        </p>
        <Link href="/signup">
          <Button size="lg" className="text-lg px-8 py-6">
            Jetzt kostenlos testen
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Funktionen</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<MapPin className="w-12 h-12" />}
            title="Umfassende Datensammlung"
            description="Sammelt Daten aus OpenStreetMap und öffentlichen Stadtdatensätzen"
          />
          <FeatureCard
            icon={<Brain className="w-12 h-12" />}
            title="KI-Analyse"
            description="Intelligente Bewertung und Empfehlungen mit Gemini AI"
          />
          <FeatureCard
            icon={<MessageSquare className="w-12 h-12" />}
            title="Interaktiver Chat"
            description="Stelle Fragen zu jeder Immobilie und erhalte sofortige Antworten"
          />
          <FeatureCard
            icon={<TrendingUp className="w-12 h-12" />}
            title="Detaillierte Scores"
            description="Bewerte Lärm, Licht, Kriminalität, Internet und mehr"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="glass-strong rounded-2xl p-12 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Bereit, Ihre Traumwohnung zu finden?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Erstellen Sie Ihr erstes Projekt und erhalten Sie sofort detaillierte Analysen
          </p>
          <Link href="/signup">
            <Button size="lg">Kostenlos beginnen</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t">
        <p>&copy; 2024 Mietchecker. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass rounded-xl p-6 text-center hover:glass-strong transition-all">
      <div className="flex justify-center mb-4 text-primary">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
