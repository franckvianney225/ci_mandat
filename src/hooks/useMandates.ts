import { useCallback } from 'react';
import { useMandateStore } from '@/stores/mandate.store';

interface MandateFilters {
  search: string;
  status: string;
  department: string;
  page: number;
  limit: number;
}

export const useMandates = () => {
  const {
    mandates,
    loading,
    error,
    filters,
    totalPages,
    totalItems,
    loadMandates,
    validateMandate,
    rejectMandate,
    deleteMandate,
    updateFilters,
    clearError
  } = useMandateStore();

  // Mémoized callbacks pour éviter les re-renders inutiles
  const handleSearch = useCallback((search: string) => {
    updateFilters({ search });
  }, [updateFilters]);

  const handleStatusFilter = useCallback((status: string) => {
    updateFilters({ status });
  }, [updateFilters]);

  const handleDepartmentFilter = useCallback((department: string) => {
    updateFilters({ department });
  }, [updateFilters]);

  const handlePageChange = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const handleValidate = useCallback(async (id: string) => {
    await validateMandate(id);
  }, [validateMandate]);

  const handleReject = useCallback(async (id: string, reason: string) => {
    await rejectMandate(id, reason);
  }, [rejectMandate]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteMandate(id);
  }, [deleteMandate]);

  const handleLoadMandates = useCallback((newFilters?: Partial<MandateFilters>) => {
    loadMandates(newFilters);
  }, [loadMandates]);

  return {
    // State
    mandates,
    loading,
    error,
    filters,
    totalPages,
    totalItems,
    
    // Actions
    loadMandates: handleLoadMandates,
    handleSearch,
    handleStatusFilter,
    handleDepartmentFilter,
    handlePageChange,
    handleValidate,
    handleReject,
    handleDelete,
    clearError
  };
};