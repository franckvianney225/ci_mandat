import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalRequests: number;
  validatedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  totalUsers: number;
  activeUsers: number;
}

interface StatisticsCardsProps {
  stats: DashboardStats;
  onSectionChange?: (section: string) => void;
}

export default function StatisticsCards({ stats, onSectionChange }: StatisticsCardsProps) {
  const router = useRouter();

  const handleCardClick = (status: string) => {
    if (onSectionChange) {
      onSectionChange('requests');
    } else {
      router.push(`/ci-mandat-admin?tab=requests&status=${status}`);
    }
  };

  const cards = [
    {
      title: 'Total des demandes',
      value: stats.totalRequests,
      color: 'blue',
      status: 'all',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'En attente',
      value: stats.pendingRequests,
      color: 'yellow',
      status: 'pending',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Demandes validées',
      value: stats.validatedRequests,
      color: 'green',
      status: 'validated',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Demandes rejetées',
      value: stats.rejectedRequests,
      color: 'red',
      status: 'rejected',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    }
  ];

  const getGradientClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-500 to-blue-600';
      case 'yellow':
        return 'from-yellow-500 to-yellow-600';
      case 'green':
        return 'from-green-500 to-green-600';
      case 'red':
        return 'from-red-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.status}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
          onClick={() => handleCardClick(card.status)}
        >
          <div className="flex items-center">
            <div className={`w-12 h-12 bg-gradient-to-br ${getGradientClass(card.color)} rounded-xl flex items-center justify-center shadow-sm`}>
              {card.icon}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}