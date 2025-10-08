interface User {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  personalData: {
    firstName: string;
    lastName: string;
  };
}

interface RequestsFiltersProps {
  searchTerm: string;
  onSearchChange: (search: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (department: string) => void;
  currentUser?: User | null;
  onCreateRequest: () => void;
}

export default function RequestsFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  currentUser,
  onCreateRequest
}: RequestsFiltersProps) {
  const departments = [
    "Abidjan-Plateau", "Abobo", "Adjamé", "Anyama", "Attécoubé", "Bingerville", "Cocody", "Koumassi", "Marcory", 
    "Port-Bouët", "Treichville", "Yopougon", "Abengourou", "Aboisso", "Adiaké", "Agnibilékrou", "Akoupé", 
    "Alépé", "Bocanda", "Bondoukou", "Bongouanou", "Bouaflé", "Bouaké", "Bouna", "Boundiali", "Dabakala", 
    "Dabou", "Daloa", "Danané", "Daoukro", "Dimbokro", "Divo", "Duékoué", "Ferkessédougou", "Gagnoa", 
    "Grand-Bassam", "Grand-Lahou", "Guiglo", "Issia", "Jacqueville", "Katiola", "Korhogo", "Lakota", "Man", 
    "Mankono", "Odienné", "Oumé", "Sakassou", "San-Pédro", "Sassandra", "Séguéla", "Sinfra", "Soubré", 
    "Tabou", "Tanda", "Tiassalé", "Touba", "Toumodi", "Vavoua", "Yamoussoukro", "Zuénoula"
  ];

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
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
                onChange={(e) => onSearchChange(e.target.value)}
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
                  onChange={(e) => onStatusFilterChange(e.target.value)}
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
                  onChange={(e) => onDepartmentFilterChange(e.target.value)}
                  className="block w-full pl-3 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] focus:bg-white transition-all duration-200 appearance-none text-gray-900"
                >
                  <option value="all">Tous les départements</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
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

      {/* Bouton Nouvelle demande */}
      <div className="flex justify-end">
        {currentUser?.role === "super_admin" && (
          <button
            onClick={onCreateRequest}
            className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-[#FF8200] hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8200] transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle demande
          </button>
        )}
      </div>
    </div>
  );
}