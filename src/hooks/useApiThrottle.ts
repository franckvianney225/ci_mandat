"use client";

import { useState, useRef, useCallback } from "react";

interface ThrottleOptions {
  minInterval?: number; // Intervalle minimum entre les appels en millisecondes
}

export function useApiThrottle(options: ThrottleOptions = {}) {
  const { minInterval = 10000 } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCallRef = useRef<number>(0);
  const cacheRef = useRef<{ data: unknown; timestamp: number } | null>(null);

  const callApi = useCallback(async <T>(
    apiCall: () => Promise<T>,
    cacheKey?: string,
    forceRefresh = false
  ): Promise<T | null> => {
    const now = Date.now();
    
    // Éviter les appels trop fréquents
    if (now - lastCallRef.current < minInterval && !forceRefresh) {
      console.log('API Throttle: Appel évité (intervalle trop court)');
      return (cacheRef.current?.data as T) || null;
    }

    try {
      setLoading(true);
      setError(null);
      lastCallRef.current = now;

      console.log('API Throttle: Appel API effectué');
      const data = await apiCall();
      
      // Mettre en cache si une clé est fournie
      if (cacheKey) {
        cacheRef.current = { data, timestamp: now };
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      console.error('API Throttle: Erreur:', err);
      
      // Retourner les données en cache si disponibles
      if (cacheRef.current) {
        console.log('API Throttle: Utilisation du cache suite à une erreur');
        return cacheRef.current.data as T;
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [minInterval]);

  const clearCache = useCallback(() => {
    cacheRef.current = null;
    lastCallRef.current = 0;
  }, []);

  return {
    callApi,
    clearCache,
    loading,
    error,
  };
}