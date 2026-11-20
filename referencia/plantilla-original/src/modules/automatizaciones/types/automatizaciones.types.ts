export type AutomationCategory = 'ecommerce' | 'pagos' | 'soporte' | 'seguridad' | 'sistema';

export interface AutomationNode {
  type: 'trigger' | 'condition' | 'action';
  title: string;
  subtitle: string;
  service: string;
  iconName: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: AutomationCategory;
  trigger: AutomationNode;
  condition: AutomationNode;
  action: AutomationNode;
  enabled: boolean;
  executionsCount: number;
  lastRun: string;
  successRate: number; // e.g. 99.8
  avgLatency: string; // e.g. 120ms
  savedHoursMonthly: number; // hours saved
}

export interface AutomationMetrics {
  activeRules: number;
  totalExecutionsToday: number;
  overallSuccessRate: number;
  hoursSavedMonthly: number;
  activeWorkflows: number;
}
