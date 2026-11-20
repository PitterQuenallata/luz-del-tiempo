export type ChartsSubTab = 'area' | 'bar' | 'radial' | 'financial';

export interface AreaSeriesPoint {
  date: string;
  revenue: number;
  expenses: number;
  netProfit: number;
}

export interface BarComparisonItem {
  month: string;
  currentYear: number;
  previousYear: number;
  targetQuota: number;
}

export interface RadialMetricRing {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  percentage: number;
  strokeColor: string;
  bgStrokeColor: string;
  description: string;
}

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
  legendDescription: string;
}

export interface FinancialCandle {
  id: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isBullish: boolean;
}
