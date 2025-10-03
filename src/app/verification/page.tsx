'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface VerificationResult {
  isValid: boolean;
  mandate?: {
    referenceNumber: string;
    clientName: string;
    clientEmail: string;
    createdAt: string;
    status: string;
  };
  message: string;
}

export default function VerificationPage() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const ref = searchParams.get('ref');
  const sig = searchParams.get('sig');

  useEffect(() => {
    const verifyMandate = async () => {
      if (!ref || !sig) {
        setResult({
          isValid: false,
          message: 'Paramètres de vérification manquants'
        });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/v1/verification/verify?ref=${ref}&sig=${sig}`);
        const data = await response.json();
        
        setResult(data);
      } catch (error) {
        setResult({
          isValid: false,
          message: 'Erreur lors de la vérification'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyMandate();
  }, [ref, sig]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Vérification en cours...</h2>
          <p className="text-gray-600 mt-2">Veuillez patienter pendant que nous vérifions le mandat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            result?.isValid ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {result?.isValid ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {result?.isValid ? 'Mandat Valide' : 'Mandat Non Valide'}
          </h1>
          
          <p className={`text-lg font-medium ${
            result?.isValid ? 'text-green-600' : 'text-red-600'
          }`}>
            {result?.message}
          </p>
        </div>

        {result?.mandate && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails du Mandat</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Numéro de référence:</span>
                <span className="font-medium text-gray-900">{result.mandate.referenceNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium text-gray-900">{result.mandate.clientName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{result.mandate.clientEmail}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Date de création:</span>
                <span className="font-medium text-gray-900">
                  {new Date(result.mandate.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span className={`font-medium ${
                  result.mandate.status === 'APPROVED' ? 'text-green-600' : 
                  result.mandate.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {result.mandate.status === 'APPROVED' ? 'Approuvé' : 
                   result.mandate.status === 'PENDING' ? 'En attente' : 'Rejeté'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Ce système de vérification permet de détecter les mandats falsifiés grâce à une signature cryptographique sécurisée.
          </p>
        </div>
      </div>
    </div>
  );
}