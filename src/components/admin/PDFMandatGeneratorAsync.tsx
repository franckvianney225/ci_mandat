'use client';
import { useState, useEffect, useRef } from 'react';

interface MandateData {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  circonscription: string;
  referenceNumber: string;
  status: string;
  createdAt: string;
}

interface PDFMandatGeneratorAsyncProps {
  mandate: MandateData;
  onClose: () => void;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error';

export default function PDFMandatGeneratorAsync({
  mandate,
  onClose,
  onProgress,
  onError
}: PDFMandatGeneratorAsyncProps) {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialiser le worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(new URL('@/workers/PDFWorker.ts', import.meta.url));
        
        workerRef.current.onmessage = (event: MessageEvent) => {
          const { type, data, progress: workerProgress } = event.data;

          switch (type) {
            case 'status':
              const newProgress = workerProgress || progress + 10;
              setProgress(newProgress);
              onProgress?.(newProgress);
              break;

            case 'complete':
              setStatus('completed');
              setProgress(100);
              onProgress?.(100);
              
              // Télécharger le PDF généré
              if (data?.pdfBlob && data?.fileName) {
                const url = URL.createObjectURL(data.pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = data.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }
              
              // Fermer après un court délai
              setTimeout(() => {
                onClose();
              }, 1000);
              break;

            case 'error':
              setStatus('error');
              setErrorMessage(data || 'Erreur inconnue lors de la génération PDF');
              onError?.(data || 'Erreur inconnue');
              break;
          }
        };

        workerRef.current.onerror = (error) => {
          console.error('Erreur du worker PDF:', error);
          setStatus('error');
          setErrorMessage('Erreur technique lors de la génération PDF');
          onError?.('Erreur technique');
        };
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du worker:', error);
        fallbackToSyncGeneration();
      }
    } else {
      // Fallback pour navigateurs sans Web Workers
      fallbackToSyncGeneration();
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Fallback vers la génération synchrone
  const fallbackToSyncGeneration = async () => {
    try {
      setStatus('generating');
      setProgress(50);
      
      // Importer dynamiquement le générateur synchrone
      const { generateMandatePDF } = await import('./PDFMandatGenerator');
      generateMandatePDF(mandate);
      
      setStatus('completed');
      setProgress(100);
      onProgress?.(100);
      
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la génération synchrone:', error);
      setStatus('error');
      setErrorMessage('Erreur lors de la génération PDF');
      onError?.('Erreur lors de la génération PDF');
    }
  };

  // Démarrer la génération
  useEffect(() => {
    if (workerRef.current && status === 'idle') {
      setStatus('generating');
      setProgress(0);
      workerRef.current.postMessage({
        type: 'generate',
        mandate
      });
    }
  }, [mandate, status]);

  // Afficher l'état de progression
  const renderProgress = () => {
    switch (status) {
      case 'generating':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Génération du PDF en cours...
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Veuillez patienter pendant la création du document.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {progress}% complété
                </p>
              </div>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  PDF généré avec succès !
                </h3>
                <p className="text-sm text-gray-600">
                  Le téléchargement va commencer automatiquement.
                </p>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Erreur de génération
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {errorMessage || 'Une erreur est survenue lors de la génération du PDF.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => {
                      setStatus('idle');
                      setErrorMessage(null);
                      setProgress(0);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderProgress();
}