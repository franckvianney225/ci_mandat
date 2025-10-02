"use client";

import { Fragment, useState } from "react";
import ValidateConfirm from "./ValidateConfirm";
import RejectConfirm from "./RejectConfirm";
import PDFMandat from "./PDFMandat";

interface Request {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  circonscription: string;
  status: "pending" | "validated" | "rejected";
  createdAt: string;
  referenceNumber: string;
}

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request | null;
  onStatusChange?: (requestId: number, newStatus: "pending" | "validated" | "rejected") => void;
}

export default function ClientDetailsModal({ isOpen, onClose, request, onStatusChange }: ClientDetailsModalProps) {
  const [isValidateConfirmOpen, setIsValidateConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);

  if (!isOpen || !request) return null;

  const handleValidateClick = () => {
    setIsValidateConfirmOpen(true);
  };

  const handleRejectClick = () => {
    setIsRejectConfirmOpen(true);
  };

  const handleConfirmValidate = () => {
    if (onStatusChange) {
      onStatusChange(parseInt(request.id), "validated");
    }
    setIsValidateConfirmOpen(false);
    onClose();
  };

  const handleConfirmReject = () => {
    if (onStatusChange) {
      onStatusChange(parseInt(request.id), "rejected");
    }
    setIsRejectConfirmOpen(false);
    onClose();
  };

  const handleCloseValidateConfirm = () => {
    setIsValidateConfirmOpen(false);
  };

  const handleCloseRejectConfirm = () => {
    setIsRejectConfirmOpen(false);
  };

  const handlePrintPDF = () => {
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Générer le contenu HTML du PDF
    const pdfContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mandat - ${request.prenom} ${request.nom}</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 1cm; }
            }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          ${document.getElementById('pdf-mandat-content')?.outerHTML || ''}
        </body>
      </html>
    `;

    // Écrire le contenu dans la nouvelle fenêtre
    printWindow.document.write(pdfContent);
    printWindow.document.close();

    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();

      // Fermer la fenêtre après l'impression (optionnel)
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "validated":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "validated":
        return "Validé";
      case "rejected":
        return "Rejeté";
      default:
        return "Inconnu";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case "validated":
        return (
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case "rejected":
        return (
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Fragment>
      {/* Overlay */}
      <div className="fixed inset-0 bg-transparent backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* En-tête du modal */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                  <span className="text-xl font-bold text-white">
                    {request.prenom[0]}{request.nom[0]}
                  </span>
                </div>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {request.prenom} {request.nom}
                  </h2>
                  <p className="text-sm text-gray-600">Référence: {request.referenceNumber}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenu du modal */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Informations personnelles
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {request.prenom} {request.nom}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {request.email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {request.telephone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations de la demande */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Informations de la demande
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Circonscription
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {request.circonscription}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de la demande
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {new Date(request.createdAt).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border ${getStatusClasses(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {getStatusText(request.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section d'actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <button
                    onClick={handlePrintPDF}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimer PDF
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleRejectClick}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Rejeter
                  </button>

                  <button
                    onClick={handleValidateClick}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Valider
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de confirmation pour la validation */}
      <ValidateConfirm
        isOpen={isValidateConfirmOpen}
        onClose={handleCloseValidateConfirm}
        onConfirm={handleConfirmValidate}
        requestInfo={request ? {
          nom: request.nom,
          prenom: request.prenom,
          id: parseInt(request.id)
        } : null}
      />

      {/* Modal de confirmation pour le rejet */}
      <RejectConfirm
        isOpen={isRejectConfirmOpen}
        onClose={handleCloseRejectConfirm}
        onConfirm={handleConfirmReject}
        requestInfo={request ? {
          nom: request.nom,
          prenom: request.prenom,
          id: parseInt(request.id)
        } : null}
      />
    </Fragment>
  );
}