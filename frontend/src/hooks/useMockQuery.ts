'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export interface UseMockQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Simulates an async data fetch against the mock data layer. `factory` is
 * called synchronously to produce the data, but consumers still see the
 * familiar `isLoading` -> resolved lifecycle so components built against
 * this hook behave the same as they would against a real network call.
 *
 * @param factory Function that produces the mock data.
 * @param deps Dependency array; changing values re-triggers the fetch.
 * @param delayMs Simulated network latency in milliseconds.
 */
export function useMockQuery<T>(
  factory: () => T,
  deps: unknown[] = [],
  delayMs = 400,
): UseMockQueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refetchIndex, setRefetchIndex] = useState(0);
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);

    const timer = setTimeout(() => {
      if (cancelled) return;
      try {
        const result = factoryRef.current();
        setData(result);
        setIsLoading(false);
      } catch {
        setIsError(true);
        setIsLoading(false);
      }
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchIndex, delayMs, ...deps]);

  const refetch = useCallback(() => {
    setRefetchIndex((n) => n + 1);
  }, []);

  return { data, isLoading, isError, refetch };
}

export interface UseMockMutationOptions {
  successMessage?: string;
  delayMs?: number;
}

export interface UseMockMutationResult<TVariables = unknown> {
  mutate: (variables?: TVariables) => void;
  mutateAsync: (variables?: TVariables) => Promise<void>;
  isLoading: boolean;
}

/**
 * Simulates a mutation (create/update/delete) without ever hitting a real
 * backend. Shows a success toast after a short delay so forms and action
 * buttons feel responsive while the app is running purely on mock data.
 */
export function useMockMutation<TVariables = unknown>(
  options: UseMockMutationOptions = {},
): UseMockMutationResult<TVariables> {
  const { successMessage = 'Saved successfully', delayMs = 500 } = options;
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = useCallback(
    (_variables?: TVariables) => {
      setIsLoading(true);
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setIsLoading(false);
          toast.success(successMessage);
          resolve();
        }, delayMs);
      });
    },
    [successMessage, delayMs],
  );

  const mutate = useCallback(
    (variables?: TVariables) => {
      void mutateAsync(variables);
    },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isLoading };
}
