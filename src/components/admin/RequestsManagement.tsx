"use client";

import { useState, useMemo } from "react";
import ClientDetailsModal from "./ClientDetailsModal";
import ValidateConfirm from "./ValidateConfirm";
import RejectConfirm from "./RejectConfirm";

interface Request {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  departement: string;
  status: "pending" | "validated" | "rejected";
  date: string;
}

export default function RequestsManagement() {
  // Données simulées
  const allRequests: Request[] = [
    { id: 1, nom: "Dupont", prenom: "Jean", email: "jean.dupont@email.com", telephone: "+33 1 23 45 67 89", departement: "X", status: "pending", date: "2024-01-15" },
    { id: 2, nom: "Smith", prenom: "Marie", email: "marie.smith@email.com", telephone: "+33 1 23 45 67 90", departement: "Y", status: "validated", date: "2024-01-14" },
    { id: 3, nom: "Martin", prenom: "Pierre", email: "pierre.martin@email.com", telephone: "+33 1 23 45 67 91", departement: "Z", status: "rejected", date: "2024-01-13" },
    { id: 4, nom: "Bernard", prenom: "Sophie", email: "sophie.bernard@email.com", telephone: "+33 1 23 45 67 92", departement: "X", status: "pending", date: "2024-01-12" },
    { id: 5, nom: "Dubois", prenom: "Luc", email: "luc.dubois@email.com", telephone: "+33 1 23 45 67 93", departement: "Y", status: "validated", date: "2024-01-11" },
    { id: 6, nom: "Moreau", prenom: "Alice", email: "alice.moreau@email.com", telephone: "+33 1 23 45 67 94", departement: "Z", status: "pending", date: "2024-01-10" },
    { id: 7, nom: "Laurent", prenom: "Paul", email: "paul.laurent@email.com", telephone: "+33 1 23 45 67 95", departement: "X", status: "validated", date: "2024-01-09" },
    { id: 8, nom: "Simon", prenom: "Julie", email: "julie.simon@email.com", telephone: "+33 1 23 45 67 96", departement: "Y", status: "rejected", date: "2024-01-08" },
    { id: 9, nom: "Michel", prenom: "Thomas", email: "thomas.michel@email.com", telephone: "+33 1 23 45 67 97", departement: "Z", status: "pending", date: "2024-01-07" },
    { id: 10, nom: "Garcia", prenom: "Isabelle", email: "isabelle.garcia@email.com", telephone: "+33 1 23 45 67 98", departement: "X", status: "validated", date: "2024-01-06" },
    { id: 11, nom: "Robert", prenom: "David", email: "david.robert@email.com", telephone: "+33 1 23 45 67 99", departement: "Y", status: "pending", date: "2024-01-05" },
    { id: 12, nom: "Richard", prenom: "Catherine", email: "catherine.richard@email.com", telephone: "+33 1 23 45 68 00", departement: "Z", status: "validated", date: "2024-01-04" },
    { id: 13, nom: "Durand", prenom: "Nicolas", email: "nicolas.durand@email.com", telephone: "+33 1 23 45 68 01", departement: "X", status: "rejected", date: "2024-01-03" },
    { id: 14, nom: "Leroy", prenom: "Sandrine", email: "sandrine.leroy@email.com", telephone: "+33 1 23 45 68 02", departement: "Y", status: "pending", date: "2024-01-02" },
    { id: 15, nom: "Morel", prenom: "François", email: "francois.morel@email.com", telephone: "+33 1 23 45 68 03", departement: "Z", status: "validated", date: "2024-01-01" },
    { id: 16, nom: "Fournier", prenom: "Elodie", email: "elodie.fournier@email.com", telephone: "+33 1 23 45 68 04", departement: "X", status: "pending", date: "2023-12-31" },
    { id: 17, nom: "Girard", prenom: "Philippe", email: "philippe.girard@email.com", telephone: "+33 1 23 45 68 05", departement: "Y", status: "validated", date: "2023-12-30" },
    { id: 18, nom: "Bonnet", prenom: "Valérie", email: "valerie.bonnet@email.com", telephone: "+33 1 23 45 68 06", departement: "Z", status: "rejected", date: "2023-12-29" },
    { id: 19, nom: "Roux", prenom: "Guillaume", email: "guillaume.roux@email.com", telephone: "+33 1 23 45 68 07", departement: "X", status: "pending", date: "2023-12-28" },
    { id: 20, nom: "Vincent", prenom: "Caroline", email: "caroline.vincent@email.com", telephone: "+33 1 23 45 68 08", departement: "Y", status: "validated", date: "2023-12-27" },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"new" | "validated">("new");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValidateConfirmOpen, setIsValidateConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [pendingActionRequest, setPendingActionRequest] = useState<Request | null>(null);
  const itemsPerPage = 15;

  // Filtrage des données
  const filteredRequests = useMemo(() => {
    return allRequests.filter(request => {
      const matchesSearch =
        request.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesDepartment = departmentFilter === "all" || request.departement === departmentFilter;
      
      // Filtre par mode de vue (toggle)
      const matchesViewMode = viewMode === "new"
        ? request.status === "pending"
        : request.status === "validated";

      return matchesSearch && matchesStatus && matchesDepartment && matchesViewMode;
    });
  }, [searchTerm, statusFilter, departmentFilter, viewMode]);

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

  const handleStatusChange = (requestId: number, newStatus: "pending" | "validated" | "rejected") => {
    // En production, vous appelleriez une API ici
    console.log(`Changement de statut pour la demande ${requestId}: ${newStatus}`);
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
      handleStatusChange(pendingActionRequest.id, "validated");
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

  const handleCloseValidateConfirm = () => {
    setIsValidateConfirmOpen(false);
    setPendingActionRequest(null);
  };

  const handleCloseRejectConfirm = () => {
    setIsRejectConfirmOpen(false);
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
          
          {/* Compteur à droite */}
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
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
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
                      Département {request.departement}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(request.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border ${getStatusClasses(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {getStatusText(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
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
        onStatusChange={handleStatusChange}
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
    </div>
  );
}