"use client";

import { useState, useMemo, useEffect } from "react";
import ClientDetailsModal from "./ClientDetailsModal";
import ValidateConfirm from "./ValidateConfirm";
import RejectConfirm from "./RejectConfirm";
import DeleteConfirm from "./DeleteConfirm";
import CreateRequestModal from "./CreateRequestModal";
import { generateMandatePDF } from "./PDFMandatGenerator";
import { apiClient } from "@/lib/api";

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

interface Request {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  circonscription: string;
  status: "pending" | "validated" | "rejected";
  createdAt: string;
  referenceNumber: string;
}

interface MandateData {
  id: string;
  formData: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    circonscription: string;
  };
  status: string;
  createdAt: string;
  referenceNumber: string;
}

// Fonction pour convertir les statuts backend en statuts frontend
const mapBackendStatusToFrontend = (backendStatus: string): "pending" | "validated" | "rejected" => {
  switch (backendStatus) {
    case "pending_validation":
      return "pending";
    case "admin_approved":
    case "super_admin_approved":
      return "validated";
    case "rejected":
      return "rejected";
    default:
      return "pending";
  }
};

export default function RequestsManagement({ currentUser }: RequestsManagementProps) {
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"new" | "validated">("new");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValidateConfirmOpen, setIsValidateConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingActionRequest, setPendingActionRequest] = useState<Request | null>(null);
  const itemsPerPage = 15;

  // Lire le paramètre status de l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    
    if (statusParam) {
      // Mapper les paramètres URL vers les filtres internes
      const statusMapping: Record<string, string> = {
        'all': 'all',
        'pending': 'pending_validation',
        'validated': 'validated',
        'rejected': 'rejected'
      };
      
      if (statusMapping[statusParam]) {
        setStatusFilter(statusMapping[statusParam]);
        
        // Définir le viewMode en fonction du statut
        if (statusParam === 'pending' || statusParam === 'rejected' || statusParam === 'all') {
          setViewMode('new');
        } else if (statusParam === 'validated') {
          setViewMode('validated');
        }
      }
    }
  }, []);

  // Charger les mandats depuis l'API
  useEffect(() => {
    const loadMandates = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMandates();
        
        if (response.success && response.data) {
          // Transformer les données de l'API en format Request avec mapping des statuts
          const mandates = response.data.data.map((mandate: MandateData) => ({
            id: mandate.id,
            nom: mandate.formData.nom,
            prenom: mandate.formData.prenom,
            email: mandate.formData.email,
            telephone: mandate.formData.telephone,
            circonscription: mandate.formData.circonscription,
            status: mapBackendStatusToFrontend(mandate.status) as "pending" | "validated" | "rejected",
            createdAt: mandate.createdAt,
            referenceNumber: mandate.referenceNumber
          }));
          
          setAllRequests(mandates);
        } else {
          setError(response.error || "Erreur lors du chargement des mandats");
        }
      } catch (err) {
        console.error("Erreur lors du chargement des mandats:", err);
        setError("Erreur de connexion au serveur");
      } finally {
        setIsLoading(false);
      }
    };

    loadMandates();
  }, []);

  // Filtrage des données
  const filteredRequests = useMemo(() => {
    return allRequests.filter(request => {
      const matchesSearch =
        request.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = departmentFilter === "all" || request.circonscription === departmentFilter;
      
      // Logique de filtrage combinée : priorité au statusFilter s'il est défini
      let matchesStatusAndViewMode = true;
      
      if (statusFilter !== "all") {
        // Si un filtre de statut spécifique est défini (via URL ou sélecteur), l'utiliser
        matchesStatusAndViewMode = request.status === statusFilter;
      } else {
        // Sinon, utiliser le viewMode par défaut
        matchesStatusAndViewMode = viewMode === "new"
          ? request.status === "pending"
          : request.status === "validated";
      }

      return matchesSearch && matchesStatusAndViewMode && matchesDepartment;
    });
  }, [searchTerm, statusFilter, departmentFilter, viewMode, allRequests]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "validated":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "validated":
        return "Validé";
      case "rejected":
        return "Rejeté";
      default:
        return "Inconnu";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case "validated":
        return (
          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case "rejected":
        return (
          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = async (requestId: string, newStatus: "admin_approved" | "rejected") => {
    try {
      if (newStatus === "admin_approved") {
        await apiClient.validateMandateByAdmin(requestId);
      } else if (newStatus === "rejected") {
        await apiClient.rejectMandate(requestId, "Rejeté par l'administrateur");
      }
      
      // Recharger les données après modification
      const response = await apiClient.getMandates();
      if (response.success && response.data) {
        const mandates = response.data.data.map((mandate: MandateData) => ({
          id: mandate.id,
          nom: mandate.formData.nom,
          prenom: mandate.formData.prenom,
          email: mandate.formData.email,
          telephone: mandate.formData.telephone,
          circonscription: mandate.formData.circonscription,
          status: mapBackendStatusToFrontend(mandate.status) as "pending" | "validated" | "rejected",
          createdAt: mandate.createdAt,
          referenceNumber: mandate.referenceNumber
        }));
        setAllRequests(mandates);
      }
    } catch (error) {
      console.error("Erreur lors de la modification du statut:", error);
    }
  };

  const handleValidateClick = (request: Request) => {
    setPendingActionRequest(request);
    setIsValidateConfirmOpen(true);
  };

  const handleRejectClick = (request: Request) => {
    setPendingActionRequest(request);
    setIsRejectConfirmOpen(true);
  };

  const handleConfirmValidate = () => {
    if (pendingActionRequest) {
      handleStatusChange(pendingActionRequest.id, "admin_approved");
      setIsValidateConfirmOpen(false);
      setPendingActionRequest(null);
    }
  };

  const handleConfirmReject = () => {
    if (pendingActionRequest) {
      handleStatusChange(pendingActionRequest.id, "rejected");
      setIsRejectConfirmOpen(false);
      setPendingActionRequest(null);
    }
  };

  const handleDeleteClick = (request: Request) => {
    setPendingActionRequest(request);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingActionRequest) {
      try {
        await apiClient.deleteMandate(pendingActionRequest.id);
        // Recharger les données après suppression
        const response = await apiClient.getMandates();
        if (response.success && response.data) {
          const mandates = response.data.data.map((mandate: MandateData) => ({
            id: mandate.id,
            nom: mandate.formData.nom,
            prenom: mandate.formData.prenom,
            email: mandate.formData.email,
            telephone: mandate.formData.telephone,
            circonscription: mandate.formData.circonscription,
            status: mapBackendStatusToFrontend(mandate.status) as "pending" | "validated" | "rejected",
            createdAt: mandate.createdAt,
            referenceNumber: mandate.referenceNumber
          }));
          setAllRequests(mandates);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du mandat:", error);
      } finally {
        setIsDeleteConfirmOpen(false);
        setPendingActionRequest(null);
      }
    }
  };

  const handleCloseValidateConfirm = () => {
    setIsValidateConfirmOpen(false);
    setPendingActionRequest(null);
  };

  const handleCloseRejectConfirm = () => {
    setIsRejectConfirmOpen(false);
    setPendingActionRequest(null);
  };

  const handleCloseDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setPendingActionRequest(null);
  };

  const handleRequestClick = (request: Request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres améliorée */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-4 lg:gap-6 items-start">
          {/* Recherche à gauche */}
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher par nom, prénom ou email..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] focus:bg-white transition-all duration-200 placeholder-gray-400 text-gray-900"
              />
            </div>
          </div>

          {/* Filtres groupés */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filtre par statut */}
            <div className="w-full sm:w-48">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Filtre par statut
              </label>
              <div className="relative">
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full pl-3 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] focus:bg-white transition-all duration-200 appearance-none text-gray-900"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="validated">Validé</option>
                  <option value="rejected">Rejeté</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtre par département */}
            <div className="w-full sm:w-48">
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Filtre par département
              </label>
              <div className="relative">
                <select
                  id="department"
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full pl-3 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] focus:bg-white transition-all duration-200 appearance-none text-gray-900"
                >
                  <option value="all">Tous les départements</option>
                  <option value="X">Département X</option>
                  <option value="Y">Départments Y</option>
                  <option value="Z">Départments Z</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

           
          </div>
        </div>
      </div>

      {/* Section bouton Nouvelle demande - entre les filtres et le tableau */}
      <div className="flex justify-end">
        {/* Bouton Nouvelle demande - visible uniquement pour super_admin */}
        {currentUser?.role === "super_admin" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-[#FF8200] hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8200] transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle demande
          </button>
        )}
      </div>

      {/* Tableau des demandes */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        {/* En-tête avec toggle moderne */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          {/* Toggle Nouvelle demande / Validée - design moderne */}
          <div className="flex space-x-1">
            <button
              onClick={() => setViewMode("new")}
              className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                viewMode === "new"
                  ? "bg-[#FF8200] text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200"
              }`}
            >
              Nouvelle demande
            </button>
            <button
              onClick={() => setViewMode("validated")}
              className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                viewMode === "validated"
                  ? "bg-[#FF8200] text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200"
              }`}
            >
              Validée
            </button>
          </div>
          
          {/* Compteur */}
          <div className="text-sm text-gray-600">
            {filteredRequests.length} {filteredRequests.length === 1 ? 'demande' : 'demandes'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nom et Prenoms
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  CONTACT
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  CIRCONSCRIPTION
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  DATE DE DEMANDE
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRequests.map((request, index) => (
                <tr
                  key={request.id}
                  className="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleRequestClick(request)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-[#FF8200] flex items-center justify-center shadow-sm">
                        <span className="text-sm font-semibold text-white">
                          {request.prenom[0]}{request.nom[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {request.prenom} {request.nom}
                        </div>
                        <div className="text-xs text-gray-500">ID: #{request.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{request.email}</div>
                    <div className="text-sm text-gray-500">{request.telephone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {request.circonscription}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border ${getStatusClasses(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {getStatusText(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {request.status !== "validated" ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleValidateClick(request);
                            }}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
                            title="Marquer comme validé"
                          >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Valider
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectClick(request);
                            }}
                            className="inline-flex items-center px-3 py-2 border border-red-300 text-xs font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105"
                            title="Marquer comme rejeté"
                          >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Rejeter
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Générer et imprimer le PDF directement depuis le tableau
                            const mandateData = {
                              id: request.id,
                              nom: request.nom,
                              prenom: request.prenom,
                              email: request.email,
                              telephone: request.telephone,
                              circonscription: request.circonscription,
                              referenceNumber: request.referenceNumber,
                              status: request.status,
                              createdAt: request.createdAt
                            };
                            generateMandatePDF(mandateData);
                          }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105"
                          title="Imprimer le PDF du mandat"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Imprimer PDF
                        </button>
                      )}
                      
                      {/* Bouton Supprimer - visible uniquement pour super_admin */}
                      {currentUser?.role === "super_admin" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(request);
                          }}
                          className="inline-flex items-center px-3 py-2 border border-red-300 text-xs font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105"
                          title="Supprimer définitivement"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination améliorée */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredRequests.length)}</span> sur{' '}
                <span className="font-medium">{filteredRequests.length}</span> demandes
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Précédent
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                      currentPage === page
                        ? "border-[#FF8200] bg-[#FF8200] text-white shadow-md"
                        : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Suivant
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal des détails client */}
      <ClientDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        request={selectedRequest}
        onStatusChange={(requestId: string, newStatus: "pending" | "validated" | "rejected") => {
          // Convertir les types pour la compatibilité
          if (newStatus === "validated") {
            handleStatusChange(requestId, "admin_approved");
          } else if (newStatus === "rejected") {
            handleStatusChange(requestId, "rejected");
          }
          // Ignorer le statut "pending" car il ne peut pas être changé vers pending
        }}
      />

      {/* Modal de confirmation pour la validation */}
      <ValidateConfirm
        isOpen={isValidateConfirmOpen}
        onClose={handleCloseValidateConfirm}
        onConfirm={handleConfirmValidate}
        requestInfo={pendingActionRequest ? {
          nom: pendingActionRequest.nom,
          prenom: pendingActionRequest.prenom,
          id: pendingActionRequest.id
        } : null}
      />

      {/* Modal de confirmation pour le rejet */}
      <RejectConfirm
        isOpen={isRejectConfirmOpen}
        onClose={handleCloseRejectConfirm}
        onConfirm={handleConfirmReject}
        requestInfo={pendingActionRequest ? {
          nom: pendingActionRequest.nom,
          prenom: pendingActionRequest.prenom,
          id: pendingActionRequest.id
        } : null}
      />

      {/* Modal de confirmation pour la suppression */}
      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        requestInfo={pendingActionRequest ? {
          nom: pendingActionRequest.nom,
          prenom: pendingActionRequest.prenom,
          id: pendingActionRequest.id
        } : null}
      />

      {/* Modal de création de demande */}
      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Recharger les données après création réussie
          const loadMandates = async () => {
            try {
              const response = await apiClient.getMandates();
              if (response.success && response.data) {
                const mandates = response.data.data.map((mandate: MandateData) => ({
                  id: mandate.id,
                  nom: mandate.formData.nom,
                  prenom: mandate.formData.prenom,
                  email: mandate.formData.email,
                  telephone: mandate.formData.telephone,
                  circonscription: mandate.formData.circonscription,
                  status: mapBackendStatusToFrontend(mandate.status) as "pending" | "validated" | "rejected",
                  createdAt: mandate.createdAt,
                  referenceNumber: mandate.referenceNumber
                }));
                setAllRequests(mandates);
              }
            } catch (err) {
              console.error("Erreur lors du rechargement des mandats:", err);
            }
          };
          loadMandates();
        }}
      />
    </div>
  );
}