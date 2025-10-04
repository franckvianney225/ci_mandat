"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  personalData: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

interface ProfileProps {
  currentUser: User | null;
}

export default function Profile({ currentUser }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.personalData?.firstName || "",
        lastName: currentUser.personalData?.lastName || "",
        email: currentUser.email,
        phone: currentUser.personalData?.phone || "",
      });
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await apiClient.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      if (response.success) {
        setMessage({ type: "success", text: "Profil mis à jour avec succès" });
        setIsEditing(false);
        // Rafraîchir les données utilisateur
        const userResponse = await apiClient.verifyToken();
        if (userResponse.success && userResponse.data) {
          // Les données utilisateur seront mises à jour par le composant parent
        }
      } else {
        setMessage({ type: "error", text: response.message || "Erreur lors de la mise à jour" });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      setMessage({ type: "error", text: "Erreur lors de la mise à jour du profil" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (currentUser) {
      setFormData({
        firstName: currentUser.personalData?.firstName || "",
        lastName: currentUser.personalData?.lastName || "",
        email: currentUser.email,
        phone: currentUser.personalData?.phone || "",
      });
    }
    setMessage(null);
  };

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erreur: Impossible de charger le profil utilisateur</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* En-tête de la carte */}
      <div className="bg-gradient-to-r from-[#FF8200] to-orange-500 px-6 py-8">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {currentUser.personalData?.firstName?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-white">
              {currentUser.personalData?.firstName && currentUser.personalData?.lastName
                ? `${currentUser.personalData.firstName} ${currentUser.personalData.lastName}`
                : currentUser.email
              }
            </h2>
            <p className="text-white/80 capitalize">
              {currentUser.role === "super_admin" ? "Super Administrateur" : "Administrateur"}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="p-6 bg-white">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-50 border border-green-200 text-green-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Prénom
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing || isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed"
                placeholder="Votre prénom"
              />
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Nom
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing || isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed"
                placeholder="Votre nom"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                placeholder="Votre email"
              />
              <p className="text-xs text-gray-600 mt-1">
                L&apos;email ne peut pas être modifié
              </p>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing || isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed"
                placeholder="Votre numéro de téléphone"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-[#FF8200] text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Modifier le profil
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#FF8200] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}