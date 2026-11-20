export type FormsSubTab = 'layouts' | 'elements' | 'wizard' | 'validation';

export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
}

export interface IndustryOption {
  id: string;
  label: string;
}

export interface WizardFormData {
  // Step 1: Credenciales & Seguridad
  accountEmail: string;
  accountUsername: string;
  accountRole: string;
  password: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;

  // Step 2: Perfil Corporativo
  companyName: string;
  taxId: string;
  contactName: string;
  contactPhone: string;
  country: string;
  billingAddress: string;

  // Step 3: Plan & Cuotas
  selectedPlan: 'starter' | 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  seatsCount: number;
  dedicatedIp: boolean;

  // Step 4: Confirmación & SLA
  acceptedTerms: boolean;
  slaNotificationEmail: string;
}

export interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}
