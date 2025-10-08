
"use client";

import { useState } from "react";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { apiClient } from "@/lib/api";

interface FieldErrors {
  [key: string]: string[];
}

function MandateForm() {
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
  const [error, setError] = useState<string | string[] | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!executeRecaptcha) {
      console.error('reCAPTCHA non initialisé');
      setError("Veuillez patienter pendant le chargement de la protection de sécurité...");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Générer le token reCAPTCHA
      console.log('Génération du token reCAPTCHA...');
      const recaptchaToken = await executeRecaptcha('mandate_submission');
      console.log('Token reCAPTCHA généré:', recaptchaToken ? 'OUI' : 'NON');
      
      const response = await apiClient.createMandate(formData, recaptchaToken);
      
      if (response.success) {
        setIsSubmitted(true);
      } else {
        setError(response.error || "Une erreur est survenue lors de l'envoi du formulaire");
      }
    } catch (err: unknown) {
      console.error("Erreur lors de l'envoi du formulaire:", err);
      
      // Gestion des erreurs de validation détaillées du backend
      if (err && typeof err === 'object' && 'responseData' in err) {
        const apiError = err as {
          responseData?: {
            message?: string | string[];
            error?: string;
            errors?: FieldErrors;
          }
        };
        
        if (apiError.responseData?.errors) {
          // Erreurs de validation détaillées par champ (format NestJS ValidationPipe)
          setFieldErrors(apiError.responseData.errors);
        } else if (apiError.responseData?.message) {
          // Message d'erreur général
          if (Array.isArray(apiError.responseData.message)) {
            setError(apiError.responseData.message);
          } else {
            setError(apiError.responseData.message);
          }
        } else if (apiError.responseData?.error) {
          // Erreur simple
          setError(apiError.responseData.error);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur du champ quand l'utilisateur commence à taper
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const getFieldError = (fieldName: string): string | null => {
    return fieldErrors[fieldName]?.[0] || null;
  };

  const getInputClassName = (fieldName: string): string => {
    const baseClass = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 transition-colors";
    if (fieldErrors[fieldName]) {
      return `${baseClass} border-red-500 focus:border-red-500`;
    }
    return `${baseClass} border-gray-300 focus:border-orange-500`;
  };

  const ErrorIndicator = ({ fieldName }: { fieldName: string }) => {
    if (!getFieldError(fieldName)) return null;
    
    return (
      <div className="flex items-center text-red-600">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">Erreur</span>
      </div>
    );
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
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                        Nom *
                      </label>
                      <ErrorIndicator fieldName="nom" />
                    </div>
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      className={getInputClassName("nom")}
                      placeholder="Entrez votre nom"
                    />
                    {getFieldError("nom") && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError("nom")}</p>
                    )}
                  </div>

                  {/* Prénom */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                        Prénom *
                      </label>
                      <ErrorIndicator fieldName="prenom" />
                    </div>
                    <input
                      type="text"
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      required
                      className={getInputClassName("prenom")}
                      placeholder="Entrez votre prénom"
                    />
                    {getFieldError("prenom") && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError("prenom")}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email *
                      </label>
                      <ErrorIndicator fieldName="email" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={getInputClassName("email")}
                      placeholder="exemple@email.com"
                    />
                    {getFieldError("email") && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError("email")}</p>
                    )}
                  </div>

                  {/* Fonction */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="fonction" className="block text-sm font-medium text-gray-700">
                        Fonction *
                      </label>
                      <ErrorIndicator fieldName="fonction" />
                    </div>
                    <input
                      type="text"
                      id="fonction"
                      name="fonction"
                      value={formData.fonction}
                      onChange={handleChange}
                      required
                      className={getInputClassName("fonction")}
                      placeholder="Entrez votre fonction"
                    />
                    {getFieldError("fonction") && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError("fonction")}</p>
                    )}
                  </div>

                  {/* Téléphone */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                        Numéro de téléphone *
                      </label>
                      <ErrorIndicator fieldName="telephone" />
                    </div>
                    <input
                      type="tel"
                      id="telephone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      required
                      className={getInputClassName("telephone")}
                      placeholder="Entrez votre numero de téléphone"
                    />
                    {getFieldError("telephone") && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError("telephone")}</p>
                    )}
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
                      className={getInputClassName("circonscription")}
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
                    {getFieldError("circonscription") && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError("circonscription")}</p>
                    )}
                  </div>

                  {/* Message d'erreur général */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

                  {/* Protection reCAPTCHA */}
                  <div className="text-xs text-gray-500 text-center">
                    Ce site est protégé par reCAPTCHA et soumis aux 
                    <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline mx-1">Politique de confidentialité</a>
                    et aux
                    <a href="https://policies.google.com/terms" className="text-blue-600 hover:underline mx-1">Conditions d&apos;utilisation</a>
                    de Google.
                  </div>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}>
      <MandateForm />
    </GoogleReCaptchaProvider>
  );
}
