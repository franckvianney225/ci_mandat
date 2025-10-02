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
        />
      )}
    </div>
  );
}