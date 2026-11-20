export type ComponentsSubTab = 'buttons' | 'indicators' | 'feedback' | 'surfaces' | 'icons';

export interface SoundSample {
  name: string;
  type: 'click' | 'pop' | 'tab' | 'toggle' | 'success' | 'alert';
  description: string;
}

export interface AccordionDemoItem {
  id: string;
  title: string;
  content: string;
  category: string;
}
