"use client";

import React from 'react';

interface PDFMandatProps {
  nom: string;
  prenom: string;
  bureauVote: string;
  circonscription: string;
  dateEmission: string;
  numeroCandidat: string;
}

export default function PDFMandat({
  nom = "GUIBESSONGUI",
  prenom = "N'DATIEN SEVERIN",
  bureauVote = "...............",
  circonscription = "ARIKOKAHA-NIAKARA-TORTIYA",
  dateEmission = "14 Avril 2021",
  numeroCandidat = "................."
}: PDFMandatProps) {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-8" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* En-tête avec logos */}
      <div className="flex items-start justify-between mb-8">
        {/* Logo CEI à gauche */}
        <div className="text-left">
          <div className="text-sm font-bold text-black mb-2">COMMISSION ELECTORALE</div>
          <div className="text-sm font-bold text-black mb-2">INDÉPENDANTE</div>
          <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-2">
            <div className="text-xs font-bold text-black text-center">
              CEI
            </div>
          </div>
          <div className="text-xs text-black font-semibold">CURESS</div>
          <div className="text-xs text-gray-600">L'Espérance au Service du Peuple</div>
        </div>

        {/* Titre à droite */}
        <div className="text-right">
          <div className="text-sm text-black mb-1">RÉPUBLIQUE DE CÔTE D'IVOIRE</div>
          <div className="text-sm text-black">Union-Discipline-Travail</div>
        </div>
      </div>

      {/* Titre principal */}
      <div className="text-center mb-8">
        <div className="border-4 border-black p-4 mb-4">
          <div className="text-xl font-bold text-black mb-2">ÉLECTION PRESIDENTIELLE</div>
          <div className="text-lg font-bold text-blue-600">SCRUTIN DU 25 OCTOBRE 2025</div>
        </div>
      </div>

      {/* Sous-titre */}
      <div className="text-center mb-8">
        <div className="text-lg font-bold text-black underline">MANDAT DU REPRÉSENTANT PRINCIPAL</div>
        <div className="text-lg font-bold text-black underline">DANS LE BUREAU DE VOTE</div>
      </div>

      {/* Corps du document */}
      <div className="mb-8 text-sm text-black leading-relaxed">
        <p className="mb-4">
          Conformément aux dispositions des articles 35 nouveau et 38 du code électoral :
        </p>

        <p className="mb-4">
          <strong>ALLASSANE OUATTARA</strong> candidat à l'élection présidentielle du 25 octobre 2025,
        </p>

        <p className="mb-4">
          donne mandat à Mme/M....................{numeroCandidat}....................................................
        </p>

        <p className="mb-4">
          pour le représenter dans le Bureau de vote n°................................................
        </p>

        <p className="mb-4">
          du Lieu de Vote................................................................................................
        </p>

        <p className="mb-4">
          de la circonscription électorale d'<strong>{circonscription}</strong>.
        </p>

        <p className="mb-8">
          Le présent mandat lui est délivré en qualité de Représentant(e) Principal(e) pour servir les intérêts du Candidat <strong>{prenom} {nom}</strong> et en valoir ce que de droit.
        </p>
      </div>

      {/* Date et signature */}
      <div className="flex justify-between items-end">
        <div className="text-sm text-black">
          Fait .................................................. le {dateEmission}
        </div>

        <div className="text-center">
          <div className="text-sm text-black mb-8">Le Candidat</div>
          <div className="text-lg font-bold text-black underline">
            Dr {prenom} {nom}
          </div>
        </div>
      </div>
    </div>
  );
}