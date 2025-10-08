"use client";

import { useState, useEffect, useCallback } from "react";

interface RecaptchaHook {
  executeRecaptcha: (action?: string) => Promise<string | null>;
  isRecaptchaLoaded: boolean;
  recaptchaError: string | null;
}

/**
 * Hook personnalisé pour gérer l'intégration reCAPTCHA v3
 * @returns {RecaptchaHook} Fonctions et état pour reCAPTCHA
 */
export function useRecaptcha(): RecaptchaHook {
  const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  // Charger le script reCAPTCHA
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!siteKey) {
      console.warn("Clé reCAPTCHA non configurée. La vérification sera désactivée.");
      setIsRecaptchaLoaded(true);
      return;
    }

    // Vérifier si le script est déjà chargé
    if (window.grecaptcha) {
      setIsRecaptchaLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("Script reCAPTCHA chargé avec succès");
      setIsRecaptchaLoaded(true);
      setRecaptchaError(null);
    };

    script.onerror = () => {
      console.error("Erreur lors du chargement du script reCAPTCHA");
      setRecaptchaError("Impossible de charger reCAPTCHA. Vérifiez votre connexion.");
      setIsRecaptchaLoaded(true); // On considère comme chargé même en cas d'erreur
    };

    document.head.appendChild(script);

    return () => {
      // Nettoyage : retirer le script si nécessaire
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  /**
   * Exécute reCAPTCHA et retourne le token
   * @param action - Action reCAPTCHA (optionnelle)
   * @returns Promise<string | null> - Token reCAPTCHA ou null en cas d'erreur
   */
  const executeRecaptcha = useCallback(async (action: string = "submit"): Promise<string | null> => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    // Si pas de clé configurée, retourner null (mode développement)
    if (!siteKey) {
      console.warn("Mode développement - reCAPTCHA désactivé");
      return null;
    }

    // Vérifier que reCAPTCHA est chargé
    if (!window.grecaptcha || !isRecaptchaLoaded) {
      console.error("reCAPTCHA non chargé");
      setRecaptchaError("reCAPTCHA n'est pas disponible");
      return null;
    }

    try {
      console.log(`Exécution reCAPTCHA pour l'action: ${action}`);
      
      const token = await window.grecaptcha.execute(siteKey, { action });
      
      console.log("Token reCAPTCHA généré avec succès");
      setRecaptchaError(null);
      return token;
    } catch (error) {
      console.error("Erreur lors de l'exécution de reCAPTCHA:", error);
      setRecaptchaError("Erreur lors de la vérification de sécurité");
      return null;
    }
  }, [isRecaptchaLoaded]);

  return {
    executeRecaptcha,
    isRecaptchaLoaded,
    recaptchaError,
  };
}

// Déclaration TypeScript pour l'objet global grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}