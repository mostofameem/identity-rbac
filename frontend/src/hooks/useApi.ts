/**
 * useApi Hook
 * 
 * A custom hook for handling API calls with loading states and error handling.
 * Provides a consistent pattern for data fetching throughout the application.
 * 
 * @example
 * const { data: users, loading, error, execute } = useApi(adminApiClient.getUsers);
 * 
 * useEffect(() => {
 *   execute();
 * }, [execute]);
 */

import { useState, useCallback } from 'react';

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<{ data: { data: T } }>
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(...args);
      const result = response.data.data;
      setData(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return { data, loading, error, execute };
}
