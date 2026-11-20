export type TablesSubTab = 'basic' | 'datatable' | 'expandable' | 'editable';

export type TransactionStatus = 'Completado' | 'Pendiente' | 'Fallido' | 'Reembolsado';

export interface CustomerTransaction {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  avatarText: string;
  amount: number;
  currency: string;
  paymentMethod: 'Apple Pay' | 'Tarjeta Visa' | 'Mastercard' | 'Transferencia SEPA';
  status: TransactionStatus;
  createdAt: string;
}

export interface ServerNode {
  id: string;
  nodeName: string;
  region: string;
  ipAddress: string;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  status: 'Operativo' | 'Advertencia' | 'Degradado';
  uptimeDays: number;
}

export interface InvoiceItemDetail {
  id: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface ExpandableInvoice {
  id: string;
  invoiceNumber: string;
  clientCompany: string;
  contactPerson: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  discount: number;
  grandTotal: number;
  paymentStatus: 'Pagada' | 'Vencida' | 'En Revisión';
  items: InvoiceItemDetail[];
}

export interface EditableStaffMember {
  id: string;
  fullName: string;
  email: string;
  role: 'Administrador' | 'Ingeniero Cloud' | 'Auditor' | 'Operador';
  department: 'DevOps' | 'Seguridad' | 'Finanzas' | 'Soporte';
  isActive: boolean;
  twoFactorEnabled: boolean;
  accessTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  lastActive: string;
}
