"use client";

import { useState, useRef, useCallback } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface UseApiCacheOptions {
  cacheDuration?: number; // Durée du cache en millisecondes (défaut: 30 secondes)
  minInterval?: number; // Intervalle minimum entre les appels en millisecondes (défaut: 10 secondes)
}

export function useApiCache(options: UseApiCacheOptions = {}) {
  const { cacheDuration = 30000, minInterval = 10000 } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry<unknown>>>(new Map());
  const lastCallRef = useRef<Map<string, number>>(new Map());
  
  const callApi = useCallback(async <T>(
    key: string,
    apiCall: () => Promise<T>,
    forceRefresh = false
  ): Promise<T | null> => {
    const now = Date.now();
    
    // Vérifier l'intervalle minimum entre les appels
    const lastCall = lastCallRef.current.get(key) || 0;
    if (now - lastCall < minInterval && !forceRefresh) {
      console.log(`API Cache: Appel évité pour ${key} (intervalle trop court)`);
      return cacheRef.current.get(key)?.data || null;
    }
    
    // Vérifier le cache
    const cached = cacheRef.current.get(key);
    if (cached && now - cached.timestamp < cacheDuration && !forceRefresh) {
      console.log(`API Cache: Utilisation du cache pour ${key}`);
      return cached.data;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`API Cache: Appel API pour ${key}`);
      const data = await apiCall();
      
      // Mettre en cache
      cacheRef.current.set(key, { data, timestamp: now });
      lastCallRef.current.set(key, now);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      console.error(`API Cache: Erreur pour ${key}:`, err);
      
      // Retourner les données en cache si disponibles, même si expirées
      if (cached) {
        console.log(`API Cache: Utilisation du cache expiré pour ${key} suite à une erreur`);
        return cached.data;
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [cacheDuration, minInterval]);
  
  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      cacheRef.current.delete(key);
      lastCallRef.current.delete(key);
    } else {
      cacheRef.current.clear();
      lastCallRef.current.clear();
    }
  }, []);
  
  const getCachedData = useCallback(<T>(key: string): T | null => {
    return cacheRef.current.get(key)?.data || null;
  }, []);
  
  return {
    callApi,
    invalidateCache,
    getCachedData,
    loading,
    error,
  };
}