'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface MetricCardProps {
  name: string;
  value: number | string;
  score: number;
  interpretation: string;
  icon: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  alert: <AlertCircle className="w-8 h-8 text-red-500" />,
  check: <CheckCircle className="w-8 h-8 text-green-500" />,
  warning: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
};

export function MetricCard({
  name,
  value,
  score,
  interpretation,
  icon,
}: MetricCardProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 75) return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
    if (score >= 50) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
  };

  const scoreColor = getScoreColor(score);
  const scoreBgColor = getScoreBgColor(score);

  return (
    <Card className="glass hover:glass-strong transition-all h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {name}
          </CardTitle>
          {ICON_MAP[icon] || <AlertCircle className="w-8 h-8 text-gray-500" />}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Value */}
        <div>
          <p className="text-2xl font-bold">{value}</p>
        </div>

        {/* Score Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Score</span>
            <span className={`text-lg font-bold ${scoreColor}`}>{score}/100</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${scoreColor.replace('text-', 'bg-')}`}
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </div>

        {/* Interpretation */}
        <div className={`p-3 rounded-lg border ${scoreBgColor}`}>
          <p className="text-sm font-medium">{interpretation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
