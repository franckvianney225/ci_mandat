import { useCallback } from 'react';
import { useDashboardStore } from '@/stores/dashboard.store';

export const useDashboard = () => {
  const {
    stats,
    recentRequests,
    loading,
    error,
    loadDashboardData,
    refreshData,
    clearError
  } = useDashboardStore();

  // Mémoized callbacks pour éviter les re-renders inutiles
  const handleLoadData = useCallback((forceRefresh = false) => {
    loadDashboardData(forceRefresh);
  }, [loadDashboardData]);

  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    // State
    stats,
    recentRequests,
    loading,
    error,
    
    // Actions
    loadDashboardData: handleLoadData,
    refreshData: handleRefresh,
    clearError: handleClearError
  };
};