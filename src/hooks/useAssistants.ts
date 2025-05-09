// src/hooks/useAssistants.ts
'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher'; // import fetcher from your axios wrapper
import { Assistant } from '@/types/assistant'; // define Assistant type

export function useAssistants() {
  const { data, error, mutate } = useSWR<Assistant[]>('/api/assistants/', fetcher);

  return {
    assistants: data ?? [],
    isLoading: !error && !data,
    isError: !!error,
    reload: () => mutate()
  };
}
