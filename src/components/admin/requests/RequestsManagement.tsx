"use client";

import { useState, useEffect } from 'react';
import { useMandates } from '@/hooks/useMandates';
import { StoreMandate } from '@/stores/mandate.store';
import RequestsFilters from './RequestsFilters';
import RequestsTable from './RequestsTable';
import ClientDetailsModal from '../ClientDetailsModal';
import ValidateConfirm from '../ValidateConfirm';
import RejectConfirm from '../RejectConfirm';
import DeleteConfirm from '../DeleteConfirm';
import CreateRequestModal from '../CreateRequestModal';

interface User {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  personalData: {
    firstName: string;
    lastName: string;
  };
}

interface RequestsManagementProps {
  currentUser?: User | null;
}

export default function RequestsManagement({ currentUser }: RequestsManagementProps) {
  const {
    mandates,
    loading,
    error,
    filters,
    totalPages,
    totalItems,
    loadMandates,
    handleSearch,
    handleStatusFilter,
    handleDepartmentFilter,
    handlePageChange,
    handleValidate,
    handleReject,
    handleDelete,
    clearError
  } = useMandates();

  const [selectedRequest, setSelectedRequest] = useState<StoreMandate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValidateConfirmOpen, setIsValidateConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingActionRequest, setPendingActionRequest] = useState<StoreMandate | null>(null);

  // Charger les mandats au montage et quand les filtres changent
  useEffect(() => {
    loadMandates();
  }, [loadMandates, filters]);

  // Gestion des actions
  const handleRequestClick = (request: StoreMandate) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleValidateClick = (request: StoreMandate) => {
    setPendingActionRequest(request);
    setIsValidateConfirmOpen(true);
  };

  const handleRejectClick = (request: StoreMandate) => {
    setPendingActionRequest(request);
    setIsRejectConfirmOpen(true);
  };

  const handleDeleteClick = (request: StoreMandate) => {
    setPendingActionRequest(request);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmValidate = () => {
    if (pendingActionRequest) {
      handleValidate(pendingActionRequest.id);
      setIsValidateConfirmOpen(false);
      setPendingActionRequest(null);
    }
  };

  const handleConfirmReject = () => {
    if (pendingActionRequest) {
      handleReject(pendingActionRequest.id, "Rejeté par l'administrateur");
      setIsRejectConfirmOpen(false);
      setPendingActionRequest(null);
    }
  };

  const handleConfirmDelete = () => {
    if (pendingActionRequest) {
      handleDelete(pendingActionRequest.id);
      setIsDeleteConfirmOpen(false);
      setPendingActionRequest(null);
    }
  };

  const handleCloseModals = () => {
    setIsModalOpen(false);
    setIsValidateConfirmOpen(false);
    setIsRejectConfirmOpen(false);
    setIsDeleteConfirmOpen(false);
    setSelectedRequest(null);
    setPendingActionRequest(null);
  };

  return (
    <div className="space-y-6">
      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Barre de filtres */}
      <RequestsFilters
        searchTerm={filters.search}
        onSearchChange={handleSearch}
        statusFilter={filters.status}
        onStatusFilterChange={handleStatusFilter}
        departmentFilter={filters.department}
        onDepartmentFilterChange={handleDepartmentFilter}
        currentUser={currentUser}
        onCreateRequest={() => setIsCreateModalOpen(true)}
      />

      {/* Tableau des demandes */}
      <RequestsTable
        mandates={mandates}
        loading={loading}
        currentPage={filters.page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={filters.limit}
        onPageChange={handlePageChange}
        onRequestClick={handleRequestClick}
        onValidateClick={handleValidateClick}
        onRejectClick={handleRejectClick}
        onDeleteClick={handleDeleteClick}
        currentUser={currentUser}
      />

      {/* Modales */}
      <ClientDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={selectedRequest}
        onStatusChange={(requestId: string, newStatus: "pending" | "validated" | "rejected") => {
          if (newStatus === "validated") {
            handleValidate(requestId);
          } else if (newStatus === "rejected") {
            handleReject(requestId, "Rejeté par l'administrateur");
          }
        }}
      />

      <ValidateConfirm
        isOpen={isValidateConfirmOpen}
        onClose={() => setIsValidateConfirmOpen(false)}
        onConfirm={handleConfirmValidate}
        requestInfo={pendingActionRequest ? {
          nom: pendingActionRequest.nom,
          prenom: pendingActionRequest.prenom,
          id: pendingActionRequest.id
        } : null}
      />

      <RejectConfirm
        isOpen={isRejectConfirmOpen}
        onClose={() => setIsRejectConfirmOpen(false)}
        onConfirm={handleConfirmReject}
        requestInfo={pendingActionRequest ? {
          nom: pendingActionRequest.nom,
          prenom: pendingActionRequest.prenom,
          id: pendingActionRequest.id
        } : null}
      />

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        requestInfo={pendingActionRequest ? {
          nom: pendingActionRequest.nom,
          prenom: pendingActionRequest.prenom,
          id: pendingActionRequest.id
        } : null}
      />

      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadMandates();
        }}
      />
    </div>
  );
}