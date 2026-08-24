export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Todo {
  id: number;
  title: string;
  completed: number;
  createdAt: string;
  dueDate: string | null;
  tags: Tag[];
}

export interface TodoRow {
  id: number;
  title: string;
  completed: number;
  created_at: string;
  due_date: string | null;
}

export type QuickDatePreset = 'today' | 'tomorrow' | 'nextWeek';
