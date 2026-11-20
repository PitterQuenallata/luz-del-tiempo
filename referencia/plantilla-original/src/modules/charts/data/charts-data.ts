import {
  AreaSeriesPoint,
  BarComparisonItem,
  RadialMetricRing,
  DonutSegment,
  FinancialCandle,
} from '../types/charts.types';

export const areaSeriesData: AreaSeriesPoint[] = [
  { date: '01 Oct', revenue: 14200, expenses: 8100, netProfit: 6100 },
  { date: '05 Oct', revenue: 16800, expenses: 8400, netProfit: 8400 },
  { date: '09 Oct', revenue: 15400, expenses: 7900, netProfit: 7500 },
  { date: '13 Oct', revenue: 19800, expenses: 9200, netProfit: 10600 },
  { date: '17 Oct', revenue: 22400, expenses: 9800, netProfit: 12600 },
  { date: '21 Oct', revenue: 21100, expenses: 9300, netProfit: 11800 },
  { date: '25 Oct', revenue: 26500, expenses: 10400, netProfit: 16100 },
  { date: '29 Oct', revenue: 29800, expenses: 11200, netProfit: 18600 },
];

export const barComparisonData: BarComparisonItem[] = [
  { month: 'Ene', currentYear: 42000, previousYear: 31000, targetQuota: 40000 },
  { month: 'Feb', currentYear: 46000, previousYear: 33000, targetQuota: 42000 },
  { month: 'Mar', currentYear: 51000, previousYear: 38000, targetQuota: 45000 },
  { month: 'Abr', currentYear: 49000, previousYear: 39000, targetQuota: 48000 },
  { month: 'May', currentYear: 58000, previousYear: 41000, targetQuota: 52000 },
  { month: 'Jun', currentYear: 64000, previousYear: 46000, targetQuota: 55000 },
  { month: 'Jul', currentYear: 61000, previousYear: 47000, targetQuota: 58000 },
  { month: 'Ago', currentYear: 69000, previousYear: 50000, targetQuota: 62000 },
  { month: 'Sep', currentYear: 74000, previousYear: 53000, targetQuota: 65000 },
  { month: 'Oct', currentYear: 82000, previousYear: 59000, targetQuota: 70000 },
  { month: 'Nov', currentYear: 88000, previousYear: 64000, targetQuota: 75000 },
  { month: 'Dic', currentYear: 95000, previousYear: 71000, targetQuota: 80000 },
];

export const appleActivityRings: RadialMetricRing[] = [
  {
    id: 'ring-cpu',
    label: 'Cómputo CPU (Clúster Principal)',
    current: 78,
    target: 100,
    unit: '%',
    percentage: 78,
    strokeColor: '#FF2D55', // Apple Activity Red
    bgStrokeColor: 'rgba(255, 45, 85, 0.2)',
    description: '18 de 24 núcleos dedicados en régimen nominal',
  },
  {
    id: 'ring-ram',
    label: 'Reserva de Memoria ECC',
    current: 92,
    target: 100,
    unit: '%',
    percentage: 92,
    strokeColor: '#30D158', // Apple Activity Green
    bgStrokeColor: 'rgba(48, 209, 88, 0.2)',
    description: '118 GB de 128 GB asignados a instancias activas',
  },
  {
    id: 'ring-network',
    label: 'Rendimiento Red Edge CDN',
    current: 64,
    target: 100,
    unit: '%',
    percentage: 64,
    strokeColor: '#0A84FF', // Apple Activity Blue / Cyan
    bgStrokeColor: 'rgba(10, 132, 255, 0.2)',
    description: 'Ancho de banda 640 Mbps sobre 1 Gbps asignado',
  },
];

export const cloudStorageDonut: DonutSegment[] = [
  {
    id: 's3',
    label: 'S3 Object Storage',
    value: 48.5,
    percentage: 45,
    color: '#007AFF',
    legendDescription: 'Imágenes, respaldos WORM y assets estáticos',
  },
  {
    id: 'rds',
    label: 'PostgreSQL RDS HA',
    value: 28.2,
    percentage: 26,
    color: '#5856D6',
    legendDescription: 'Bases de datos relacionales primarias y réplicas',
  },
  {
    id: 'redis',
    label: 'Redis ElastiCache',
    value: 16.0,
    percentage: 15,
    color: '#FF9500',
    legendDescription: 'Caché distribuida de baja latencia en memoria',
  },
  {
    id: 'cdn',
    label: 'Edge Point Cache',
    value: 15.3,
    percentage: 14,
    color: '#34C759',
    legendDescription: 'Nodos perimetrales Cloudflare / CloudFront',
  },
];

export const financialCandlesData: FinancialCandle[] = [
  { id: 'c1', date: 'Lun 23', open: 142.1, high: 148.5, low: 141.0, close: 147.2, volume: 4800, isBullish: true },
  { id: 'c2', date: 'Mar 24', open: 147.2, high: 151.0, low: 146.5, close: 150.8, volume: 5300, isBullish: true },
  { id: 'c3', date: 'Mié 25', open: 150.8, high: 152.4, low: 145.0, close: 146.1, volume: 6100, isBullish: false },
  { id: 'c4', date: 'Jue 26', open: 146.1, high: 149.0, low: 144.8, close: 148.6, volume: 4200, isBullish: true },
  { id: 'c5', date: 'Vie 27', open: 148.6, high: 154.2, low: 148.0, close: 153.5, volume: 7200, isBullish: true },
  { id: 'c6', date: 'Sáb 28', open: 153.5, high: 156.0, low: 152.0, close: 155.1, volume: 3900, isBullish: true },
  { id: 'c7', date: 'Dom 29', open: 155.1, high: 158.4, low: 154.0, close: 157.9, volume: 4100, isBullish: true },
];
