export default function RecentRequests() {
  const recentRequests = [
    {
      id: 1,
      initials: "JD",
      name: "Jean Dupont",
      email: "jean.dupont@email.com",
      status: "pending",
      statusText: "En attente",
      department: "Département X",
    },
    {
      id: 2,
      initials: "MS",
      name: "Marie Smith",
      email: "marie.smith@email.com",
      status: "processed",
      statusText: "Traité",
      department: "Département Y",
    },
    {
      id: 3,
      initials: "PM",
      name: "Pierre Martin",
      email: "pierre.martin@email.com",
      status: "error",
      statusText: "Erreur",
      department: "Département Z",
    },
  ];

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processed":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Demandes récentes
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Les 5 dernières demandes soumises
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {recentRequests.map((request) => (
            <li key={request.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {request.initials}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {request.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(
                      request.status
                    )}`}
                  >
                    {request.statusText}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {request.department}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}