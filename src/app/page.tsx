"use client";

import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    departement: "",
    telephone: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Données du formulaire:", formData);
    // Ici vous pouvez ajouter la logique pour envoyer les données
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {isSubmitted ? (
            // Message de confirmation
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-800 mb-4">
                  Merci d&apos;avoir renseigné le formulaire
                </h2>
                <p className="text-green-700 text-lg">
                  Votre demande a bien été transmise et sera traitée dans les plus brefs délais
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* En-tête */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Formulaire d&apos;inscription
                </h1>
                <p className="text-gray-600">
                  Veuillez remplir vos informations personnelles
                </p>
              </div>

              {/* Formulaire */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-colors"
                      placeholder="Entrez votre nom"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-colors"
                      placeholder="Entrez votre prénom"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-colors"
                      placeholder="exemple@email.com"
                    />
                  </div>

                  {/* Département */}
                  <div>
                    <label htmlFor="departement" className="block text-sm font-medium text-gray-700 mb-2">
                      Département *
                    </label>
                    <select
                      id="departement"
                      name="departement"
                      value={formData.departement}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-colors"
                    >
                      <option value="">Sélectionnez un département</option>
                      <option value="X">Département X</option>
                      <option value="Y">Département Y</option>
                      <option value="Z">Département Z</option>
                    </select>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-colors"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  {/* Bouton de soumission */}
                  <button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    Soumettre le formulaire
                  </button>
                </form>
              </div>

              {/* Note */}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  * Champs obligatoires
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
