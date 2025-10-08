"use client";

export default function SettingsFallback() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation latérale - Squelette */}
        <div className="lg:w-64">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <nav className="space-y-1 p-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-gray-100"
                >
                  <div className="w-6 h-6 bg-gray-200 rounded mr-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenu principal - Squelette */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {/* En-tête du contenu */}
            <div className="mb-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>

            {/* Formulaire de paramètres - Squelette */}
            <div className="space-y-6">
              {[...Array(4)].map((_, sectionIndex) => (
                <div key={sectionIndex} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, fieldIndex) => (
                      <div key={fieldIndex}>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-12 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Bouton de sauvegarde - Squelette */}
              <div className="flex justify-end pt-4">
                <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}