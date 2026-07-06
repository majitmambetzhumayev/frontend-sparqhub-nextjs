// src/app/[locale]/(app)/conversations/ProviderModelPicker.tsx
'use client';

import React, { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ProvidersResponse } from '@/types/assistant';

export interface ProviderModelPickerProps {
  aiProvider: string;
  model: string;
  onChange: (aiProvider: string, model: string) => void;
  disabled?: boolean;
}

const ProviderModelPicker: FC<ProviderModelPickerProps> = ({ aiProvider, model, onChange, disabled }) => {
  const { data: providers } = useQuery<ProvidersResponse, Error>({
    queryKey: ['providers'],
    queryFn: () => api.get<ProvidersResponse>('/api/providers/').then((r) => r.data),
    staleTime: 60_000,
  });

  const availableModels = providers?.[aiProvider]?.models ?? [];

  return (
    <div className="flex gap-2">
      <select
        value={aiProvider}
        onChange={(e) => onChange(e.target.value, providers?.[e.target.value]?.models[0]?.id ?? '')}
        disabled={disabled || !providers}
        className="border rounded px-2 py-1 text-sm"
      >
        {providers &&
          Object.entries(providers).map(([key, info]) => (
            <option key={key} value={key}>
              {info.label}
            </option>
          ))}
      </select>
      <select
        value={model}
        onChange={(e) => onChange(aiProvider, e.target.value)}
        disabled={disabled || availableModels.length === 0}
        className="border rounded px-2 py-1 text-sm"
      >
        {availableModels.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProviderModelPicker;
