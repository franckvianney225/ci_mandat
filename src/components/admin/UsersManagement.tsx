"use client";

import { useState, useEffect } from "react";
import UsersTable from "./UsersTable";
import UsersFilters from "./UsersFilters";
import CreateUserModal from "./CreateUserModal";
import EditUserModal from "./EditUserModal";
import { apiClient } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  status: "active" | "inactive" | "suspended" | "pending_verification";
  personalData: {
    firstName: string;
    lastName: string;
    phone?: string;
    department?: string;
  };
  createdAt: string;
  lastLogin?: string;
  loginAttempts: number;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Utiliser l'API client pour récupérer les utilisateurs réels
      const response = await apiClient.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined
      });

      if (response.success && response.data) {
        setUsers(response.data.data);
        setTotalPages(response.data.totalPages);
      } else {
        console.error("Erreur lors du chargement des utilisateurs:", response.error);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const handleCreateUser = async (userData: {
    email: string;
    password: string;
    role: "admin" | "super_admin";
    personalData: {
      firstName: string;
      lastName: string;
      phone?: string;
      department?: string;
    };
  }) => {
    try {
      const response = await apiClient.createUser(userData);

      if (response.success) {
        setIsCreateModalOpen(false);
        loadUsers();
      } else {
        console.error("Erreur lors de la création de l'utilisateur:", response.error);
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
    }
  };

  const handleUpdateUser = async (userId: string, userData: {
    email: string;
    role: "admin" | "super_admin";
    status: "active" | "inactive" | "suspended" | "pending_verification";
    personalData: {
      firstName: string;
      lastName: string;
      phone?: string;
      department?: string;
    };
  }) => {
    try {
      const response = await apiClient.updateUser(userId, userData);

      if (response.success) {
        setIsEditModalOpen(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        console.error("Erreur lors de la modification de l'utilisateur:", response.error);
      }
    } catch (error) {
      console.error("Erreur lors de la modification de l'utilisateur:", error);
    }
  };

  const handlePasswordChange = async (userId: string, newPassword: string) => {
    try {
      setError(null);
      const response = await apiClient.resetUserPassword(userId, newPassword);

      if (response.success) {
        console.log('Mot de passe modifié avec succès');
        // Optionnel: afficher un message de succès
      } else {
        const errorMessage = response.error || "Erreur lors de la modification du mot de passe";
        setError(errorMessage);
        console.error("Erreur lors de la modification du mot de passe:", response.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la modification du mot de passe";
      setError(errorMessage);
      console.error("Erreur lors de la modification du mot de passe:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        const response = await apiClient.deleteUser(userId);

        if (response.success) {
          loadUsers();
        } else {
          console.error("Erreur lors de la suppression de l'utilisateur:", response.error);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur:", error);
      }
    }
  };

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

      {/* Barre de recherche et filtres */}
      <UsersFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        setCurrentPage={setCurrentPage}
      />

      {/* Bouton Créer */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#FF8200] hover:bg-[#E67300] text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-[#FF8200] focus:ring-offset-2"
        >
          Créer un utilisateur
        </button>
      </div>

      {/* Tableau des utilisateurs */}
      <UsersTable
        users={users}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onEditUser={(user: User) => {
          setSelectedUser(user);
          setIsEditModalOpen(true);
        }}
        onDeleteUser={handleDeleteUser}
        onPageChange={setCurrentPage}
      />

      {/* Modale de création */}
      {isCreateModalOpen && (
        <CreateUserModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Modale d'édition */}
      {isEditModalOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSubmit={(userData: {
            email: string;
            role: "admin" | "super_admin";
            status: "active" | "inactive" | "suspended" | "pending_verification";
            personalData: {
              firstName: string;
              lastName: string;
              phone?: string;
              department?: string;
            };
          }) => handleUpdateUser(selectedUser.id, userData)}
          onPasswordChange={handlePasswordChange}
        />
      )}
    </div>
  );
}