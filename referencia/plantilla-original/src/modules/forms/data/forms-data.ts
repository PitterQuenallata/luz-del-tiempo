import { CountryOption, IndustryOption } from '../types/forms.types';

export const countryOptions: CountryOption[] = [
  { code: 'PE', name: 'Perú', dialCode: '+51' },
  { code: 'MX', name: 'México', dialCode: '+52' },
  { code: 'CO', name: 'Colombia', dialCode: '+57' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'ES', name: 'España', dialCode: '+34' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1' },
];

export const industryOptions: IndustryOption[] = [
  { id: 'fintech', label: 'Fintech & Pagos' },
  { id: 'saas', label: 'Software & SaaS' },
  { id: 'ecommerce', label: 'Comercio Electrónico' },
  { id: 'health', label: 'Salud & MedTech' },
  { id: 'education', label: 'Educación & EdTech' },
  { id: 'logistics', label: 'Logística & Transporte' },
];

export const wizardPlans = [
  {
    id: 'starter',
    name: 'Starter Cloud',
    priceMonthly: 49,
    priceAnnual: 39,
    description: 'Para equipos en etapa de despegue con hasta 10 nodos concurrentes.',
    features: ['10 Nodos Dedicados', 'SLA 99.5%', 'Soporte por Ticket'],
  },
  {
    id: 'pro',
    name: 'Business Pro',
    priceMonthly: 129,
    priceAnnual: 99,
    description: 'La opción recomendada para organizaciones en crecimiento acelerado.',
    features: ['50 Nodos Dedicados', 'SLA 99.9%', 'Soporte 24/7 con prioridad', 'Auditoría Forense'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Ultra',
    priceMonthly: 299,
    priceAnnual: 249,
    description: 'Infraestructura dedicada con aislamiento criptográfico total y VPC.',
    features: ['Nodos Ilimitados', 'SLA 99.99%', 'Gerente de Éxito Dedicado', 'Cifrado HSM'],
  },
] as const;
