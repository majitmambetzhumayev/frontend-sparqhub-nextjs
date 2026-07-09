export interface Message {
  id: number;
  thread: number;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  edited: boolean;
  read: boolean;
  tool_calls: string[];
}

export interface ThreadListItem {
  id: number;
  title: string;
  ai_provider: string;
  model: string;
  project: number | null;
  created_at: string;
  updated_at: string;
}

export interface ThreadDetail {
  id: number;
  title: string;
  ai_provider: string;
  model: string;
  project: number | null;
  project_name: string | null;
  created_at: string;
  updated_at: string;
}
