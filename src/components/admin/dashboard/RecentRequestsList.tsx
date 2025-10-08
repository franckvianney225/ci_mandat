interface RecentRequest {
  id: string;
  clientName: string;
  email: string;
  status: "pending" | "validated" | "rejected";
  statusText: string;
  createdAt: string;
  department: string;
}

interface RecentRequestsListProps {
  requests: RecentRequest[];
  onViewAllRequests?: () => void;
}

export default function RecentRequestsList({ requests, onViewAllRequests }: RecentRequestsListProps) {
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Demandes récentes</h3>
            <p className="text-sm text-gray-600 mt-1">Les 5 dernières demandes soumises</p>
          </div>
          <div className="text-sm text-gray-500">
            {requests.length} demandes
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {requests.map((request) => (
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

      {requests.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
          <div className="text-center">
            <button
              onClick={onViewAllRequests}
              className="text-sm font-medium text-[#FF8200] hover:text-[#E67300] transition-colors duration-200"
            >
              Voir toutes les demandes →
            </button>
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="px-6 py-8 text-center">
          <div className="text-gray-400">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Aucune demande récente</p>
          </div>
        </div>
      )}
    </div>
  );
}