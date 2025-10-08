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
  onUserUpdate?: (user: User) => void;
}

export default function Profile({ currentUser, onUserUpdate }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
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
        console.log("🔍 Réponse verifyToken après mise à jour:", userResponse);
        if (userResponse.success && userResponse.data) {
          console.log("👤 Données utilisateur après mise à jour:", userResponse.data);
          console.log("📝 Données envoyées à onUserUpdate:", userResponse.data.user);
          // Mettre à jour l'utilisateur dans le composant parent
          if (onUserUpdate) {
            onUserUpdate(userResponse.data.user as unknown as User);
            console.log("✅ onUserUpdate appelé avec succès");
          } else {
            console.log("⚠️ onUserUpdate n'est pas défini");
          }
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordSubmitting(true);
    setMessage(null);

    // Validation des mots de passe
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Les nouveaux mots de passe ne correspondent pas" });
      setIsPasswordSubmitting(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Le nouveau mot de passe doit contenir au moins 6 caractères" });
      setIsPasswordSubmitting(false);
      return;
    }

    try {
      const response = await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        setMessage({ type: "success", text: "Mot de passe modifié avec succès" });
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({ type: "error", text: response.message || "Erreur lors du changement de mot de passe" });
      }
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      setMessage({ type: "error", text: "Erreur lors du changement de mot de passe" });
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handlePasswordCancel = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
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

        {/* Informations personnelles */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed text-gray-900"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed text-gray-900"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 cursor-not-allowed"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed text-gray-900"
                placeholder="Votre numéro de téléphone"
              />
            </div>
          </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3 mt-6">
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

        {/* Séparateur */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Changement de mot de passe */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sécurité</h3>
          {!isChangingPassword ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-gray-700">Mot de passe</p>
                <p className="text-sm text-gray-500">Modifiez votre mot de passe pour renforcer la sécurité</p>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingPassword(true)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Changer le mot de passe
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 gap-4">
                {/* Mot de passe actuel */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
                    placeholder="Votre mot de passe actuel"
                    required
                  />
                </div>

                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
                    placeholder="Votre nouveau mot de passe"
                    required
                  />
                </div>

                {/* Confirmation du nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
                    placeholder="Confirmez votre nouveau mot de passe"
                    required
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handlePasswordCancel}
                  disabled={isPasswordSubmitting}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPasswordSubmitting}
                  className="px-6 py-2 bg-[#FF8200] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center"
                >
                  {isPasswordSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {isPasswordSubmitting ? "Modification..." : "Modifier le mot de passe"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}