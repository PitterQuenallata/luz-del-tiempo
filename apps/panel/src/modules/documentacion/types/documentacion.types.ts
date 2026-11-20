export type DocCategoryId =
  | 'introduccion'
  | 'instalacion'
  | 'diseno'
  | 'notificaciones'
  | 'componentes'
  | 'negocio'
  | 'backend';

export interface DocCategory {
  id: DocCategoryId;
  title: string;
  description: string;
  iconName: string;
  badge?: string;
}

export interface DocCallout {
  type: 'tip' | 'info' | 'warning' | 'important';
  title: string;
  content: string;
}

export interface DocSection {
  id: string;
  heading: string;
  subheading?: string;
  paragraphs: string[];
  codeSnippet?: {
    language: string;
    filename?: string;
    code: string;
  };
  callout?: DocCallout;
  bullets?: string[];
}

export interface DocArticle {
  id: string;
  categoryId: DocCategoryId;
  title: string;
  summary: string;
  readingTime: string; // e.g. "4 min de lectura"
  lastUpdated: string;
  badge?: string;
  tags: string[];
  sections: DocSection[];
}
