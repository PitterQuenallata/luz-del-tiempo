import { PaymentGatewayStat, SystemEventStat, MetricSparkline, CloudExpense } from '../types/widgets.types';

export const paymentGatewaysData: PaymentGatewayStat[] = [
  {
    id: 'gw-1',
    name: 'Stripe Connect Enterprise',
    subtitle: 'Cobros recurrentes y suscripciones SaaS',
    volume: 124850.0,
    processedCount: 1842,
    status: 'active',
    trend: '+14.2%',
  },
  {
    id: 'gw-2',
    name: 'PayPal Global Business',
    subtitle: 'Pagos directos y facturación internacional',
    volume: 38420.5,
    processedCount: 512,
    status: 'active',
    trend: '+8.1%',
  },
  {
    id: 'gw-3',
    name: 'Apple Pay Direct Checkout',
    subtitle: 'Transacciones móviles tokenizadas',
    volume: 64120.0,
    processedCount: 940,
    status: 'active',
    trend: '+22.5%',
  },
  {
    id: 'gw-4',
    name: 'Transferencia SWIFT / SEPA',
    subtitle: 'Grandes cuentas corporativas e invoices',
    volume: 245000.0,
    processedCount: 28,
    status: 'standby',
    trend: '+5.0%',
  },
];

export const systemEventsData: SystemEventStat[] = [
  {
    id: 'ev-1',
    title: 'Backup Automatizado Base de Datos',
    subtitle: 'Snapshot WAL generado y cifrado en AWS S3',
    durationMinutes: 4,
    status: 'completed',
    timestamp: 'Hace 12 min',
  },
  {
    id: 'ev-2',
    title: 'Vacuum y Reindexación PostgreSQL',
    subtitle: 'Mantenimiento preventivo en cluster Frankfurt',
    durationMinutes: 18,
    status: 'completed',
    timestamp: 'Hace 45 min',
  },
  {
    id: 'ev-3',
    title: 'Rotación de Certificados mTLS',
    subtitle: 'Actualización de credenciales entre microservicios',
    durationMinutes: 8,
    status: 'in_progress',
    timestamp: 'En curso',
  },
  {
    id: 'ev-4',
    title: 'Depuración de Caché Redis L2',
    subtitle: 'Purga de sesiones inactivas de más de 30 días',
    durationMinutes: 2,
    status: 'completed',
    timestamp: 'Hace 2 horas',
  },
  {
    id: 'ev-5',
    title: 'Verificación de Integridad de Auditoría SOX',
    subtitle: 'Escaneo de firmas SHA-256 en bloques de logs',
    durationMinutes: 15,
    status: 'scheduled',
    timestamp: 'Programado 03:00 UTC',
  },
];

export const metricsSparklinesData: MetricSparkline[] = [
  {
    label: 'Uso de Memoria Heap Node.js',
    value: '1.42 GB / 2.0 GB',
    percentageChange: '-8.5%',
    isPositive: true,
    history: [1.82, 1.75, 1.68, 1.55, 1.50, 1.45, 1.42],
  },
  {
    label: 'Throughput de Peticiones API',
    value: '14,820 req/min',
    percentageChange: '+24.1%',
    isPositive: true,
    history: [8200, 9400, 11200, 10800, 12900, 13800, 14820],
  },
  {
    label: 'Latencia Media en Edge (p99)',
    value: '28.4 ms',
    percentageChange: '-12.8%',
    isPositive: true, // latency reduction is positive
    history: [42, 38, 36, 32, 30, 29, 28],
  },
  {
    label: 'Tasa de Error HTTP 5xx',
    value: '0.012%',
    percentageChange: '-40.0%',
    isPositive: true,
    history: [0.035, 0.028, 0.022, 0.018, 0.015, 0.013, 0.012],
  },
];

export const cloudExpensesData: CloudExpense[] = [
  {
    provider: 'AWS Cloud Infrastructure',
    allocation: 'Cómputo EKS, RDS Aurora y buckets S3',
    amount: 14250.0,
    percentage: 52,
    color: 'bg-primary',
  },
  {
    provider: 'Cloudflare Enterprise Edge',
    allocation: 'WAF, mitigación DDoS y workers CDN',
    amount: 5400.0,
    percentage: 20,
    color: 'bg-amber-500',
  },
  {
    provider: 'Datadog & New Relic APM',
    allocation: 'Monitoreo de trazas y alertas de latencia',
    amount: 4320.0,
    percentage: 16,
    color: 'bg-indigo-500',
  },
  {
    provider: 'OpenAI Enterprise API',
    allocation: 'Inferencia de embeddings y categorización',
    amount: 3200.0,
    percentage: 12,
    color: 'bg-emerald-500',
  },
];
