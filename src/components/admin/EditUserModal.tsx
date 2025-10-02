"use client";

import { useState } from "react";

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

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSubmit: (userData: {
    email: string;
    role: "admin" | "super_admin";
    status: "active" | "inactive" | "suspended" | "pending_verification";
    personalData: {
      firstName: string;
      lastName: string;
      phone?: string;
      department?: string;
    };
  }) => void;
}

export default function EditUserModal({ user, onClose, onSubmit }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    email: user.email,
    role: user.role,
    status: user.status,
    personalData: {
      firstName: user.personalData.firstName,
      lastName: user.personalData.lastName,
      phone: user.personalData.phone || '',
      department: user.personalData.department || ''
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-transparent backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Modifier l&apos;utilisateur</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nom et Prénom sur la même ligne */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  required
                  value={formData.personalData.firstName}
                  onChange={(e) => setFormData({
                    ...formData,
                    personalData: { ...formData.personalData, firstName: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  required
                  value={formData.personalData.lastName}
                  onChange={(e) => setFormData({
                    ...formData,
                    personalData: { ...formData.personalData, lastName: e.target.value.toUpperCase() }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white uppercase"
                />
              </div>
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              />
            </div>
            
            {/* Téléphone et Rôle sur la même ligne */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.personalData.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    personalData: { ...formData.personalData, phone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white appearance-none"
                >
                  <option value="admin">Administrateur</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            
            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'suspended' | 'pending_verification' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white appearance-none"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
                <option value="pending_verification">En attente de vérification</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8200]"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#FF8200] border border-transparent rounded-lg hover:bg-[#E67300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8200]"
              >
                Modifier
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}