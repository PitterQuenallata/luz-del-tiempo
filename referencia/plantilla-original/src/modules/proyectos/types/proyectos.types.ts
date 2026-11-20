export type PriorityLevel = 'Alta' | 'Media' | 'Baja' | 'Urgente';

export interface Assignee {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface KanbanSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  columnId: 'todo' | 'in_progress' | 'review' | 'done';
  priority: PriorityLevel;
  category: string;
  assignees: Assignee[];
  dueDate: string;
  subtasks: KanbanSubtask[];
  commentsCount: number;
  attachmentsCount: number;
}

export interface KanbanColumn {
  id: 'todo' | 'in_progress' | 'review' | 'done';
  title: string;
  color: string;
}

export type EventCategory = 'Engineering' | 'Design' | 'Business' | 'Release';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  category: EventCategory;
  description?: string;
  attendeesCount?: number;
  location?: string;
}

export type NoteCategory = 'all' | 'business' | 'engineering' | 'design' | 'personal';

export interface ProjectNote {
  id: string;
  title: string;
  body: string;
  category: 'business' | 'engineering' | 'design' | 'personal';
  colorTag: string; // Tailwind color class or hex
  updatedAt: string;
  isPinned?: boolean;
}
