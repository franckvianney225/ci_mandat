"use client";

export default function RequestsManagementFallback() {
  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres - Squelette */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-4 lg:gap-6 items-start">
          {/* Recherche */}
          <div className="flex-1 max-w-md">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="relative">
              <div className="h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="w-full sm:w-48">
              <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton Nouvelle demande - Squelette */}
      <div className="flex justify-end">
        <div className="h-12 bg-gray-200 rounded-lg w-40"></div>
      </div>

      {/* Tableau des demandes - Squelette */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        {/* En-tête avec toggle */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="flex space-x-1">
            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[...Array(6)].map((_, i) => (
                  <th key={i} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(8)].map((_, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {[...Array(6)].map((_, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4">
                      <div className="flex items-center">
                        {cellIndex === 0 && (
                          <>
                            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                            <div className="ml-4 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </>
                        )}
                        {cellIndex === 1 && (
                          <div className="space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        )}
                        {cellIndex === 2 && (
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        )}
                        {cellIndex === 3 && (
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        )}
                        {cellIndex === 4 && (
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        )}
                        {cellIndex === 5 && (
                          <div className="flex space-x-2">
                            <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
                            <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Squelette */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-48"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
              <div className="h-8 bg-gray-200 rounded-lg w-8"></div>
              <div className="h-8 bg-gray-200 rounded-lg w-8"></div>
              <div className="h-8 bg-gray-200 rounded-lg w-8"></div>
              <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}