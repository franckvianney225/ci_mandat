"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface DashboardStats {
  totalRequests: number;
  validatedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  totalUsers: number;
  activeUsers: number;
}

interface RecentRequest {
  id: string;
  clientName: string;
  email: string;
  status: "pending" | "validated" | "rejected";
  statusText: string;
  createdAt: string;
  department: string;
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

interface DashboardProps {
  onSectionChange?: (section: string) => void;
}

export default function Dashboard({ onSectionChange }: DashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    validatedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    totalUsers: 0,
    activeUsers: 0
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const handleViewAllRequests = () => {
    if (onSectionChange) {
      onSectionChange('requests');
    } else {
      router.push('/ci-mandat-admin?tab=requests');
    }
  };

  const handleCardClick = (status: string) => {
    if (onSectionChange) {
      onSectionChange('requests');
    } else {
      router.push(`/ci-mandat-admin?tab=requests&status=${status}`);
    }
  };


  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Charger les statistiques des mandats
        const statsResponse = await apiClient.getMandateStatistics();
        // Charger les mandats récents
        const mandatesResponse = await apiClient.getRecentMandates();
        
        if (statsResponse.success && statsResponse.data) {
          const statsData = statsResponse.data;
          // Calculer le total des demandes validées (admin_approved + super_admin_approved)
          const totalValidated = statsData.adminApproved + statsData.superAdminApproved;
          
          setStats({
            totalRequests: statsData.total,
            validatedRequests: totalValidated,
            pendingRequests: statsData.pending,
            rejectedRequests: statsData.rejected,
            totalUsers: 0,
            activeUsers: 0
          });
        }

        if (mandatesResponse.success && mandatesResponse.data) {
          const recentMandates = mandatesResponse.data.slice(0, 5).map((mandate: MandateData) => ({
            id: mandate.id,
            clientName: `${mandate.formData.prenom} ${mandate.formData.nom}`,
            email: mandate.formData.email,
            status: mapBackendStatusToFrontend(mandate.status),
            statusText: mapBackendStatusToFrontend(mandate.status) === "pending" ? "En attente" :
                       mapBackendStatusToFrontend(mandate.status) === "validated" ? "Validé" : "Rejeté",
            createdAt: mandate.createdAt,
            department: mandate.formData.circonscription
          }));
          setRecentRequests(recentMandates);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du dashboard:", error);
        // Fallback aux données mockées en cas d'erreur
        const mockStats: DashboardStats = {
          totalRequests: 0,
          validatedRequests: 0,
          pendingRequests: 0,
          rejectedRequests: 0,
          totalUsers: 0,
          activeUsers: 0
        };
        setStats(mockStats);
        setRecentRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="ml-4 space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total des demandes */}
        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
          onClick={() => handleCardClick('all')}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total des demandes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
            </div>
          </div>
        </div>
   {/* En attente */}
   <div
     className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
     onClick={() => handleCardClick('pending')}
   >
     <div className="flex items-center">
       <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-sm">
         <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
       </div>
       <div className="ml-4">
         <p className="text-sm font-medium text-gray-600">En attente</p>
         <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
       </div>
     </div>
   </div>
        {/* Demandes validées */}
        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
          onClick={() => handleCardClick('validated')}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Demandes validées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.validatedRequests}</p>
            </div>
          </div>
        </div>

     

        {/* Demandes rejetées */}
        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
          onClick={() => handleCardClick('rejected')}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Demandes rejetées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejectedRequests}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Demandes récentes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Demandes récentes</h3>
              <p className="text-sm text-gray-600 mt-1">Les 5 dernières demandes soumises</p>
            </div>
            <div className="text-sm text-gray-500">
              {recentRequests.length} demandes
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {recentRequests.map((request) => (
            <div key={request.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
                    <span className="text-sm font-semibold text-white">
                      {getInitials(request.clientName)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {request.clientName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.email}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(request.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {request.department}
                    </div>
                    <div className="text-xs text-gray-500">
                      Département
                    </div>
                  </div>
                  
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                    {request.statusText}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
          <div className="text-center">
            <button
              onClick={handleViewAllRequests}
              className="text-sm font-medium text-[#FF8200] hover:text-[#E67300] transition-colors duration-200"
            >
              Voir toutes les demandes →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}