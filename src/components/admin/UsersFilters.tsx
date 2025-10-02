"use client";

interface UsersFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (filter: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  setCurrentPage: (page: number) => void;
}

export default function UsersFilters({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  setCurrentPage
}: UsersFiltersProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4 lg:gap-6 items-start">
        {/* Recherche */}
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher par nom, prénom ou email..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all duration-200 placeholder-gray-400 text-gray-900"
            />
          </div>
        </div>

        {/* Filtres groupés */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filtre par rôle */}
          <div className="w-full sm:w-48">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Filtre par rôle
            </label>
            <div className="relative">
              <select
                id="role"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full pl-3 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all duration-200 appearance-none text-gray-900"
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Administrateur</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>

          {/* Filtre par statut */}
          <div className="w-full sm:w-48">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Filtre par statut
            </label>
            <div className="relative">
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full pl-3 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all duration-200 appearance-none text-gray-900"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
                <option value="pending_verification">En attente</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}