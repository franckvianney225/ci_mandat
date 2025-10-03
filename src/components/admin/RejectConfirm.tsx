"use client";

import { Fragment } from "react";

interface RejectConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requestInfo: {
    nom: string;
    prenom: string;
    id: string;
  } | null;
}

export default function RejectConfirm({ isOpen, onClose, onConfirm, requestInfo }: RejectConfirmProps) {
  if (!isOpen || !requestInfo) return null;

  return (
    <Fragment>
      {/* Overlay */}
      <div className="fixed inset-0 bg-transparent backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal de confirmation */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-xl max-w-md w-full">
          {/* En-tête */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirmer le rejet</h3>
                <p className="text-sm text-gray-600">Demande #{requestInfo.id}</p>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="px-6 py-4">
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir rejeter la demande de <strong>{requestInfo.prenom} {requestInfo.nom}</strong> ?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Cette action marquera la demande comme rejetée et ne pourra pas être annulée.
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}