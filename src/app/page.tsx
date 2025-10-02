"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";

export default function Home() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    fonction: "",
    email: "",
    telephone: "",
    circonscription: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await apiClient.createMandate(formData);
      
      if (response.success) {
        setIsSubmitted(true);
      } else {
        setError(response.error || "Une erreur est survenue lors de l'envoi du formulaire");
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi du formulaire:", err);
      setError("Erreur de connexion au serveur. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
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
                  Formulaire de demande de mandat
                </h1>
                <p className="text-gray-600">
                  Veuillez remplir vos informations pour la demande de mandat
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-colors"
                      placeholder="Entrez votre fonction"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-colors"
                      placeholder="Entrez votre numero de téléphone"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-colors"
                    >
                      <option value="">Sélectionnez une circonscription</option>
                      <option value="Abidjan-Plateau">Abidjan-Plateau</option>
                      <option value="Abobo">Abobo</option>
                      <option value="Adjamé">Adjamé</option>
                      <option value="Anyama">Anyama</option>
                      <option value="Attécoubé">Attécoubé</option>
                      <option value="Bingerville">Bingerville</option>
                      <option value="Cocody">Cocody</option>
                      <option value="Koumassi">Koumassi</option>
                      <option value="Marcory">Marcory</option>
                      <option value="Port-Bouët">Port-Bouët</option>
                      <option value="Treichville">Treichville</option>
                      <option value="Yopougon">Yopougon</option>
                      <option value="Abengourou">Abengourou</option>
                      <option value="Aboisso">Aboisso</option>
                      <option value="Adiaké">Adiaké</option>
                      <option value="Agnibilékrou">Agnibilékrou</option>
                      <option value="Akoupé">Akoupé</option>
                      <option value="Alépé">Alépé</option>
                      <option value="Bocanda">Bocanda</option>
                      <option value="Bondoukou">Bondoukou</option>
                      <option value="Bongouanou">Bongouanou</option>
                      <option value="Bouaflé">Bouaflé</option>
                      <option value="Bouaké">Bouaké</option>
                      <option value="Bouna">Bouna</option>
                      <option value="Boundiali">Boundiali</option>
                      <option value="Dabakala">Dabakala</option>
                      <option value="Dabou">Dabou</option>
                      <option value="Daloa">Daloa</option>
                      <option value="Danané">Danané</option>
                      <option value="Daoukro">Daoukro</option>
                      <option value="Dimbokro">Dimbokro</option>
                      <option value="Divo">Divo</option>
                      <option value="Duékoué">Duékoué</option>
                      <option value="Ferkessédougou">Ferkessédougou</option>
                      <option value="Gagnoa">Gagnoa</option>
                      <option value="Grand-Bassam">Grand-Bassam</option>
                      <option value="Grand-Lahou">Grand-Lahou</option>
                      <option value="Guiglo">Guiglo</option>
                      <option value="Issia">Issia</option>
                      <option value="Jacqueville">Jacqueville</option>
                      <option value="Katiola">Katiola</option>
                      <option value="Korhogo">Korhogo</option>
                      <option value="Lakota">Lakota</option>
                      <option value="Man">Man</option>
                      <option value="Mankono">Mankono</option>
                      <option value="Odienné">Odienné</option>
                      <option value="Oumé">Oumé</option>
                      <option value="Sakassou">Sakassou</option>
                      <option value="San-Pédro">San-Pédro</option>
                      <option value="Sassandra">Sassandra</option>
                      <option value="Séguéla">Séguéla</option>
                      <option value="Sinfra">Sinfra</option>
                      <option value="Soubré">Soubré</option>
                      <option value="Tabou">Tabou</option>
                      <option value="Tanda">Tanda</option>
                      <option value="Tiassalé">Tiassalé</option>
                      <option value="Touba">Touba</option>
                      <option value="Toumodi">Toumodi</option>
                      <option value="Vavoua">Vavoua</option>
                      <option value="Yamoussoukro">Yamoussoukro</option>
                      <option value="Zuénoula">Zuénoula</option>
                    </select>
                  </div>

                  {/* Message d'erreur */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Bouton de soumission */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#FF8200] hover:bg-[#E67400] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Envoi en cours...
                      </div>
                    ) : (
                      "Soumettre la demande"
                    )}
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
