// src/types/assistant.ts
export interface Assistant {
  id: number;
  provider_assistant_id: string | null;
  name: string;
  instructions?: string;
  model: string;
  metadata: Record<string, unknown>;
  ai_provider: string;
  is_persistent: boolean;
  supports_crud: boolean;
  deleted: boolean;
  created_at: string;
  last_used_at: string;
}
