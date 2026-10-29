/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CLASSIFIED CASE FILES VIEWER — FIRST DIRECTIVE
 * 
 * A forensic archive viewer for the 5 historic Zodiac classified overview dossiers.
 * Supports:
 * - Clear multi-document navigation (Docs 1-5, preserving separate Draft & Standard files)
 * - Authentic typewriter/classified docket layout with archival rubber stamps
 * - Dual-mode inspection: Declassified Transcription vs. Original Archival Scan (facsimile)
 * - Zoom & pan controls for photographic evidence inspection
 * - Return-to-directive action returning investigators to their active assignment
 * - Fully responsive for mobile and desktop screens
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Compass,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Lock,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CLASSIFIED_CASE_DOCUMENTS,
  type CaseDocumentItem,
} from '@/src/lib/caseDocuments';
import { tacticalAudio } from '@/src/lib/tacticalAudio';
import { CASE_ID } from '@/src/lib/mockData';

interface ClassifiedCaseFilesViewerProps {
  initialDocId?: string;
  onReturnToDirective: () => void;
  isModal?: boolean;
}

export function ClassifiedCaseFilesViewer({
  initialDocId,
  onReturnToDirective,
  isModal = false,
}: ClassifiedCaseFilesViewerProps) {
  const [selectedId, setSelectedId] = useState<string>(
    () => initialDocId || CLASSIFIED_CASE_DOCUMENTS[0].id
  );
  const [viewMode, setViewMode] = useState<'transcript' | 'scan'>('transcript');
  const [scanZoom, setScanZoom] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');

  const currentDocIndex = CLASSIFIED_CASE_DOCUMENTS.findIndex((d) => d.id === selectedId);
  const currentDoc =
    currentDocIndex !== -1 ? CLASSIFIED_CASE_DOCUMENTS[currentDocIndex] : CLASSIFIED_CASE_DOCUMENTS[0];

  const handleSelectDoc = (id: string) => {
    tacticalAudio.playDocOpen();
    setSelectedId(id);
    setScanZoom(1);
  };

  const handleNextDoc = () => {
    const nextIndex = (currentDocIndex + 1) % CLASSIFIED_CASE_DOCUMENTS.length;
    handleSelectDoc(CLASSIFIED_CASE_DOCUMENTS[nextIndex].id);
  };

  const handlePrevDoc = () => {
    const prevIndex =
      (currentDocIndex - 1 + CLASSIFIED_CASE_DOCUMENTS.length) % CLASSIFIED_CASE_DOCUMENTS.length;
    handleSelectDoc(CLASSIFIED_CASE_DOCUMENTS[prevIndex].id);
  };

  // Filtered documents for search
  const filteredDocs = CLASSIFIED_CASE_DOCUMENTS.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.victimName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col bg-[#0a0c0a] text-[#ebe6dc] border border-[#2b3a30] shadow-[0_0_50px_rgba(10,35,18,0.5)] font-mono text-xs overflow-hidden">
      {/* Top Header Bar */}
      <header className="bg-[#101512] border-b border-[#233327] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              onReturnToDirective();
            }}
            className="flex items-center gap-1.5 text-xs text-[#8deb9e] hover:text-white transition-colors border border-[#27402e] bg-[#142118] px-3 py-1.5 font-bold"
          >
            <ArrowLeft size={14} />
            <span>RETURN TO FIRST DIRECTIVE</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#233327]">
            <span className="size-2 rounded-full bg-crimson animate-ping" />
            <span className="font-bold tracking-widest text-[#dcd6c9] uppercase text-[11px]">
              CLASSIFIED DOSSIER ARCHIVE // CASE {CASE_ID}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dual Inspection Mode Switcher */}
          <div className="flex items-center bg-[#0d120e] border border-[#233327] p-0.5">
            <button
              onClick={() => {
                tacticalAudio.playButtonClick();
                setViewMode('transcript');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold transition-colors ${
                viewMode === 'transcript'
                  ? 'bg-[#1e2e22] text-[#8deb9e] shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText size={13} />
              <span>Declassified Transcript</span>
            </button>
            <button
              onClick={() => {
                tacticalAudio.playButtonClick();
                setViewMode('scan');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold transition-colors ${
                viewMode === 'scan'
                  ? 'bg-crimson/25 text-red-200 border border-crimson/40 shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon size={13} />
              <span>Archival Scan Facsimile</span>
            </button>
          </div>

          {isModal && (
            <button
              onClick={() => {
                tacticalAudio.playButtonClick();
                onReturnToDirective();
              }}
              className="text-muted-foreground hover:text-foreground p-1.5 border border-[#233327] hover:border-[#38523f]"
              aria-label="Close dossier viewer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area: Responsive Sidebar + Document Sheet */}
      <div className="flex flex-col lg:flex-row min-h-[640px] max-h-[85vh]">
        {/* Document Navigation Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-[#233327] bg-[#0c100d] flex flex-col">
          {/* Section Banner */}
          <div className="p-3.5 border-b border-[#233327] bg-[#121914] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8deb9e] flex items-center gap-1.5">
                <FolderOpen size={13} />
                <span>FIRST DIRECTIVE DOSSIERS ({CLASSIFIED_CASE_DOCUMENTS.length})</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-[#1b2b1f] text-[#8deb9e] border border-[#2b4432]">
                DEEP ARCHIVE
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal m-0">
              5 declassified overview records from 1968–1969 incidents. Review before proceeding to
              Stage 01 vault dockets.
            </p>
          </div>

          {/* Search Box */}
          <div className="p-2.5 border-b border-[#233327] bg-[#090d0a]">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search case #, victim, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111713] border border-[#243328] pl-7 pr-2 py-1.5 text-[11px] text-[#ebe6dc] focus:outline-none focus:border-[#8deb9e]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Document Tabs List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1b261e] p-2 space-y-1">
            {filteredDocs.map((doc, idx) => {
              const isSelected = doc.id === currentDoc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc.id)}
                  className={`w-full text-left p-3 transition-colors flex flex-col gap-1 border ${
                    isSelected
                      ? 'bg-[#18261c] border-[#3e6849] shadow-[0_0_15px_rgba(62,104,73,0.3)]'
                      : 'bg-[#0f1410] border-[#1d2920] hover:bg-[#141b16] hover:border-[#273a2c]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-bold tracking-wider ${
                        isSelected ? 'text-[#8deb9e]' : 'text-muted-foreground'
                      }`}
                    >
                      FILE 0{doc.documentNumber} // {doc.caseNumber}
                    </span>
                    {doc.isDraftOrCorrupted ? (
                      <span className="text-[9px] px-1 py-0.2 text-amber-300 bg-amber-950/60 border border-amber-600/40">
                        GLITCHED / DRAFT
                      </span>
                    ) : (
                      <span className="text-[9px] px-1 py-0.2 text-emerald-400 bg-emerald-950/60 border border-emerald-600/30">
                        STANDARD
                      </span>
                    )}
                  </div>
                  <div className="font-serif text-[13px] font-normal text-[#e8e2d5] truncate">
                    {doc.victimName}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-0.5">
                    <span>{doc.dateOfIncident}</span>
                    <span className="text-[9px] uppercase tracking-wide opacity-80">
                      {doc.agencyHeader.dept.split('•')[0].trim().slice(0, 18)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Pagination footer */}
          <div className="p-3 border-t border-[#233327] bg-[#111713] flex items-center justify-between text-[11px]">
            <button
              onClick={handlePrevDoc}
              className="px-2.5 py-1 border border-[#233327] hover:border-[#8deb9e] text-muted-foreground hover:text-white transition-colors"
            >
              ← Previous File
            </button>
            <span className="text-[#8deb9e] font-bold">
              0{currentDoc.documentNumber} / 0{CLASSIFIED_CASE_DOCUMENTS.length}
            </span>
            <button
              onClick={handleNextDoc}
              className="px-2.5 py-1 border border-[#233327] hover:border-[#8deb9e] text-muted-foreground hover:text-white transition-colors"
            >
              Next File →
            </button>
          </div>
        </aside>

        {/* Main Document Inspection Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070908] flex flex-col justify-between">
          <div className="max-w-4xl w-full mx-auto space-y-6">
            {/* Context alert for glitched vs standard versions (Docs 2 & 4) */}
            {currentDoc.id === 'sol-1968-1220-draft' && (
              <div className="p-3.5 bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                    ARCHIVAL CORRUPTION DETECTED // DRAFT TRANSMISSION RECORD
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed m-0 font-serif">
                    This file contains garbled teletype anomalies, syntax collisions, and corrupted
                    word clusters (e.g. <em>"hih Larm Arthur..."</em>, <em>"vehiced"</em>,{' '}
                    <em>"fcrraalant"</em>, <em>"lititial"</em>, <em>"likis"</em>). All corrupted
                    character strings have been preserved verbatim for forensic comparative analysis
                    against Standard Version SOL-1968-1220 (Doc 04).
                  </p>
                </div>
              </div>
            )}

            {currentDoc.id === 'sol-1968-1220-std' && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-700/50 text-emerald-200 text-xs flex items-start gap-3">
                <FileCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">
                    CANONICAL SOLANO DEPARTMENT SUMMARY // STANDARD REVISED VERSION
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed m-0">
                    Comparative clean record concerning the Lake Herman Road turnout double homicide
                    of David Arthur Faraday and Betty Lou Jensen. Maintained as a distinct record from
                    Draft Document 02.
                  </p>
                </div>
              </div>
            )}

            {/* Document Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#233327] pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#17231a] text-[#8deb9e] border border-[#2c4b34] font-bold">
                  CASE FILE {currentDoc.caseNumber}
                </span>
                <span className="text-muted-foreground hidden sm:inline">
                  • Incident Date: {currentDoc.dateOfIncident}
                </span>
              </div>

              {viewMode === 'scan' && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-[11px]">Zoom:</span>
                  <button
                    onClick={() => setScanZoom((z) => Math.max(0.7, +(z - 0.2).toFixed(1)))}
                    className="p-1 border border-[#233327] hover:border-[#8deb9e] text-muted-foreground hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="font-mono text-[10px] text-[#8deb9e] w-12 text-center">
                    {Math.round(scanZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setScanZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(1)))}
                    className="p-1 border border-[#233327] hover:border-[#8deb9e] text-muted-foreground hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    onClick={() => setScanZoom(1)}
                    className="p-1 border border-[#233327] hover:border-[#8deb9e] text-muted-foreground hover:text-white text-[10px]"
                    title="Reset Zoom"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* 1. VIEW MODE: DECLASSIFIED TRANSCRIPTION (TYPEWRITER SHEET) */}
            {viewMode === 'transcript' ? (
              <div
                className="relative bg-[#ebe4d3] text-[#1c1917] p-6 sm:p-10 md:p-12 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-[#c4baa1] font-mono leading-relaxed"
                style={{
                  backgroundImage: 'radial-gradient(#d6cbb1 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              >
                {/* Vintage archival paper stain overlay */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none opacity-25 mix-blend-multiply bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100 via-transparent to-amber-900/20"
                />

                {/* Top Agency Header & Confidential Rubber Stamps */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-[#1c1917] pb-4 mb-6">
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs uppercase tracking-wider text-[#1c1917]">
                      {currentDoc.agencyHeader.dept}
                    </div>
                    {currentDoc.agencyHeader.subDept && (
                      <div className="text-[11px] text-[#44403c] uppercase tracking-wide">
                        {currentDoc.agencyHeader.subDept}
                      </div>
                    )}
                    {currentDoc.agencyHeader.addressLines?.map((line, i) => (
                      <div key={i} className="text-[10px] text-[#57534e]">
                        {line}
                      </div>
                    ))}
                  </div>

                  {/* Rubber stamps */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 self-end sm:self-start">
                    {currentDoc.stamps.map((stamp, idx) => {
                      const isSecret = stamp.includes('SECRET');
                      const isConfidential = stamp.includes('CONFIDENTIAL');
                      const isActive = stamp.includes('ACTIVE');
                      return (
                        <div
                          key={idx}
                          className={`font-mono font-black text-[11px] tracking-[0.2em] uppercase px-2.5 py-0.5 border-2 transform ${
                            idx % 2 === 0 ? '-rotate-1' : 'rotate-2'
                          } ${
                            isSecret
                              ? 'border-red-700 text-red-700 bg-red-100/40'
                              : isConfidential
                              ? 'border-red-800 text-red-800 bg-red-50/50'
                              : isActive
                              ? 'border-emerald-800 text-emerald-800 bg-emerald-50/40'
                              : 'border-[#44403c] text-[#44403c]'
                          }`}
                        >
                          {stamp}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Document Main Headline */}
                <div className="space-y-1 mb-6">
                  <h1 className="font-mono text-xl sm:text-2xl font-black tracking-tight text-[#1c1917] uppercase">
                    {currentDoc.title}
                  </h1>
                  <div className="font-mono text-sm sm:text-base font-bold text-[#44403c] tracking-widest uppercase">
                    CASE FILE {currentDoc.caseNumber}
                  </div>
                </div>

                {/* Metadata Matrix Table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-[#44403c] bg-[#e4dcbf]/40 p-3 mb-6 text-[10px]">
                  <div>
                    <span className="block font-bold text-[#57534e] uppercase">CASE FILE</span>
                    <span className="font-semibold text-[#1c1917]">{currentDoc.caseNumber}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-[#57534e] uppercase">DATE OF INCIDENT</span>
                    <span className="font-semibold text-[#1c1917]">{currentDoc.dateOfIncident}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-[#57534e] uppercase">LOCATION</span>
                    <span className="font-semibold text-[#1c1917]">{currentDoc.location}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-[#57534e] uppercase">REPORTED BY</span>
                    <span className="font-semibold text-[#1c1917]">{currentDoc.reportedBy}</span>
                  </div>
                </div>

                {/* Body Sections */}
                <div className="space-y-6 text-xs text-[#292524] leading-relaxed">
                  {/* 1. Incident Summary */}
                  <section className="space-y-2">
                    <h2 className="font-bold text-xs uppercase tracking-wider text-[#1c1917] border-b border-[#a8a29e] pb-1">
                      INCIDENT SUMMARY
                    </h2>
                    <div className="whitespace-pre-line text-[#1c1917] font-mono text-[12px] leading-relaxed">
                      {currentDoc.summary}
                    </div>
                  </section>

                  {/* 2. Victim Profile(s) */}
                  <section className="space-y-2">
                    <h2 className="font-bold text-xs uppercase tracking-wider text-[#1c1917] border-b border-[#a8a29e] pb-1">
                      VICTIM PROFILE
                    </h2>
                    <div className="space-y-1.5 text-[#1c1917] font-mono text-[12px]">
                      {currentDoc.victimProfiles.map((profile, i) => (
                        <p key={i} className="m-0 leading-relaxed">
                          {profile}
                        </p>
                      ))}
                    </div>
                  </section>

                  {/* 3. Ballistic & Physical Evidence */}
                  <section className="space-y-2">
                    <h2 className="font-bold text-xs uppercase tracking-wider text-[#1c1917] border-b border-[#a8a29e] pb-1">
                      BALLISTIC &amp; PHYSICAL EVIDENCE
                    </h2>
                    <div className="space-y-1 text-[#1c1917] font-mono text-[12px]">
                      {currentDoc.ballisticsAndPhysicalEvidence.map((ev, i) => (
                        <p key={i} className="m-0 leading-relaxed">
                          {ev}
                        </p>
                      ))}
                    </div>
                  </section>

                  {/* 4. Case Status */}
                  <section className="space-y-2">
                    <h2 className="font-bold text-xs uppercase tracking-wider text-[#1c1917] border-b border-[#a8a29e] pb-1">
                      CASE STATUS
                    </h2>
                    <div className="text-[#1c1917] font-mono text-[12px] leading-relaxed">
                      {currentDoc.caseStatus}
                    </div>
                  </section>
                </div>

                {/* Sign-off Block */}
                <div className="mt-8 pt-4 border-t-2 border-[#1c1917] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="text-[11px] text-[#57534e]">Signature:</div>
                    <div
                      className={`font-serif text-lg text-[#1c1917] font-bold ${
                        currentDoc.investigatorSignature.isHandwritten ? 'italic underline' : ''
                      }`}
                    >
                      {currentDoc.investigatorSignature.signatureText}
                    </div>
                    <div className="text-[11px] font-bold text-[#1c1917] uppercase tracking-wide">
                      {currentDoc.investigatorSignature.leadTitle}
                    </div>
                    {currentDoc.investigatorSignature.signedDate && (
                      <div className="text-[10px] text-[#44403c]">
                        {currentDoc.investigatorSignature.signedDate}
                      </div>
                    )}
                  </div>

                  <div className="text-right space-y-1 self-end">
                    <div className="font-mono font-black text-xs text-red-900 border border-red-800 px-2 py-0.5 uppercase tracking-widest inline-block">
                      CASE FILE - ACTIVE
                    </div>
                    <div className="text-[10px] text-[#57534e] tracking-widest uppercase">
                      {currentDoc.footerNotice}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 2. VIEW MODE: ARCHIVAL SCAN FACSIMILE (HIGH-RES PHOTO INSPECTOR) */
              <div className="space-y-4">
                <div className="p-3 bg-[#131b15] border border-[#243328] flex items-center justify-between text-xs text-[#a6d8b2]">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={15} className="text-[#8deb9e]" />
                    <span>
                      ORIGINAL POLICE ARCHIVE PHOTOGRAPH // CAS-TLS-0017 / {currentDoc.caseNumber}
                    </span>
                  </div>
                  <a
                    href={currentDoc.imagePath}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-[#8deb9e] hover:underline"
                  >
                    <span>Open Raw Asset</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="bg-black border border-[#2b3a30] p-4 flex items-center justify-center overflow-auto max-h-[70vh] shadow-inner">
                  <img
                    src={currentDoc.imagePath}
                    alt={`${currentDoc.title} original scan`}
                    style={{ transform: `scale(${scanZoom})`, transformOrigin: 'top center' }}
                    className="transition-transform duration-150 max-w-full h-auto object-contain shadow-2xl rounded-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Directive Return & Progression Action */}
          <div className="mt-8 pt-4 border-t border-[#233327] flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl w-full mx-auto">
            <div className="text-[11px] text-muted-foreground">
              Reviewing classified record <strong>0{currentDoc.documentNumber} of 05</strong>. Ready to
              solve Stage 01?
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleNextDoc}
                className="button button-secondary text-xs w-full sm:w-auto font-mono py-2.5 px-4"
              >
                Next Case Dossier →
              </button>
              <button
                onClick={() => {
                  tacticalAudio.playSuccess();
                  onReturnToDirective();
                }}
                className="button bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 text-xs font-mono font-bold tracking-wider py-2.5 px-5 w-full sm:w-auto shadow-md flex items-center justify-center gap-2"
              >
                <span>RETURN TO FIRST DIRECTIVE</span>
                <CheckCircle size={14} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
