"use client";

import { useEffect } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import StatisticsCards from './StatisticsCards';
import RecentRequestsList from './RecentRequestsList';
import DashboardLoading from './DashboardLoading';

interface DashboardProps {
  onSectionChange?: (section: string) => void;
}

export default function Dashboard({ onSectionChange }: DashboardProps) {
  const { stats, recentRequests, loading, error, loadDashboardData } = useDashboard();

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return <DashboardLoading />;
  }

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

      {/* Cartes de statistiques */}
      <StatisticsCards stats={stats} onSectionChange={onSectionChange} />

      {/* Liste des demandes récentes */}
      <RecentRequestsList 
        requests={recentRequests} 
        onViewAllRequests={() => onSectionChange?.('requests')}
      />
    </div>
  );
}