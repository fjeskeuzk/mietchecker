'use client';

import { useTranslations } from 'next-intl';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Nav from '@/components/Nav';

export default function BillingPage() {
  const t = useTranslations();

  const features = {
    free: [
      t('billing.features.free.projects'),
      t('billing.features.free.chat'),
      t('billing.features.free.updates'),
    ],
    premium: [
      t('billing.features.premium.projects'),
      t('billing.features.premium.chat'),
      t('billing.features.premium.updates'),
      t('billing.features.premium.export'),
      t('billing.features.premium.priority'),
    ],
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to initiate checkout:', error);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to access billing portal:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Nav />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">{t('billing.title')}</h1>
          <p className="text-lg text-muted-foreground">
            Choose the perfect plan for your needs
          </p>
        </div>

        {/* Current Plan Section */}
        <Card className="glass-strong mb-12">
          <CardHeader>
            <CardTitle>{t('billing.plan')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{t('billing.free')}</p>
                <p className="text-muted-foreground">You are currently on the free plan</p>
              </div>
              <Button onClick={handleUpgrade}>
                {t('billing.upgrade')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <Card className="glass overflow-hidden relative">
            <CardHeader>
              <CardTitle>{t('billing.free')}</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-bold mb-2">0</div>
                <p className="text-muted-foreground">EUR / month</p>
              </div>

              <ul className="space-y-3">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="glass-strong overflow-hidden relative border-2 border-primary">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold rounded-bl-lg">
              Popular
            </div>
            <CardHeader>
              <CardTitle>{t('billing.premium')}</CardTitle>
              <CardDescription>For power users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-bold mb-2">
                  9,99
                  <span className="text-lg text-muted-foreground">EUR</span>
                </div>
                <p className="text-muted-foreground">per month</p>
              </div>

              <ul className="space-y-3">
                {features.premium.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full group" onClick={handleUpgrade}>
                {t('billing.upgrade')}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Billing Management */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Manage Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Update your payment method, view billing history, and manage your subscription.
            </p>
            <Button onClick={handleManageBilling}>
              {t('billing.manage')}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
