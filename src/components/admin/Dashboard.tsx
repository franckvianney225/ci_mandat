"use client";

import { useState, useEffect } from "react";

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

export default function Dashboard() {
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

  // Données mockées pour le développement
  const mockStats: DashboardStats = {
    totalRequests: 245,
    validatedRequests: 189,
    pendingRequests: 42,
    rejectedRequests: 14,
    totalUsers: 28,
    activeUsers: 22
  };

  const mockRecentRequests: RecentRequest[] = [
    {
      id: "1",
      clientName: "Jean KOUADIO",
      email: "jean.kouadio@entreprise.ci",
      status: "pending",
      statusText: "En attente",
      createdAt: "2025-10-02T09:30:00Z",
      department: "Direction Générale"
    },
    {
      id: "2",
      clientName: "Marie TRAORE",
      email: "marie.traore@entreprise.ci",
      status: "validated",
      statusText: "Validé",
      createdAt: "2025-10-02T08:15:00Z",
      department: "Ressources Humaines"
    },
    {
      id: "3",
      clientName: "Pierre YEO",
      email: "pierre.yeo@entreprise.ci",
      status: "validated",
      statusText: "Validé",
      createdAt: "2025-10-01T16:45:00Z",
      department: "Finance"
    },
    {
      id: "4",
      clientName: "Sophie DIALLO",
      email: "sophie.diallo@entreprise.ci",
      status: "rejected",
      statusText: "Rejeté",
      createdAt: "2025-10-01T14:20:00Z",
      department: "Informatique"
    },
    {
      id: "5",
      clientName: "David BAMBA",
      email: "david.bamba@entreprise.ci",
      status: "pending",
      statusText: "En attente",
      createdAt: "2025-10-01T11:10:00Z",
      department: "Marketing"
    }
  ];

  useEffect(() => {
    // Simuler le chargement des données
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // TODO: Remplacer par l'appel API réel
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStats(mockStats);
        setRecentRequests(mockRecentRequests);
      } catch (error) {
        console.error("Erreur lors du chargement du dashboard:", error);
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total des demandes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
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

        {/* Demandes validées */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
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

        {/* En attente */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
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

        {/* Demandes rejetées */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
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

        {/* Total utilisateurs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        {/* Utilisateurs actifs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Utilisateurs actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
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
            <button className="text-sm font-medium text-[#FF8200] hover:text-[#E67300] transition-colors duration-200">
              Voir toutes les demandes →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}