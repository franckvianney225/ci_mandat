"use client";

import { useState, useEffect } from "react";
import UsersTable from "./UsersTable";
import UsersFilters from "./UsersFilters";
import CreateUserModal from "./CreateUserModal";
import EditUserModal from "./EditUserModal";

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

  // Données mockées pour le développement
  const mockUsers: User[] = [
    {
      id: "1",
      email: "admin.principal@ci-mandat.ci",
      role: "super_admin",
      status: "active",
      personalData: {
        firstName: "Jean",
        lastName: "KOUADIO",
        phone: "+225 07 07 07 07 07",
      },
      createdAt: "2024-01-15T10:00:00Z",
      lastLogin: "2025-10-01T14:30:00Z",
      loginAttempts: 0
    },
    {
      id: "2",
      email: "responsable.rh@ci-mandat.ci",
      role: "admin",
      status: "active",
      personalData: {
        firstName: "Marie",
        lastName: "TRAORE",
        phone: "+225 05 05 05 05 05",
      },
      createdAt: "2024-02-20T09:15:00Z",
      lastLogin: "2025-10-01T16:45:00Z",
      loginAttempts: 0
    },
    {
      id: "3",
      email: "gestionnaire.finance@ci-mandat.ci",
      role: "admin",
      status: "active",
      personalData: {
        firstName: "Pierre",
        lastName: "YEO",
        phone: "+225 01 01 01 01 01",
      },
      createdAt: "2024-03-10T14:20:00Z",
      lastLogin: "2025-09-30T11:20:00Z",
      loginAttempts: 0
    },
    {
      id: "4",
      email: "technicien.support@ci-mandat.ci",
      role: "admin",
      status: "inactive",
      personalData: {
        firstName: "Paul",
        lastName: "KONE",
        phone: "+225 08 08 08 08 08",
      },
      createdAt: "2024-04-05T11:30:00Z",
      lastLogin: "2025-09-25T09:10:00Z",
      loginAttempts: 0
    },
    {
      id: "5",
      email: "analyste.donnees@ci-mandat.ci",
      role: "admin",
      status: "suspended",
      personalData: {
        firstName: "Sophie",
        lastName: "DIALLO",
        phone: "+225 06 06 06 06 06",
      },
      createdAt: "2024-05-12T16:45:00Z",
      lastLogin: "2025-09-20T15:30:00Z",
      loginAttempts: 3
    },
    {
      id: "6",
      email: "coordinateur.projet@ci-mandat.ci",
      role: "admin",
      status: "active",
      personalData: {
        firstName: "David",
        lastName: "BAMBA",
        phone: "+225 02 02 02 02 02",
      },
      createdAt: "2024-06-18T08:00:00Z",
      lastLogin: "2025-10-02T08:15:00Z",
      loginAttempts: 0
    },
    {
      id: "7",
      email: "auditeur.interne@ci-mandat.ci",
      role: "admin",
      status: "active",
      personalData: {
        firstName: "Alice",
        lastName: "KOUAME",
        phone: "+225 03 03 03 03 03",
      },
      createdAt: "2024-07-22T13:10:00Z",
      lastLogin: "2025-10-01T17:00:00Z",
      loginAttempts: 0
    },
    {
      id: "8",
      email: "superviseur.qualite@ci-mandat.ci",
      role: "admin",
      status: "inactive",
      personalData: {
        firstName: "Marc",
        lastName: "SORO",
        phone: "+225 09 09 09 09 09",
      },
      createdAt: "2024-08-30T10:25:00Z",
      lastLogin: "2025-09-28T14:20:00Z",
      loginAttempts: 0
    },
    {
      id: "9",
      email: "assistant.direction@ci-mandat.ci",
      role: "admin",
      status: "pending_verification",
      personalData: {
        firstName: "Claire",
        lastName: "KOUASSI",
        phone: "+225 04 04 04 04 04",
      },
      createdAt: "2024-09-05T15:40:00Z",
      lastLogin: undefined,
      loginAttempts: 0
    },
    {
      id: "10",
      email: "developpeur.web@ci-mandat.ci",
      role: "admin",
      status: "active",
      personalData: {
        firstName: "Thomas",
        lastName: "KAMARA",
        phone: "+225 07 77 77 77 77",
      },
      createdAt: "2024-10-10T12:00:00Z",
      lastLogin: "2025-10-02T07:30:00Z",
      loginAttempts: 0
    },
    {
      id: "11",
      email: "designer.ui@ci-mandat.ci",
      role: "admin",
      status: "active",
      personalData: {
        firstName: "Emma",
        lastName: "DOSSO",
        phone: "+225 05 55 55 55 55",
      },
      createdAt: "2024-11-15T09:45:00Z",
      lastLogin: "2025-10-01T18:20:00Z",
      loginAttempts: 0
    },
    {
      id: "12",
      email: "testeur.qa@ci-mandat.ci",
      role: "admin",
      status: "suspended",
      personalData: {
        firstName: "Lucas",
        lastName: "KEITA",
        phone: "+225 01 11 11 11 11",
      },
      createdAt: "2024-12-20T14:15:00Z",
      lastLogin: "2025-09-15T10:45:00Z",
      loginAttempts: 5
    },
    {
      id: "13",
      email: "architecte.systeme@ci-mandat.ci",
      role: "super_admin",
      status: "active",
      personalData: {
        firstName: "Nicolas",
        lastName: "KOUADIO",
        phone: "+225 08 88 88 88 88",
      },
      createdAt: "2025-01-25T11:20:00Z",
      lastLogin: "2025-10-02T09:00:00Z",
      loginAttempts: 0
    },
    {
      id: "14",
      email: "consultant.security@ci-mandat.ci",
      role: "admin",
      status: "inactive",
      personalData: {
        firstName: "Sarah",
        lastName: "TRAORE",
        phone: "+225 06 66 66 66 66",
      },
      createdAt: "2025-02-28T16:30:00Z",
      lastLogin: "2025-09-10T13:15:00Z",
      loginAttempts: 0
    },
    {
      id: "15",
      email: "formateur.interne@ci-mandat.ci",
      role: "admin",
      status: "pending_verification",
      personalData: {
        firstName: "Michel",
        lastName: "YEO",
        phone: "+225 02 22 22 22 22",
      },
      createdAt: "2025-03-15T08:50:00Z",
      lastLogin: undefined,
      loginAttempts: 0
    }
  ];

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Pour le développement, utiliser les données mockées
      // TODO: Remplacer par l'appel API réel quand le backend sera disponible
      const filteredUsers = mockUsers.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.personalData.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.personalData.lastName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
      });

      // Pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      setUsers(paginatedUsers);
      setTotalPages(Math.ceil(filteredUsers.length / itemsPerPage));
      
      // Code API original (commenté pour le moment)
      /*
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/v1/users?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}&role=${roleFilter !== "all" ? roleFilter : ""}&status=${statusFilter !== "all" ? statusFilter : ""}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
        setTotalPages(data.totalPages);
      }
      */
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
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        loadUsers();
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
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        setSelectedUser(null);
        loadUsers();
      }
    } catch (error) {
      console.error("Erreur lors de la modification de l'utilisateur:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`/api/v1/users/${userId}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          loadUsers();
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