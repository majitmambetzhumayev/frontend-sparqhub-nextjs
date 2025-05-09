import api from '@/lib/axios';

/**
 * SWR fetcher: returns response.data by default :contentReference[oaicite:5]{index=5}
 */
export async function fetcher<T>(url: string): Promise<T> {
  const response = await api.get<T>(url);
  return response.data;
}
