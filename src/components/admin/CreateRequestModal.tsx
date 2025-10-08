"use client";

import { useState, Fragment } from "react";
import { apiClient } from "@/lib/api";

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRequestModal({ isOpen, onClose, onSuccess }: CreateRequestModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    fonction: "",
    email: "",
    telephone: "",
    circonscription: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | string[] | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Envoyer la requête sans token reCAPTCHA (désactivé)
      const response = await apiClient.createMandate(formData);
      
      if (response.success) {
        onSuccess();
        handleClose();
      } else {
        setError(response.error || "Une erreur est survenue lors de la création de la demande");
      }
    } catch (err: unknown) {
      console.error("Erreur lors de la création de la demande:", err);
      
      // Gestion des erreurs de validation du backend
      if (err && typeof err === 'object' && 'response' in err) {
        const errorWithResponse = err as { response?: { data?: { message?: string | string[] } } };
        if (errorWithResponse.response?.data?.message) {
          setError(errorWithResponse.response.data.message);
        } else {
          setError("Données invalides. Veuillez vérifier les informations saisies.");
        }
      } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message.includes("400")) {
        setError("Données invalides. Veuillez vérifier les informations saisies.");
      } else {
        setError("Erreur de connexion au serveur. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nom: "",
      prenom: "",
      fonction: "",
      email: "",
      telephone: "",
      circonscription: ""
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Overlay */}
      <div className="fixed inset-0 bg-transparent backdrop-blur-sm z-50" onClick={handleClose} />

      {/* Modal de création */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* En-tête du modal */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              Nouvelle demande de mandat
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Remplissez les informations pour créer une nouvelle demande
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nom */}
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] bg-white text-gray-900 transition-colors"
                placeholder="Entrez le nom"
              />
            </div>

            {/* Prénom */}
            <div>
              <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] bg-white text-gray-900 transition-colors"
                placeholder="Entrez le prénom"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] bg-white text-gray-900 transition-colors"
                placeholder="exemple@email.com"
              />
            </div>

            {/* Fonction */}
            <div>
              <label htmlFor="fonction" className="block text-sm font-medium text-gray-700 mb-2">
                Fonction *
              </label>
              <input
                type="text"
                id="fonction"
                name="fonction"
                value={formData.fonction}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] bg-white text-gray-900 transition-colors"
                placeholder="Entrez la fonction"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone *
              </label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] bg-white text-gray-900 transition-colors"
                placeholder="Entrez le numéro de téléphone"
              />
            </div>

            {/* Circonscription */}
            <div>
              <label htmlFor="circonscription" className="block text-sm font-medium text-gray-700 mb-2">
                Circonscription *
              </label>
              <select
                id="circonscription"
                name="circonscription"
                value={formData.circonscription}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] bg-white text-gray-900 transition-colors"
              >
                <option value="">Sélectionnez une circonscription</option>
                <option value="BASSAWA">BASSAWA</option>
                <option value="BONIEREDOUGOU">BONIEREDOUGOU</option>
                <option value="DABAKALA">DABAKALA</option>
                <option value="FOUMBOLO">FOUMBOLO</option>
                <option value="SATAMA-SOKORO">SATAMA-SOKORO</option>
                <option value="SATAMA-SOKOURA">SATAMA-SOKOURA</option>
                <option value="SOKALA-SOBARA">SOKALA-SOBARA</option>
                <option value="TENDENE-BAMBARASSO">TENDENE-BAMBARASSO</option>
                <option value="YAOSSEDOUGOU">YAOSSEDOUGOU</option>
                <option value="NIEMENE">NIEMENE</option>
                <option value="FRONAN">FRONAN</option>
                <option value="KATIOLA">KATIOLA</option>
                <option value="TIMBE">TIMBE</option>
                <option value="NIAKARAMADOUGOU">NIAKARAMADOUGOU</option>
                <option value="TAFIRE">TAFIRE</option>
                <option value="TORTIYA">TORTIYA</option>
                <option value="ARIKOKAHA">ARIKOKAHA</option>
                <option value="BADIKAHA">BADIKAHA</option>
                <option value="NIEDEKAHA">NIEDEKAHA</option>
              </select>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                {Array.isArray(error) ? (
                  <ul className="text-red-700 text-sm space-y-1">
                    {error.map((err, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-red-700 text-sm">{error}</p>
                )}
              </div>
            )}

            {/* Boutons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#FF8200] hover:bg-[#E67400] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-[#FF8200] focus:ring-offset-2"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </div>
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>

            {/* Note */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                * Champs obligatoires
              </p>
            </div>
          </form>
        </div>
      </div>
    </Fragment>
  );
}