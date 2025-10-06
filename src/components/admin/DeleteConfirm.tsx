"use client";

import { Fragment } from "react";

interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requestInfo: {
    nom: string;
    prenom: string;
    id: string;
  } | null;
}

export default function DeleteConfirm({ isOpen, onClose, onConfirm, requestInfo }: DeleteConfirmProps) {
  if (!isOpen || !requestInfo) return null;

  return (
    <Fragment>
      {/* Overlay */}
      <div className="fixed inset-0 bg-transparent backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal de confirmation */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="bg-red-50 px-6 py-4 border-b border-red-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-red-800">
                  Confirmer la suppression
                </h3>
                <p className="text-sm text-red-600">
                  Cette action est irréversible
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-sm text-gray-700 mb-4">
              Êtes-vous sûr de vouloir supprimer définitivement la demande de{' '}
              <span className="font-semibold text-gray-900">
                {requestInfo.prenom} {requestInfo.nom}
              </span>
              {' '}(ID: {requestInfo.id}) ?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">
                  <strong>Attention :</strong> Cette action supprimera définitivement la demande et toutes les données associées. Cette opération ne peut pas être annulée.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF8200] focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm transition-all duration-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="w-full inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto sm:text-sm transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer définitivement
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}