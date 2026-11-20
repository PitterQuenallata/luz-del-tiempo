export type WidgetsTab = 'cards' | 'charts' | 'banners' | 'activity';

export interface PaymentGatewayStat {
  id: string;
  name: string;
  subtitle: string;
  volume: number;
  processedCount: number;
  status: 'active' | 'warning' | 'standby';
  trend: string;
}

export interface SystemEventStat {
  id: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  status: 'completed' | 'in_progress' | 'scheduled';
  timestamp: string;
}

export interface MetricSparkline {
  label: string;
  value: string;
  percentageChange: string;
  isPositive: boolean;
  history: number[];
}

export interface CloudExpense {
  provider: string;
  allocation: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface LiveDeploymentStep {
  id: string;
  name: string;
  duration: string;
  status: 'completed' | 'active' | 'pending';
}
