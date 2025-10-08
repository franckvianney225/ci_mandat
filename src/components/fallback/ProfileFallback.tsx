"use client";

export default function ProfileFallback() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* En-tête de la carte - Squelette */}
      <div className="bg-gradient-to-r from-[#FF8200] to-orange-500 px-6 py-8">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-white/20 rounded-full"></div>
          <div className="ml-4 space-y-2">
            <div className="h-6 bg-white/30 rounded w-32"></div>
            <div className="h-4 bg-white/30 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Formulaire - Squelette */}
      <div className="p-6 bg-white">
        {/* Informations personnelles - Squelette */}
        <div className="mb-8">
          <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-12 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Sécurité - Squelette */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-40"></div>
          </div>
        </div>
      </div>
    </div>
  );
}