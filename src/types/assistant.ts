// src/types/assistant.ts
export interface Assistant {
  id: number;
  provider_assistant_id: string | null;
  name: string;
  instructions?: string;
  model: string;
  metadata: Record<string, unknown>;
  ai_provider: string;
  deleted: boolean;
  created_at: string;
  last_used_at: string;
}

export interface ProviderModel {
  id: string;
  label: string;
}

export interface ProviderInfo {
  label: string;
  models: ProviderModel[];
}

export type ProvidersResponse = Record<string, ProviderInfo>;
