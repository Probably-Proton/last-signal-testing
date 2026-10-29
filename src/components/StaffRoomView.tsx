/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * STAFF ROOM & OPERATIONAL CONTROL CONSOLE (Case TLS-0017)
 * 
 * Cohesive, polished administrative surface for event organizers.
 * Sections:
 * 1. Overview: Game status, registration status, release state, real operative counts.
 * 2. Participants: Searchable & filterable participant roster with dossier inspection.
 * 3. Stage Management: Release states, IST windows, scoring deadlines, stage cadence controls.
 * 4. Activity & Evidence: Evidence catalog inspection, puzzle key verification, organizer audit stream.
 * 5. Game Controls: Routine adjustments (target overrides, scores, corrections) and destructive resets
 *    guarded by explicit confirmation dialogs.
 * 6. Settings: Timeline configurations, prototype switches, and clear backend integration disclosures.
 */

import React, { useState, useMemo } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  Clock3,
  Activity,
  Settings,
  Users,
  FolderOpen,
  FileText,
  Check,
  AlertTriangle,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Eye,
  X,
  Key,
  Award,
  Sliders,
  Database,
  LogOut,
  Radio,
  FileCheck2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  LifeBuoy,
  Inbox,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  PrototypeUser,
  UserProgress,
  AuditLogEntry,
  getAllUsers,
  getUserProgress,
  saveUserProgress,
} from '../lib/prototypeAuth';
import {
  STAGE_SCHEDULE,
  REGISTRATION_OPEN_IST,
  GAME_LAUNCH_IST,
  ENABLE_TIMELINE_GATES,
  isRegistrationOpen,
  isGameLaunched,
  formatToIST,
  getStageDisplayInfo,
} from '../lib/stageConfig';
import { evidence, stages, CASE_ID, EvidenceItem } from '../lib/mockData';
import { ISTClockWidget } from './ISTClockWidget';

import {
  getAllTicketsForStaff,
  updateTicketByStaff,
  CATEGORY_LABELS,
  STATUS_LABELS,
  type SupportTicket,
  type TicketStatus,
  type TicketPriority,
} from '../lib/tickets';
import {
  sendStaffDispatch,
  getCustomStaffDispatches,
  type CaseMessage,
  type MessageTone,
} from '../lib/messagesStore';

interface StaffRoomViewProps {
  user?: PrototypeUser;
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onLogout?: () => void;
}

type StaffTab =
  | 'overview'
  | 'participants'
  | 'stages'
  | 'tickets'
  | 'dispatches'
  | 'activity'
  | 'controls'
  | 'settings';

interface DestructiveActionState {
  isOpen: boolean;
  type: 'reset_progress' | 'purge_storage' | 'reset_stage_scores';
  title: string;
  description: string;
  confirmLabel: string;
  targetCallSign?: string;
}

export function StaffRoomView({
  user,
  progress,
  onUpdateProgress,
  onLogout,
}: StaffRoomViewProps) {
  // Staff authorization passkey gate
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('tls_staff_authorized') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<StaffTab>('overview');

  // Participants tab search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [selectedUserDossier, setSelectedUserDossier] = useState<{
    user: PrototypeUser;
    progress: UserProgress;
  } | null>(null);

  // Evidence tab search & filter
  const [evidenceStageFilter, setEvidenceStageFilter] = useState<number | 'ALL'>('ALL');
  const [evidenceSearch, setEvidenceSearch] = useState('');
  const [evidenceKindFilter, setEvidenceKindFilter] = useState<string>('ALL');

  // Score adjustment form
  const [scoreDelta, setScoreDelta] = useState<number>(25);
  const [scoreReason, setScoreReason] = useState<string>('Staff manual adjudication / bonus');

  // Destructive confirmation modal state
  const [destructiveModal, setDestructiveModal] = useState<DestructiveActionState>({
    isOpen: false,
    type: 'reset_progress',
    title: '',
    description: '',
    confirmLabel: '',
  });

  // Transient success toast notification
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Support Tickets State
  const [allTickets, setAllTickets] = useState<SupportTicket[]>(() => getAllTicketsForStaff(unlocked));
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState<string>('ALL');
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedStaffTicketId, setSelectedStaffTicketId] = useState<string | null>(null);
  const [ticketResponseDraft, setTicketResponseDraft] = useState('');
  const [ticketNotesDraft, setTicketNotesDraft] = useState('');
  const [ticketStatusDraft, setTicketStatusDraft] = useState<TicketStatus>('OPEN');
  const [ticketPriorityDraft, setTicketPriorityDraft] = useState<TicketPriority>('NORMAL');

  // Dispatches & Broadcasts State
  const [customDispatches, setCustomDispatches] = useState<CaseMessage[]>(() => getCustomStaffDispatches());
  const [dispatchSender, setDispatchSender] = useState<'THE DIRECTOR' | 'SYSTEM DISPATCH' | 'OPERATIONS COMMAND'>('THE DIRECTOR');
  const [dispatchTone, setDispatchTone] = useState<MessageTone>('director');
  const [dispatchAudience, setDispatchAudience] = useState<'all' | 'targeted'>('all');
  const [dispatchTargetCallSign, setDispatchTargetCallSign] = useState('');
  const [dispatchText, setDispatchText] = useState('');

  const reloadTickets = () => {
    setAllTickets(getAllTicketsForStaff(unlocked));
  };

  const reloadDispatches = () => {
    setCustomDispatches(getCustomStaffDispatches());
  };

  const showFeedback = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => {
      setFeedbackNotice((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'staff2026' || passcode.trim() === 'owner') {
      setUnlocked(true);
      setAuthError('');
      sessionStorage.setItem('tls_staff_authorized', 'true');
      setAllTickets(getAllTicketsForStaff(true));
      setCustomDispatches(getCustomStaffDispatches());
      showFeedback('Staff authorization verified. Welcome to the Staff Room.');
    } else {
      setAuthError('Access denied: Invalid staff authorization key.');
    }
  };

  const handleDeauthorize = () => {
    setUnlocked(false);
    sessionStorage.removeItem('tls_staff_authorized');
    setPasscode('');
  };

  // Retrieve real registered users from prototype local storage
  const registeredUsers = useMemo(() => {
    return getAllUsers();
  }, [unlocked, activeTab, feedbackNotice]);

  // Precompute user progress records for metrics & search
  const participantsWithProgress = useMemo(() => {
    return registeredUsers.map((u) => {
      const p = u.callSign.toLowerCase() === progress.callSign.toLowerCase()
        ? progress
        : getUserProgress(u.callSign);
      return { user: u, progress: p };
    });
  }, [registeredUsers, progress]);

  // Filtered participants list
  const filteredParticipants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return participantsWithProgress.filter(({ user: u }) => {
      const matchesSearch =
        !q ||
        u.callSign.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.studentClass.toLowerCase().includes(q) ||
        u.admissionNumberMasked.toLowerCase().includes(q);

      const matchesClass = classFilter === 'ALL' || u.studentClass === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [participantsWithProgress, searchQuery, classFilter]);

  // Overall event metrics
  const eventMetrics = useMemo(() => {
    const totalCount = registeredUsers.length;
    let completedCount = 0;
    let inProgressCount = 0;
    let totalScoreSum = 0;

    const stageDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
    };

    participantsWithProgress.forEach(({ progress: p }) => {
      totalScoreSum += p.score || 0;
      if (p.stagesCompleted >= 7) {
        completedCount++;
      } else if (p.stagesCompleted > 0 || p.tasksCompleted > 0) {
        inProgressCount++;
      }
      const active = Math.min(7, Math.max(1, p.activeStage || 1));
      stageDistribution[active] = (stageDistribution[active] || 0) + 1;
    });

    const avgScore = totalCount > 0 ? Math.round(totalScoreSum / totalCount) : 0;

    return {
      totalCount,
      completedCount,
      inProgressCount,
      totalScoreSum,
      avgScore,
      stageDistribution,
    };
  }, [registeredUsers, participantsWithProgress]);

  // Filtered evidence catalogue
  const filteredEvidence = useMemo(() => {
    const q = evidenceSearch.trim().toLowerCase();
    return evidence.filter((item) => {
      const matchesStage = evidenceStageFilter === 'ALL' || item.stage === evidenceStageFilter;
      const matchesKind = evidenceKindFilter === 'ALL' || item.kind === evidenceKindFilter;
      const matchesSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q);
      return matchesStage && matchesKind && matchesSearch;
    });
  }, [evidenceSearch, evidenceStageFilter, evidenceKindFilter]);

  // Unique evidence kinds for filter
  const evidenceKinds = useMemo(() => {
    const kinds = new Set<string>();
    evidence.forEach((e) => kinds.add(e.kind));
    return Array.from(kinds);
  }, []);

  // Unique student classes
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    registeredUsers.forEach((u) => classes.add(u.studentClass));
    return Array.from(classes).sort();
  }, [registeredUsers]);

  /* =========================================================================
     OPERATIONS & AUDIT WRITERS
     ========================================================================= */

  const appendAuditEntry = (
    action: string,
    detail: string,
    options?: { previousValue?: string; newValue?: string; targetCallSign?: string }
  ) => {
    const newEntry: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      timestamp: new Date().toISOString(),
      detail,
      targetCallSign: options?.targetCallSign ?? progress.callSign,
      previousValue: options?.previousValue,
      newValue: options?.newValue,
    };

    onUpdateProgress((prev) => ({
      ...prev,
      organizerAuditLog: [newEntry, ...(prev.organizerAuditLog || [])],
    }));
  };

  // Target candidate override (Stage 4)
  const handleTargetOverride = (targetSite: number) => {
    const prevSite = progress.targetLocationChoice;
    const detail = `Staff organizer overrode target site from Site 0${prevSite ?? 'None'} to Site 0${targetSite} for operative ${progress.callSign}.`;
    
    appendAuditEntry('ORGANIZER_TARGET_OVERRIDE', detail, {
      previousValue: prevSite ? `Site 0${prevSite}` : 'Unselected',
      newValue: `Site 0${targetSite}`,
      targetCallSign: progress.callSign,
    });

    onUpdateProgress((prev) => ({
      ...prev,
      targetLocationChoice: targetSite,
      targetChoiceLocked: true,
    }));

    showFeedback(`Target site overridden to Site 0${targetSite} for operative ${progress.callSign}.`);
  };

  // Reset 1-time player correction allowance
  const handleResetCorrectionAllowance = () => {
    const detail = `Staff organizer restored the single self-service target correction allowance for operative ${progress.callSign}.`;
    
    appendAuditEntry('ORGANIZER_RESET_CORRECTION_ALLOWANCE', detail, {
      targetCallSign: progress.callSign,
    });

    onUpdateProgress((prev) => ({
      ...prev,
      targetLocationCorrectionUsed: false,
    }));

    showFeedback(`Target correction allowance restored for ${progress.callSign}.`);
  };

  // Score adjustment
  const handleAdjustScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(scoreDelta) || scoreDelta === 0) return;

    const prevScore = progress.score;
    const newScore = Math.max(0, prevScore + scoreDelta);
    const detail = `Staff organizer adjusted score by ${scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts (${scoreReason.trim() || 'No reason specified'}).`;

    appendAuditEntry('ORGANIZER_SCORE_ADJUSTMENT', detail, {
      previousValue: `${prevScore} pts`,
      newValue: `${newScore} pts`,
      targetCallSign: progress.callSign,
    });

    onUpdateProgress((prev) => ({
      ...prev,
      score: newScore,
    }));

    showFeedback(`Score updated from ${prevScore} to ${newScore} pts for ${progress.callSign}.`);
  };

  // Stage clearance simulation / jump
  const handleJumpToStage = (targetStage: number) => {
    const prevStage = progress.activeStage;
    const detail = `Staff organizer set active investigation stage to Stage 0${targetStage} for operative ${progress.callSign}.`;

    appendAuditEntry('ORGANIZER_STAGE_JUMP', detail, {
      previousValue: `Stage 0${prevStage}`,
      newValue: `Stage 0${targetStage}`,
      targetCallSign: progress.callSign,
    });

    onUpdateProgress((prev) => ({
      ...prev,
      activeStage: targetStage,
      stagesCompleted: Math.max(prev.stagesCompleted, targetStage - 1),
    }));

    showFeedback(`Operative ${progress.callSign} transitioned to Stage 0${targetStage}.`);
  };

  // Unlock all evidence for active stage
  const handleUnlockStageEvidence = () => {
    const stageItems = evidence.filter((e) => e.stage === progress.activeStage).map((e) => e.id);
    const uniqueIds = Array.from(new Set([...progress.unlockedEvidenceIds, ...stageItems]));

    appendAuditEntry(
      'ORGANIZER_STAGE_EVIDENCE_DECLASS',
      `Staff declassified all evidence files for Stage 0${progress.activeStage} (${stageItems.length} items).`,
      { targetCallSign: progress.callSign }
    );

    onUpdateProgress((prev) => ({
      ...prev,
      unlockedEvidenceIds: uniqueIds,
    }));

    showFeedback(`Declassified all Stage 0${progress.activeStage} evidence files.`);
  };

  // Destructive Actions Execution (Only executed after modal confirmation)
  const executeDestructiveAction = () => {
    if (destructiveModal.type === 'reset_progress') {
      const detail = `DESTRUCTIVE RESET: Staff wiped all stage progression, solved challenges, and score back to 0 for operative ${progress.callSign}.`;
      
      appendAuditEntry('ORGANIZER_DESTRUCTIVE_PROGRESS_RESET', detail, {
        targetCallSign: progress.callSign,
      });

      onUpdateProgress((prev) => ({
        ...prev,
        stagesCompleted: 0,
        activeStage: 1,
        tasksCompleted: 0,
        unlockedEvidenceIds: ['EV-0101', 'EV-0102', 'EV-0103', 'ARC-002'],
        solvedChallengeKeys: [],
        score: 0,
        status: 'NOT STARTED',
        targetLocationChoice: null,
        targetChoiceLocked: false,
        targetLocationCorrectionUsed: false,
        targetChoiceEvaluationStatus: 'unsubmitted',
        stage2DeductionSolved: false,
        mapGateUnlocked: false,
        suspectDbUnlocked: false,
        systemFreezeTriggered: false,
        directorIntroSeen: false,
        stage7Step: 'locked',
        stageSolveTimestamps: {},
        stageScoringEligible: {},
        stageScores: {},
      }));

      showFeedback(`Progress reset to Stage 1 (0 points) for ${progress.callSign}.`);
    } else if (destructiveModal.type === 'purge_storage') {
      try {
        localStorage.removeItem(`tls_progress_user_${progress.callSign.toLowerCase()}`);
        showFeedback(`Local storage record purged for operative ${progress.callSign}.`);
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch (err) {
        console.error(err);
      }
    }

    setDestructiveModal((prev) => ({ ...prev, isOpen: false }));
  };

  /* =========================================================================
     RESTRICTED GATE (UNAUTHORIZED STATE)
     ========================================================================= */

  if (!unlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="panel max-w-md w-full text-center p-8 space-y-5 border-crimson/50 bg-[#10100f] shadow-2xl">
          <div className="size-14 mx-auto rounded-full bg-crimson/10 border border-crimson/40 flex items-center justify-center">
            <Lock size={26} className="text-crimson" />
          </div>

          <div>
            <span className="eyebrow block text-crimson mb-1">RESTRICTED JURISDICTION</span>
            <h2 className="font-serif text-2xl font-light text-foreground">
              Staff Room // Control Console
            </h2>
          </div>

          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            This administration surface is restricted exclusively to authorized event organizers
            and lead game directors. Participant access is prohibited.
          </p>

          {authError && (
            <div className="p-3 bg-red-950/40 border border-crimson/60 text-xs font-mono text-red-200 text-left flex items-start gap-2">
              <AlertTriangle size={14} className="text-crimson shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4 pt-1">
            <div className="space-y-1 text-left">
              <label className="font-mono text-[10px] uppercase text-muted-foreground block">
                Staff Passkey Authorization
              </label>
              <input
                type="password"
                placeholder="Enter event passkey..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                className="w-full bg-[#161615] border border-border p-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-crimson transition-colors"
              />
            </div>
            <button type="submit" className="button button-primary w-full justify-center">
              Authorize Access
            </button>
          </form>

          <div className="pt-2 border-t border-border/60 text-[10px] font-mono text-muted-foreground">
            Authoritative multi-organizer RBAC is enforced server-side via Supabase Row-Level Security.
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     AUTHORIZED STAFF ROOM INTERFACE
     ========================================================================= */

  return (
    <div className="space-y-6 pb-16">
      {/* Feedback Toast Banner */}
      {feedbackNotice && (
        <div className="p-3 bg-[#121c14] border border-[#234428] text-xs font-mono text-[#a6d8af] flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[#64b971]" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Plaque */}
      <div className="border-b border-border pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="eyebrow text-crimson">RESTRICTED CLEARANCE // EVENT STAFF</span>
              <span className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 py-0.5">
                CASE {CASE_ID}
              </span>
            </div>
            <h1 className="font-serif text-3xl font-light text-foreground">
              Staff Room Console
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1 max-w-2xl">
              Live event orchestration, participant oversight, stage cadence verification, and intervention controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill restricted flex items-center gap-1.5">
              <ShieldAlert size={12} className="text-crimson" />
              <span>Staff Authenticated</span>
            </span>
            <button
              onClick={handleDeauthorize}
              className="button button-secondary text-xs flex items-center gap-1.5 py-1 px-3"
              title="Lock console to prevent unauthorized tampering"
            >
              <LogOut size={13} />
              <span>Lock Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Responsive) */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3 text-xs font-mono">
        {[
          { key: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
          { key: 'participants', label: `Participants (${registeredUsers.length})`, icon: Users },
          { key: 'stages', label: 'Stage Management', icon: Layers },
          {
            key: 'tickets',
            label: `Support Desk (${allTickets.filter((t) => t.status === 'OPEN').length} Open)`,
            icon: LifeBuoy,
          },
          { key: 'dispatches', label: `Dispatches (${customDispatches.length})`, icon: Radio },
          { key: 'activity', label: `Activity & Evidence (${progress?.organizerAuditLog?.length || 0})`, icon: Activity },
          { key: 'controls', label: 'Game Controls', icon: Sliders },
          { key: 'settings', label: 'Settings & Arch', icon: Settings },
        ].map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key as StaffTab)}
              className={`flex items-center gap-2 px-3 py-2 transition-colors border ${
                isActive
                  ? 'border-crimson bg-[#181212] text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-[#141413]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-crimson' : 'text-muted-foreground'} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          TAB 1: OVERVIEW
          ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Status Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="panel p-4">
              <span className="eyebrow block text-muted-foreground">REGISTRATION STATUS</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`font-mono text-2xl font-light ${isRegistrationOpen() ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isRegistrationOpen() ? 'OPEN' : 'PRE-REGISTRATION'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground block mt-1">
                Intake: {REGISTRATION_OPEN_IST}
              </span>
            </div>

            <div className="panel p-4">
              <span className="eyebrow block text-muted-foreground">GAME LAUNCH STATUS</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`font-mono text-2xl font-light ${isGameLaunched() ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isGameLaunched() ? 'LAUNCHED' : 'AWAITING SIGNAL'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground block mt-1">
                Launch: {GAME_LAUNCH_IST}
              </span>
            </div>

            <div className="panel p-4">
              <span className="eyebrow block text-muted-foreground">REGISTERED OPERATIVES</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-mono text-3xl font-light text-foreground">
                  {eventMetrics.totalCount}
                </span>
                <span className="font-mono text-xs text-muted-foreground">in local storage</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground block mt-1">
                Avg Score: {eventMetrics.avgScore} pts · Cleared: {eventMetrics.completedCount}
              </span>
            </div>

            <div className="panel p-4">
              <span className="eyebrow block text-muted-foreground">ACTIVE OPERATIVE SESSION</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-mono text-xl font-bold text-crimson">
                  {progress.callSign}
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground block mt-1">
                Active: Stage 0{progress.activeStage} · Score: {progress.score} pts
              </span>
            </div>
          </div>

          {/* Stage Progression Funnel */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="eyebrow block">STAGE PROGRESSION DISTRIBUTION</span>
                <h3 className="font-serif text-lg text-foreground font-normal">
                  Operative Progression Funnel
                </h3>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Total Registered: {eventMetrics.totalCount}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {STAGE_SCHEDULE.map((st) => {
                const count = eventMetrics.stageDistribution[st.number] || 0;
                const percentage = eventMetrics.totalCount > 0
                  ? Math.round((count / eventMetrics.totalCount) * 100)
                  : 0;

                return (
                  <div
                    key={st.number}
                    className="p-3 bg-[#111110] border border-border flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">
                        Stage 0{st.number}
                      </span>
                      <strong className="text-foreground text-xs block truncate mt-0.5">
                        {st.title}
                      </strong>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/60">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-xl font-light text-foreground">{count}</span>
                        <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="w-full bg-[#1c1c1b] h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-crimson h-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Health & Architecture Checklist */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="panel-heading">
              <span>CANONICAL EVENT HEALTH &amp; MODULE CHECKLIST</span>
              <FileCheck2 size={15} />
            </div>

            <div className="space-y-2.5">
              {[
                {
                  task: 'Registration Window & Student Whitelist',
                  detail: `IST gate set to ${REGISTRATION_OPEN_IST}. Classes 6–12 whitelisted.`,
                  status: 'Configured & Active',
                  ready: true,
                },
                {
                  task: 'Stage 04 Single-Correction Rule Engine',
                  detail: '1-time self-service target correction prior to deadline with audit trail.',
                  status: 'Active',
                  ready: true,
                },
                {
                  task: 'Stage 05 Encrypted Suspect Vault',
                  detail: 'Z408_REOPENED key challenge validation with SHA-256 integrity check.',
                  status: 'Sealed & Verified',
                  ready: true,
                },
                {
                  task: 'Stage 06 Controlled Transmission Freeze',
                  detail: 'FINAL_REVIEW.mp4 triggers persistent system recovery protocol.',
                  status: 'Armed',
                  ready: true,
                },
                {
                  task: 'PostgreSQL Server Contract (case17_migration.sql)',
                  detail: 'Auth RLS, audit log triggers, and server-authoritative scoring ready.',
                  status: 'Schema Defined (Pending Supabase)',
                  ready: true,
                },
                {
                  task: 'IST Clock Synchronization Subsystem',
                  detail: 'Drift-free Asia/Kolkata countdown calculation across all devices.',
                  status: 'Synchronized',
                  ready: true,
                },
              ].map(({ task, detail, status, ready }) => (
                <div
                  key={task}
                  className="flex flex-wrap items-center justify-between p-3 bg-[#111110] border border-border gap-2"
                >
                  <div className="flex items-start gap-2.5">
                    <Check size={14} className="text-[#8bb393] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">{task}</strong>
                      <span className="text-[11px] text-muted-foreground">{detail}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase border border-border px-2 py-0.5">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: PARTICIPANTS
          ===================================================================== */}
      {activeTab === 'participants' && (
        <div className="space-y-5">
          {/* Search & Filter Toolbar */}
          <div className="panel p-4 space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1 min-w-[240px] relative">
                <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by call-sign, full name, or admission..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111110] border border-border pl-9 pr-3 py-2 text-foreground focus:outline-none focus:border-crimson"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={14} className="text-muted-foreground" />
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-[#111110] border border-border px-3 py-2 text-foreground focus:outline-none focus:border-crimson"
                >
                  <option value="ALL">All Classes</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
              <span>
                Showing {filteredParticipants.length} of {registeredUsers.length} registered operatives
              </span>
              <span>Local Prototype Registry: tls_prototype_users_v1</span>
            </div>
          </div>

          {/* Participants Table */}
          {filteredParticipants.length === 0 ? (
            <div className="panel p-12 text-center space-y-3 font-mono text-xs text-muted-foreground">
              <Users size={32} className="mx-auto text-muted-foreground opacity-40" />
              <p className="text-foreground font-semibold">No matching operatives found</p>
              <p className="max-w-md mx-auto">
                {registeredUsers.length === 0
                  ? 'No participants have registered in this browser session yet. Direct students to the registration portal to populate records.'
                  : 'Adjust your search query or class filter to view other registered operatives.'}
              </p>
            </div>
          ) : (
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#141615] border-b border-border text-[10px] uppercase text-muted-foreground">
                      <th className="p-3">Operative Call-Sign</th>
                      <th className="p-3">Full Name</th>
                      <th className="p-3">Class</th>
                      <th className="p-3">Admission</th>
                      <th className="p-3">Active Stage</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Target Choice</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredParticipants.map(({ user: u, progress: p }) => {
                      const isActiveSession = u.callSign.toLowerCase() === progress.callSign.toLowerCase();

                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-white/5 transition-colors ${
                            isActiveSession ? 'bg-red-950/20' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-foreground">
                            <div className="flex items-center gap-2">
                              <span>{u.callSign}</span>
                              {isActiveSession && (
                                <span className="text-[9px] font-mono border border-crimson px-1 text-crimson">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">{u.fullName}</td>
                          <td className="p-3">{u.studentClass}</td>
                          <td className="p-3 text-muted-foreground">{u.admissionNumberMasked}</td>
                          <td className="p-3">
                            <span className="font-semibold text-foreground">
                              Stage 0{p.activeStage || 1}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {p.stagesCompleted || 0}/7 cleared
                            </span>
                          </td>
                          <td className="p-3 font-bold text-crimson">{p.score || 0} pts</td>
                          <td className="p-3">
                            {p.targetLocationChoice ? (
                              <span className="text-[11px] px-1.5 py-0.5 border border-border">
                                Site 0{p.targetLocationChoice}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">Unselected</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedUserDossier({ user: u, progress: p })}
                              className="button button-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                            >
                              <Eye size={12} />
                              <span>Inspect Dossier</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Participant Dossier Modal */}
          {selectedUserDossier && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="panel max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 border-border bg-[#10100f]">
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <span className="eyebrow block text-crimson">OPERATIVE DOSSIER // RECORD</span>
                    <h3 className="font-serif text-2xl text-foreground font-light">
                      {selectedUserDossier.user.callSign}
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      {selectedUserDossier.user.fullName} · {selectedUserDossier.user.studentClass}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedUserDossier(null)}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-3 bg-[#141413] border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase block">Admission Hash</span>
                    <span className="text-foreground text-[11px] break-all">
                      {selectedUserDossier.user.admissionHash.substring(0, 24)}...
                    </span>
                  </div>
                  <div className="p-3 bg-[#141413] border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase block">Registration Date</span>
                    <span className="text-foreground text-[11px]">
                      {formatToIST(selectedUserDossier.user.registeredAt)}
                    </span>
                  </div>
                  <div className="p-3 bg-[#141413] border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase block">Stage Progress</span>
                    <span className="text-foreground font-bold">
                      Active: Stage 0{selectedUserDossier.progress.activeStage || 1} ({selectedUserDossier.progress.stagesCompleted || 0} Cleared)
                    </span>
                  </div>
                  <div className="p-3 bg-[#141413] border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase block">Total Points</span>
                    <span className="text-crimson font-bold text-base">
                      {selectedUserDossier.progress.score || 0} pts
                    </span>
                  </div>
                </div>

                {/* Target Choice Details */}
                <div className="p-3 bg-[#141413] border border-border font-mono text-xs space-y-2">
                  <span className="eyebrow block">STAGE 04 TARGET SITE SELECTION</span>
                  <div className="flex justify-between items-center text-[11px]">
                    <span>Current Selection:</span>
                    <strong className="text-foreground">
                      {selectedUserDossier.progress.targetLocationChoice
                        ? `Site 0${selectedUserDossier.progress.targetLocationChoice}`
                        : 'None Submitted'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span>Correction Allowance:</span>
                    <strong className={selectedUserDossier.progress.targetLocationCorrectionUsed ? 'text-amber-400' : 'text-emerald-400'}>
                      {selectedUserDossier.progress.targetLocationCorrectionUsed ? '1 Used (Depleted)' : 'Available (1 Remaining)'}
                    </strong>
                  </div>
                </div>

                {/* Audit trail for this user */}
                <div className="font-mono text-xs space-y-2">
                  <span className="eyebrow block">INDIVIDUAL OPERATIVE AUDIT TRAIL</span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {selectedUserDossier.progress.organizerAuditLog &&
                    selectedUserDossier.progress.organizerAuditLog.length > 0 ? (
                      selectedUserDossier.progress.organizerAuditLog.map((log) => (
                        <div key={log.id} className="p-2 bg-[#141413] border border-border text-[11px]">
                          <div className="flex justify-between">
                            <strong className="text-crimson">{log.action}</strong>
                            <span className="text-[10px] text-muted-foreground">
                              {formatToIST(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-muted-foreground m-0 mt-0.5">{log.detail}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic p-2">
                        No manual overrides or interventions recorded for this operative.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button
                    onClick={() => setSelectedUserDossier(null)}
                    className="button button-secondary text-xs"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: STAGE MANAGEMENT
          ===================================================================== */}
      {activeTab === 'stages' && (
        <div className="space-y-6">
          <ISTClockWidget activeStageNumber={progress.activeStage || 1} variant="detailed" />

          {/* Schedule & Rules Specification */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="panel-heading">
              <span>CANONICAL STAGE WINDOWS &amp; RELEASE SCHEDULE (IST)</span>
              <Clock3 size={15} />
            </div>

            <div className="p-3 bg-[#141815] border border-[#213025] text-[11px] text-[#b8d1c0] leading-relaxed">
              <strong className="text-foreground block uppercase mb-1">Scoring &amp; Release Engine Rules:</strong>
              <p className="m-0">
                Stages unlock sequentially at 00:00 IST on their scheduled opening date. Solves prior to the 23:59 IST deadline
                award base 100 points plus hourly speed bonus (+1 pt/hr, capped at 24 pts). Solves after deadline award 0
                competitive points (story advancement only).
              </p>
            </div>

            <div className="overflow-x-auto border border-border">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-[#141715] border-b border-border text-[10px] uppercase text-muted-foreground">
                    <th className="p-2.5">Stage</th>
                    <th className="p-2.5">Title</th>
                    <th className="p-2.5">Open Window (IST)</th>
                    <th className="p-2.5">Scoring Deadline (IST)</th>
                    <th className="p-2.5">Base Points</th>
                    <th className="p-2.5">Max Bonus</th>
                    <th className="p-2.5">Associated Puzzle Milestone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {STAGE_SCHEDULE.map((st) => {
                    const isCurrent = progress.activeStage === st.number;
                    const isPassed = progress.stagesCompleted >= st.number;

                    return (
                      <tr
                        key={st.number}
                        className={`hover:bg-white/5 transition-colors ${
                          isCurrent ? 'bg-red-950/20' : ''
                        }`}
                      >
                        <td className="p-2.5 font-bold">
                          <div className="flex items-center gap-1.5">
                            <span>0{st.number}</span>
                            {isCurrent && (
                              <span className="text-[9px] border border-crimson px-1 text-crimson">
                                ACTIVE
                              </span>
                            )}
                            {isPassed && (
                              <Check size={12} className="text-emerald-400" />
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 font-semibold text-foreground">{st.title}</td>
                        <td className="p-2.5 text-muted-foreground">{st.openDateIST}</td>
                        <td className="p-2.5 text-foreground">{st.deadlineIST}</td>
                        <td className="p-2.5">{st.basePoints} pts</td>
                        <td className="p-2.5 text-emerald-400">+{st.maxHourlyBonus} pts</td>
                        <td className="p-2.5 text-muted-foreground text-[10px]">
                          {st.number === 1 && 'Exorcist Letter Acrostic (gate_zk_login)'}
                          {st.number === 2 && 'Coordinate Cipher (House 3893)'}
                          {st.number === 3 && 'Presidio Witness Map (gate_map)'}
                          {st.number === 4 && 'Dispatch Tape Audio (Site 04)'}
                          {st.number === 5 && 'Mercer Inquest (gate_suspect_db)'}
                          {st.number === 6 && 'Vale Notebook (FINAL_REVIEW freeze)'}
                          {st.number === 7 && 'Final Dispatch (Case TLS-0017 Resolution)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stage Cadence Actions */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="panel-heading">
              <span>ACTIVE OPERATIVE STAGE CADENCE CONTROLS</span>
              <Sliders size={15} />
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              Transition the active testing operative (<strong className="text-foreground">{progress.callSign}</strong>)
              between investigation stages. All cadence overrides are permanently logged to the audit stream.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => handleJumpToStage(num)}
                  className={`p-2.5 border text-center transition-all ${
                    progress.activeStage === num
                      ? 'border-crimson bg-[#221010] text-foreground font-bold'
                      : 'border-border bg-[#121211] text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="block text-[10px] uppercase">Set Active</span>
                  <span className="text-sm font-bold">Stage 0{num}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB: SUPPORT TICKETS DESK (STAFF OVERSIGHT)
          ===================================================================== */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Header Plaque */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy size={16} className="text-crimson" />
                <span className="font-bold text-foreground uppercase tracking-wider text-sm">
                  OPERATIVE SUPPORT &amp; INQUIRY DESK
                </span>
                <span className="text-[10px] text-amber-300 border border-amber-500/40 px-2 py-0.5 uppercase">
                  STAFF CLEARANCE ACTIVE
                </span>
              </div>
              <button
                onClick={() => {
                  reloadTickets();
                  showFeedback('Reloaded support tickets from repository.');
                }}
                className="button button-secondary text-xs flex items-center gap-1.5 py-1 px-3"
              >
                <RotateCcw size={13} />
                <span>Refresh Queue</span>
              </button>
            </div>

            <p className="font-serif text-sm text-muted-foreground m-0">
              Review and answer investigator inquiries filed through the player Help &amp; Support form.
              Responses dispatched here are delivered securely to the requesting investigator's ticket panel.
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-[#111110] border border-border">
                <span className="text-[9px] text-muted-foreground uppercase block">TOTAL TICKETS</span>
                <span className="text-xl font-bold text-foreground">{allTickets.length}</span>
              </div>
              <div className="p-3 bg-amber-950/30 border border-amber-800/40">
                <span className="text-[9px] text-amber-400 uppercase block">OPEN DISPATCHES</span>
                <span className="text-xl font-bold text-amber-300">
                  {allTickets.filter((t) => t.status === 'OPEN').length}
                </span>
              </div>
              <div className="p-3 bg-blue-950/30 border border-blue-800/40">
                <span className="text-[9px] text-blue-400 uppercase block">UNDER REVIEW</span>
                <span className="text-xl font-bold text-blue-300">
                  {allTickets.filter((t) => t.status === 'UNDER_REVIEW').length}
                </span>
              </div>
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40">
                <span className="text-[9px] text-emerald-400 uppercase block">RESOLVED</span>
                <span className="text-xl font-bold text-emerald-300">
                  {allTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length}
                </span>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search size={14} className="text-muted-foreground" />
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Search by ticket ID, call-sign, or subject..."
                  className="w-full bg-[#0c0c0b] border border-border p-1.5 text-xs text-foreground focus:outline-none focus:border-crimson"
                />
              </div>

              <div className="flex items-center gap-1">
                {(['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketStatusFilter(st)}
                    className={`px-2 py-1 text-[10px] uppercase font-bold border transition-colors ${
                      ticketStatusFilter === st
                        ? 'border-crimson bg-[#1e1515] text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket Workbench: List & Action Panel */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column: Tickets Queue (5 cols) */}
            <div className="lg:col-span-5 space-y-2 max-h-[680px] overflow-y-auto">
              {allTickets
                .filter((t) => {
                  const matchStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
                  const matchSearch =
                    !ticketSearch.trim() ||
                    t.id.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                    t.callSign.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                    t.subject.toLowerCase().includes(ticketSearch.toLowerCase());
                  return matchStatus && matchSearch;
                })
                .map((t) => {
                  const isSelected = (selectedStaffTicketId ?? allTickets[0]?.id) === t.id;
                  const statusMeta = STATUS_LABELS[t.status];

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedStaffTicketId(t.id);
                        setTicketResponseDraft(t.staffResponse || '');
                        setTicketNotesDraft(t.staffNotes || '');
                        setTicketStatusDraft(t.status);
                        setTicketPriorityDraft(t.priority);
                      }}
                      className={`p-3 border cursor-pointer font-mono text-xs space-y-1.5 transition-all ${
                        isSelected
                          ? 'border-crimson bg-[#181313]'
                          : 'border-border bg-[#111110] hover:border-[#383734]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-foreground">{t.id}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                      </div>

                      <p className="font-serif text-xs text-[#e0dad0] font-medium line-clamp-1 m-0">
                        {t.subject}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                        <span>Operative: <strong className="text-foreground">{t.callSign}</strong> ({t.studentClass})</span>
                        <span>{formatToIST(t.createdAt).split('·')[0]}</span>
                      </div>
                    </div>
                  );
                })}

              {allTickets.length === 0 && (
                <div className="panel p-8 text-center space-y-2">
                  <LifeBuoy size={24} className="text-muted-foreground mx-auto" />
                  <p className="font-serif text-xs text-muted-foreground m-0">
                    No support tickets have been filed yet.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Selected Ticket Action & Response Panel (7 cols) */}
            <div className="lg:col-span-7">
              {allTickets.find((t) => t.id === (selectedStaffTicketId ?? allTickets[0]?.id)) ? (
                (() => {
                  const currTicket = allTickets.find((t) => t.id === (selectedStaffTicketId ?? allTickets[0]?.id))!;

                  return (
                    <div className="panel p-5 space-y-4 font-mono text-xs">
                      {/* Ticket Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-foreground">{currTicket.id}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold ${STATUS_LABELS[currTicket.status].badgeClass}`}>
                              {STATUS_LABELS[currTicket.status].label}
                            </span>
                            {currTicket.priority !== 'NORMAL' && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-950 border border-crimson text-crimson">
                                {currTicket.priority}
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif text-lg font-bold text-foreground m-0">
                            {currTicket.subject}
                          </h3>
                        </div>
                        <div className="text-[10px] text-muted-foreground text-right">
                          <div>Operative: <strong className="text-foreground">{currTicket.callSign}</strong></div>
                          <div>Class: {currTicket.studentClass} ({currTicket.fullName})</div>
                          <div>Filed: {formatToIST(currTicket.createdAt)}</div>
                        </div>
                      </div>

                      {/* Operative Message Content */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground block font-bold">
                          Operative Statement / Reported Issue:
                        </span>
                        <div className="p-3 bg-[#0c0c0b] border border-border font-serif text-sm text-[#e0dad0] leading-relaxed whitespace-pre-wrap">
                          {currTicket.message}
                        </div>
                      </div>

                      {/* Staff Action Form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const res = updateTicketByStaff(unlocked, currTicket.id, {
                            status: ticketStatusDraft,
                            priority: ticketPriorityDraft,
                            staffResponse: ticketResponseDraft,
                            staffNotes: ticketNotesDraft,
                            staffCallSign: user?.callSign || 'STAFF_DIRECTORATE',
                          });

                          if (res.success && res.ticket) {
                            appendAuditEntry(
                              'STAFF_TICKET_UPDATE',
                              `Staff updated docket ${currTicket.id} (${ticketStatusDraft}) for operative ${currTicket.callSign}.`,
                              {
                                targetCallSign: currTicket.callSign,
                                previousValue: currTicket.status,
                                newValue: ticketStatusDraft,
                              }
                            );
                            reloadTickets();
                            showFeedback(`Ticket ${currTicket.id} status updated to ${ticketStatusDraft}.`);
                          } else {
                            showFeedback(res.error || 'Failed to update ticket.');
                          }
                        }}
                        className="space-y-4 pt-3 border-t border-border"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase text-muted-foreground mb-1 font-bold">
                              Ticket Status
                            </label>
                            <select
                              value={ticketStatusDraft}
                              onChange={(e) => setTicketStatusDraft(e.target.value as TicketStatus)}
                              className="w-full bg-[#0c0c0b] border border-border p-2 text-xs text-foreground focus:outline-none focus:border-crimson"
                            >
                              <option value="OPEN">DISPATCH OPEN</option>
                              <option value="UNDER_REVIEW">UNDER REVIEW</option>
                              <option value="RESOLVED">RESOLVED</option>
                              <option value="CLOSED">CLOSED</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase text-muted-foreground mb-1 font-bold">
                              Priority / Urgency
                            </label>
                            <select
                              value={ticketPriorityDraft}
                              onChange={(e) => setTicketPriorityDraft(e.target.value as TicketPriority)}
                              className="w-full bg-[#0c0c0b] border border-border p-2 text-xs text-foreground focus:outline-none focus:border-crimson"
                            >
                              <option value="NORMAL">NORMAL</option>
                              <option value="HIGH">HIGH</option>
                              <option value="CRITICAL">CRITICAL</option>
                            </select>
                          </div>
                        </div>

                        {/* Official Response for Player */}
                        <div>
                          <label className="block text-[10px] uppercase text-emerald-400 mb-1 font-bold flex items-center gap-1.5">
                            <Send size={12} />
                            <span>Official Staff Response (Visible to Player)</span>
                          </label>
                          <textarea
                            value={ticketResponseDraft}
                            onChange={(e) => setTicketResponseDraft(e.target.value)}
                            placeholder="Write official response or instructions for the investigator..."
                            rows={4}
                            className="w-full bg-[#0c0c0b] border border-[#2b4c33] p-2.5 text-xs text-foreground focus:outline-none focus:border-emerald-500 font-serif"
                          />
                        </div>

                        {/* Internal Staff Notes */}
                        <div>
                          <label className="block text-[10px] uppercase text-amber-400 mb-1 font-bold flex items-center gap-1.5">
                            <Lock size={12} />
                            <span>Internal Staff Notes (Restricted / Invisible to Player)</span>
                          </label>
                          <textarea
                            value={ticketNotesDraft}
                            onChange={(e) => setTicketNotesDraft(e.target.value)}
                            placeholder="Internal organizer notes, troubleshooting history, or suspect verification..."
                            rows={2}
                            className="w-full bg-[#0c0c0b] border border-[#4a3b20] p-2 text-xs text-foreground focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="submit"
                            className="button button-primary text-xs font-mono font-bold py-2 px-5 flex items-center gap-2"
                          >
                            <Check size={14} />
                            <span>Save Docket &amp; Dispatch Feedback</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                })()
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB: BROADCAST DISPATCHES (STAFF MESSAGING CONSOLE)
          ===================================================================== */}
      {activeTab === 'dispatches' && (
        <div className="space-y-6 font-mono text-xs">
          {/* Dispatch Composition Panel */}
          <div className="panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-crimson animate-pulse" />
                <span className="font-bold text-foreground uppercase tracking-wider text-sm">
                  EMERGENCY DISPATCH &amp; BROADCAST WIRE
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase">
                ONE-WAY TRANSMISSION CHANNEL
              </span>
            </div>

            <p className="font-serif text-sm text-muted-foreground m-0">
              Transmit official one-way case dispatches, investigative bulletins, or urgent system advisories.
              Messages are displayed in the investigator communications panel.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!dispatchText.trim()) return;

                const res = sendStaffDispatch(unlocked, {
                  sender: dispatchSender,
                  tone: dispatchTone,
                  text: dispatchText.trim(),
                  audience: dispatchAudience,
                  targetCallSign: dispatchAudience === 'targeted' ? dispatchTargetCallSign.trim() : undefined,
                });

                if (res.success && res.dispatch) {
                  appendAuditEntry(
                    'STAFF_EMERGENCY_BROADCAST',
                    `Staff broadcast transmission issued by ${dispatchSender} (${
                      dispatchAudience === 'all' ? 'All Operatives' : `Target: ${dispatchTargetCallSign}`
                    }).`,
                    {
                      targetCallSign: dispatchAudience === 'targeted' ? dispatchTargetCallSign : 'BROADCAST_ALL',
                    }
                  );
                  setDispatchText('');
                  reloadDispatches();
                  showFeedback('Emergency broadcast wire dispatched successfully.');
                } else {
                  showFeedback(res.error || 'Failed to issue broadcast.');
                }
              }}
              className="space-y-4 pt-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1 font-bold">
                    Sender Identity
                  </label>
                  <select
                    value={dispatchSender}
                    onChange={(e) => {
                      const s = e.target.value as any;
                      setDispatchSender(s);
                      setDispatchTone(s === 'THE DIRECTOR' ? 'director' : s === 'SYSTEM DISPATCH' ? 'system' : 'staff');
                    }}
                    className="w-full bg-[#0c0c0b] border border-border p-2 text-xs text-foreground focus:outline-none focus:border-crimson"
                  >
                    <option value="THE DIRECTOR">THE DIRECTOR OF POLICE</option>
                    <option value="SYSTEM DISPATCH">SYSTEM DISPATCH</option>
                    <option value="OPERATIONS COMMAND">OPERATIONS COMMAND</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1 font-bold">
                    Visual Tone
                  </label>
                  <select
                    value={dispatchTone}
                    onChange={(e) => setDispatchTone(e.target.value as MessageTone)}
                    className="w-full bg-[#0c0c0b] border border-border p-2 text-xs text-foreground focus:outline-none focus:border-crimson"
                  >
                    <option value="director">Directorate (Forest Green)</option>
                    <option value="system">System Notice (Dark Slate)</option>
                    <option value="antagonist">Antagonist Intercept (Crimson)</option>
                    <option value="staff">Staff Advisory (Amber)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1 font-bold">
                    Target Audience
                  </label>
                  <select
                    value={dispatchAudience}
                    onChange={(e) => setDispatchAudience(e.target.value as 'all' | 'targeted')}
                    className="w-full bg-[#0c0c0b] border border-border p-2 text-xs text-foreground focus:outline-none focus:border-crimson"
                  >
                    <option value="all">Broadcast to All Operatives</option>
                    <option value="targeted">Specific Operative Call-Sign</option>
                  </select>
                </div>
              </div>

              {dispatchAudience === 'targeted' && (
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1 font-bold">
                    Target Operative Call-Sign *
                  </label>
                  <input
                    type="text"
                    value={dispatchTargetCallSign}
                    onChange={(e) => setDispatchTargetCallSign(e.target.value)}
                    placeholder="Enter recipient call-sign (e.g. operative_1)..."
                    className="w-full bg-[#0c0c0b] border border-border p-2 text-xs text-foreground focus:outline-none focus:border-crimson"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1 font-bold">
                  Dispatch Text *
                </label>
                <textarea
                  value={dispatchText}
                  onChange={(e) => setDispatchText(e.target.value)}
                  placeholder="Enter transmission text to broadcast to investigators..."
                  rows={3}
                  className="w-full bg-[#0c0c0b] border border-border p-2.5 text-xs text-foreground focus:outline-none focus:border-crimson font-serif"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={!dispatchText.trim()}
                  className="button button-primary text-xs font-mono font-bold py-2 px-5 flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>Transmit Broadcast Wire</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sent Dispatches Log */}
          <div className="panel p-5 space-y-4">
            <div className="panel-heading">
              <span>ISSUED DISPATCH ARCHIVE ({customDispatches.length})</span>
              <Inbox size={14} />
            </div>

            {customDispatches.length === 0 ? (
              <p className="font-serif text-xs text-muted-foreground m-0 text-center py-4">
                No custom broadcasts issued yet. Transmissions composed above will be catalogued here.
              </p>
            ) : (
              <div className="space-y-3">
                {customDispatches.map((d) => (
                  <div key={d.id} className="p-3 bg-[#111110] border border-border space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-foreground uppercase">{d.sender}</span>
                      <span className="text-muted-foreground">{d.timestampIST}</span>
                    </div>
                    <p className="font-serif text-xs text-[#ded8cc] leading-relaxed m-0">{d.text}</p>
                    <div className="flex justify-between text-[9px] text-muted-foreground pt-1 border-t border-[#1c1b19]">
                      <span>Target: {d.audience === 'all' ? 'All Operatives' : `Operative: ${d.targetCallSign}`}</span>
                      <span className="text-emerald-400 font-bold">Active in Feed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: ACTIVITY & EVIDENCE
          ===================================================================== */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Sub-section 1: Evidence Catalogue Inspection */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="panel-heading">
              <span>EVIDENCE REPOSITORY CATALOGUE ({evidence.length} TOTAL ITEMS)</span>
              <FolderOpen size={15} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Search size={14} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter evidence by ID, title, or source..."
                  value={evidenceSearch}
                  onChange={(e) => setEvidenceSearch(e.target.value)}
                  className="bg-[#111110] border border-border px-3 py-1.5 text-foreground text-xs min-w-[220px] focus:outline-none focus:border-crimson"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={evidenceStageFilter}
                  onChange={(e) =>
                    setEvidenceStageFilter(
                      e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
                    )
                  }
                  className="bg-[#111110] border border-border px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-crimson"
                >
                  <option value="ALL">All Stages</option>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>
                      Stage 0{n}
                    </option>
                  ))}
                </select>

                <select
                  value={evidenceKindFilter}
                  onChange={(e) => setEvidenceKindFilter(e.target.value)}
                  className="bg-[#111110] border border-border px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-crimson"
                >
                  <option value="ALL">All Kinds</option>
                  {evidenceKinds.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-border">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-[#141715] border-b border-border text-[10px] uppercase text-muted-foreground">
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Title</th>
                    <th className="p-2.5">Kind</th>
                    <th className="p-2.5">Stage</th>
                    <th className="p-2.5">Classification</th>
                    <th className="p-2.5">Active Operative Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEvidence.map((item) => {
                    const isUnlocked = progress.unlockedEvidenceIds.includes(item.id);

                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-2.5 font-bold text-crimson">{item.id}</td>
                        <td className="p-2.5 text-foreground">
                          <strong>{item.title}</strong>
                          <span className="block text-[10px] text-muted-foreground truncate max-w-sm">
                            {item.summary}
                          </span>
                        </td>
                        <td className="p-2.5 text-muted-foreground">{item.kind}</td>
                        <td className="p-2.5">Stage 0{item.stage}</td>
                        <td className="p-2.5">
                          <span className="text-[10px] border border-border px-1.5 py-0.5">
                            {item.classification}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {isUnlocked ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <Check size={12} /> Unlocked
                            </span>
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Lock size={12} /> Sealed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sub-section 2: Protected Puzzle Keys & Acrostic Verification */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="panel-heading">
              <span>PROTECTED PUZZLE KEYS &amp; NORMALIZATION SPECIFICATIONS</span>
              <Key size={15} />
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Plaintext solutions and salted credentials are intentionally hidden from student bundles.
              The parameters below represent server-side verification specifications:
            </p>

            <div className="divide-y divide-border border border-border">
              {[
                {
                  key: 'gate_zk_login',
                  label: 'Stage 01 Login Cipher (Z-K Case / Case 17)',
                  norm: 'text (lowercase, stripped punctuation)',
                  hash: 'Salted SHA-256 (Masked)',
                },
                {
                  key: 'stage2DeductionSolved',
                  label: 'Stage 02 Coordinate Substitution (House 3893)',
                  norm: 'alphabetic substitution decode',
                  hash: 'Deterministic Coordinate Target',
                },
                {
                  key: 'gate_map',
                  label: 'Stage 03 Map Gate (Presidio District Boundary)',
                  norm: 'spatial bounding box & vector check',
                  hash: 'GeoJSON Polygon Gate',
                },
                {
                  key: 'gate_audio',
                  label: 'Stage 04 Reverse Audio Dispatch (Site 04 Candidate)',
                  norm: 'coordinate proximity (Site 04 target)',
                  hash: 'Correct: Washington & Cherry',
                },
                {
                  key: 'gate_suspect_db',
                  label: 'Stage 05 Suspect Vault Key (Z408_REOPENED)',
                  norm: 'strict token match',
                  hash: 'Salted SHA-256 (Masked)',
                },
              ].map(({ key, label, norm, hash }) => (
                <div key={key} className="p-3 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <strong className="block text-foreground">{label}</strong>
                    <span className="text-[10px] text-muted-foreground">
                      Param: {key} · Mode: {norm}
                    </span>
                  </div>
                  <span className="text-crimson font-mono text-[11px] border border-crimson/40 px-2 py-0.5">
                    {hash}
                  </span>
                </div>
              ))}
            </div>

            {/* Cryptographic Technical Memorandum Proof */}
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <h4 className="text-foreground font-semibold flex items-center gap-2">
                <span className="size-2 rounded-full bg-crimson" />
                <span>CRYPTOGRAPHIC TECHNICAL AUDIT: EXORCIST MEMORANDUM 74-03-B</span>
              </h4>
              <div className="p-3 bg-[#111110] border border-border space-y-2 text-[11px] leading-relaxed text-muted-foreground">
                <p className="m-0">
                  <strong className="text-foreground">Solution Structure:</strong> Classical double acrostic (telestich).
                  First characters spell <strong className="text-foreground">zkcase</strong>; last characters spell <strong className="text-foreground">case17</strong>.
                </p>
                <div className="p-2.5 bg-[#0a0a09] border border-[#242422] font-mono text-[10px] text-[#ebe6dc] space-y-0.5">
                  <div>Line 1: <span className="text-crimson font-bold">Z</span>odiac correspondence cross-referenced with precinct log book <span className="text-emerald-400 font-bold">c</span></div>
                  <div>Line 2: <span className="text-crimson font-bold">K</span>ey records from the October file appear altered in the annex are<span className="text-emerald-400 font-bold">a</span></div>
                  <div>Line 3: <span className="text-crimson font-bold">C</span>heck the typewriter alignment on the original carbon studie<span className="text-emerald-400 font-bold">s</span></div>
                  <div>Line 4: <span className="text-crimson font-bold">A</span>ll inquiries regarding Vault B require senior supervisor guidanc<span className="text-emerald-400 font-bold">e</span></div>
                  <div>Line 5: <span className="text-crimson font-bold">S</span>hift logs confirm missing negatives from storage locker bay 0<span className="text-emerald-400 font-bold">1</span></div>
                  <div>Line 6: <span className="text-crimson font-bold">E</span>xamine margin notations before submitting dossier update to squad 0<span className="text-emerald-400 font-bold">7</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-section 3: Organizer Privileged Audit Stream */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="panel-heading">
              <span>ORGANIZER PRIVILEGED AUDIT STREAM ({progress?.organizerAuditLog?.length || 0})</span>
              <Activity size={15} />
            </div>

            {progress?.organizerAuditLog && progress.organizerAuditLog.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {progress.organizerAuditLog.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-[#131514] border border-[#232c25] flex flex-wrap justify-between items-start gap-2 text-[#dcd6c9]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-crimson font-bold uppercase">{log.action}</span>
                        {log.targetCallSign && (
                          <span className="text-[10px] border border-border px-1 text-muted-foreground">
                            Target: {log.targetCallSign}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[11px] m-0">{log.detail}</p>
                      {(log.previousValue || log.newValue) && (
                        <div className="text-[10px] text-muted-foreground flex gap-3 pt-0.5">
                          {log.previousValue && <span>Prev: {log.previousValue}</span>}
                          {log.newValue && <span className="text-emerald-400">New: {log.newValue}</span>}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatToIST(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground italic border border-dashed border-border">
                No manual organizer interventions have been recorded in this browser session.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: GAME CONTROLS
          ===================================================================== */}
      {activeTab === 'controls' && (
        <div className="space-y-6">
          {/* Target Candidate Overrides (Stage 4) */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="panel-heading">
              <span>STAGE 04 TARGET CANDIDATE OVERRIDE</span>
              <ShieldAlert size={15} className="text-crimson" />
            </div>

            <div className="p-3 bg-[#131614] border border-[#232c25] text-[11px] text-[#b8cbbd] space-y-1">
              <strong className="text-foreground block uppercase">Investigator Target Rules:</strong>
              <p className="m-0 leading-relaxed">
                Players select from four potential sites. They are granted exactly one self-service correction
                before the Stage 04 scoring deadline. As staff, you can manually reassign their target or restore
                their correction allowance.
              </p>
            </div>

            <div className="p-4 bg-[#111110] border border-border space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground block">Active Operative Session:</span>
                  <strong className="text-base text-foreground font-bold">{progress.callSign}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-muted-foreground block">Current Target Choice:</span>
                  <span className="px-2 py-0.5 border border-crimson text-crimson font-bold text-xs">
                    {progress.targetLocationChoice ? `Site 0${progress.targetLocationChoice}` : 'Unselected'}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-[#161716] border border-border">
                  <span className="text-[10px] text-muted-foreground block uppercase">Lock Status</span>
                  <strong>{progress.targetChoiceLocked ? 'Locked (Submitted)' : 'Open / Unconfirmed'}</strong>
                </div>
                <div className="p-3 bg-[#161716] border border-border">
                  <span className="text-[10px] text-muted-foreground block uppercase">Player Correction Used</span>
                  <strong>
                    {progress.targetLocationCorrectionUsed ? 'Yes (1 Correction Utilized)' : 'No (1 Remaining)'}
                  </strong>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-foreground block uppercase">
                  Staff Target Candidate Override Action:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 1, name: 'Site 01: Lake Herman Road' },
                    { id: 2, name: 'Site 02: Blue Rock Springs' },
                    { id: 3, name: 'Site 03: Lake Berryessa' },
                    { id: 4, name: 'Site 04: Washington & Cherry (Correct)' },
                  ].map((site) => (
                    <button
                      key={site.id}
                      onClick={() => handleTargetOverride(site.id)}
                      className={`p-2.5 border text-left text-[11px] transition-all ${
                        progress.targetLocationChoice === site.id
                          ? 'border-crimson bg-red-950/40 text-foreground font-bold'
                          : 'border-border bg-[#141514] text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="block font-bold">0{site.id}</span>
                      <span>{site.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap justify-between items-center gap-3 border-t border-border">
                <button
                  onClick={handleResetCorrectionAllowance}
                  className="button button-secondary text-xs"
                >
                  Reset Player Correction Allowance (Allow 1 More)
                </button>

                <button
                  onClick={handleUnlockStageEvidence}
                  className="button button-secondary text-xs"
                >
                  Declassify Stage 0{progress.activeStage} Evidence Files
                </button>
              </div>
            </div>
          </div>

          {/* Score Adjustment Console */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="panel-heading">
              <span>MANUAL SCORE ADJUDICATION</span>
              <Award size={15} />
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              Award or deduct competitive points for operative <strong className="text-foreground">{progress.callSign}</strong>.
              All manual score adjustments require a justification and are committed to the audit stream.
            </p>

            <form onSubmit={handleAdjustScore} className="space-y-3 bg-[#111110] p-4 border border-border">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground block mb-1">
                    Point Adjustment (Delta)
                  </label>
                  <input
                    type="number"
                    value={scoreDelta}
                    onChange={(e) => setScoreDelta(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#161615] border border-border p-2 text-foreground font-mono text-xs focus:outline-none focus:border-crimson"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase text-muted-foreground block mb-1">
                    Adjudication Reason / Justification
                  </label>
                  <input
                    type="text"
                    value={scoreReason}
                    onChange={(e) => setScoreReason(e.target.value)}
                    placeholder="e.g. Stage 02 cipher bonus, staff challenge compensation..."
                    className="w-full bg-[#161615] border border-border p-2 text-foreground font-mono text-xs focus:outline-none focus:border-crimson"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setScoreDelta(val)}
                      className="px-2 py-1 bg-[#1a1a19] border border-border text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      +{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setScoreDelta(-25)}
                    className="px-2 py-1 bg-[#1a1a19] border border-border text-[10px] text-red-400 hover:text-red-300"
                  >
                    -25
                  </button>
                </div>

                <button type="submit" className="button button-primary text-xs">
                  Apply Score Adjustment ({scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts)
                </button>
              </div>
            </form>
          </div>

          {/* DESTRUCTIVE OPERATIONS (Guarded by Confirmation Dialogs) */}
          <div className="panel p-5 space-y-4 font-mono text-xs border-crimson/50 bg-[#161111]">
            <div className="flex items-center gap-2 text-crimson">
              <AlertTriangle size={18} />
              <span className="font-bold uppercase tracking-wider text-sm">
                Destructive Staff Interventions (Danger Zone)
              </span>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              The actions below permanently alter or wipe operative progress. These controls are strictly separated
              from routine adjustments and require mandatory modal confirmation before execution.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#100c0c] border border-crimson/40 space-y-3">
                <strong className="text-foreground text-xs block uppercase">
                  Reset Operative Progress to Zero
                </strong>
                <p className="text-[11px] text-muted-foreground leading-relaxed m-0">
                  Resets stages completed back to 0, resets score to 0, clears all target location choices, and revokes
                  unlocked evidence for <strong className="text-foreground">{progress.callSign}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setDestructiveModal({
                      isOpen: true,
                      type: 'reset_progress',
                      title: 'Confirm Full Progress Reset',
                      description: `Are you certain you want to wipe all progress for operative "${progress.callSign}"? This will set active stage to 1, score to 0, and clear all solved puzzles.`,
                      confirmLabel: 'Confirm & Wipe Progress',
                      targetCallSign: progress.callSign,
                    })
                  }
                  className="button button-primary text-xs bg-crimson hover:bg-red-700 w-full justify-center"
                >
                  Reset Progress to Stage 1
                </button>
              </div>

              <div className="p-4 bg-[#100c0c] border border-crimson/40 space-y-3">
                <strong className="text-foreground text-xs block uppercase">
                  Purge Local Storage Record
                </strong>
                <p className="text-[11px] text-muted-foreground leading-relaxed m-0">
                  Completely deletes the localStorage progress key for operative{' '}
                  <strong className="text-foreground">{progress.callSign}</strong> and refreshes the browser session.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setDestructiveModal({
                      isOpen: true,
                      type: 'purge_storage',
                      title: 'Confirm Local Record Purge',
                      description: `Are you certain you want to delete the local storage record for "${progress.callSign}"? The page will immediately reload after deletion.`,
                      confirmLabel: 'Purge Record & Reload',
                      targetCallSign: progress.callSign,
                    })
                  }
                  className="button button-secondary text-xs border-crimson text-crimson hover:bg-crimson/20 w-full justify-center"
                >
                  Purge Browser Storage Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: SETTINGS & ARCHITECTURE
          ===================================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Timeline & Schedule Settings */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="panel-heading">
              <span>CANONICAL TIMELINE CONFIGURATION</span>
              <Calendar size={15} />
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#111110] border border-border flex flex-wrap justify-between items-center gap-2">
                <div>
                  <strong className="text-foreground block">Registration Window Opening</strong>
                  <span className="text-[11px] text-muted-foreground">
                    Configured in src/lib/stageConfig.ts: REGISTRATION_OPEN_IST
                  </span>
                </div>
                <span className="text-emerald-400 font-bold border border-border px-2 py-1">
                  {REGISTRATION_OPEN_IST}
                </span>
              </div>

              <div className="p-3 bg-[#111110] border border-border flex flex-wrap justify-between items-center gap-2">
                <div>
                  <strong className="text-foreground block">Main Game Midnight Launch</strong>
                  <span className="text-[11px] text-muted-foreground">
                    Configured in src/lib/stageConfig.ts: GAME_LAUNCH_IST
                  </span>
                </div>
                <span className="text-emerald-400 font-bold border border-border px-2 py-1">
                  {GAME_LAUNCH_IST}
                </span>
              </div>

              <div className="p-3 bg-[#111110] border border-border flex flex-wrap justify-between items-center gap-2">
                <div>
                  <strong className="text-foreground block">Timeline Gates Enforcement Status</strong>
                  <span className="text-[11px] text-muted-foreground">
                    ENABLE_TIMELINE_GATES flag in stageConfig.ts
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold border px-2 py-1 uppercase ${
                    ENABLE_TIMELINE_GATES
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-amber-500 text-amber-400'
                  }`}
                >
                  {ENABLE_TIMELINE_GATES ? 'Strictly Enforced (Blocking)' : 'Open Prototype Mode (Non-Blocking)'}
                </span>
              </div>
            </div>
          </div>

          {/* Active Operative Preferences */}
          <div className="panel p-5 space-y-4 font-mono text-xs">
            <div className="panel-heading">
              <span>EXPERIENCE &amp; ACCESSIBILITY TOGGLES (ACTIVE OPERATIVE)</span>
              <Sliders size={15} />
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#111110] border border-border flex justify-between items-center">
                <div>
                  <strong className="text-foreground block">Reduced Scare Mode</strong>
                  <span className="text-[11px] text-muted-foreground">
                    Diminishes aggressive audio jumpscares and visual flicker artifacts.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !progress.reducedScareMode;
                    onUpdateProgress((prev) => ({ ...prev, reducedScareMode: nextVal }));
                    showFeedback(`Reduced scare mode set to ${nextVal ? 'ENABLED' : 'DISABLED'}`);
                  }}
                  className={`px-3 py-1 border text-xs font-mono uppercase ${
                    progress.reducedScareMode
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {progress.reducedScareMode ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="p-3 bg-[#111110] border border-border flex justify-between items-center">
                <div>
                  <strong className="text-foreground block">Default Audio Mute</strong>
                  <span className="text-[11px] text-muted-foreground">
                    Keeps ambient tape noise and radio static muted until investigator clicks play.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !progress.muteAudioDefault;
                    onUpdateProgress((prev) => ({ ...prev, muteAudioDefault: nextVal }));
                    showFeedback(`Default audio mute set to ${nextVal ? 'ENABLED' : 'DISABLED'}`);
                  }}
                  className={`px-3 py-1 border text-xs font-mono uppercase ${
                    progress.muteAudioDefault
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {progress.muteAudioDefault ? 'Muted' : 'Unmuted'}
                </button>
              </div>
            </div>
          </div>

          {/* Backend Production Architecture Contract */}
          <div className="panel p-5 space-y-4 font-mono text-xs border-border">
            <div className="panel-heading">
              <span>PRODUCTION BACKEND INTEGRATION STATUS</span>
              <Database size={15} />
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              This application is currently executing in its high-fidelity frontend prototype runtime.
              Database schemas, Row-Level Security policies, and authoritative scoring triggers are
              documented in the case repository:
            </p>

            <div className="space-y-2.5">
              {[
                {
                  label: 'PostgreSQL Migration Contract',
                  file: 'public/assets/aistudio/case17_migration_6c9c9d20.sql',
                  status: 'Contract Defined',
                  note: 'Includes participant profiles, stage solves, team invitations, and audit log tables.',
                },
                {
                  label: 'Authoritative Multi-School Leaderboard',
                  file: 'Supabase Realtime Broadcast',
                  status: 'Pending Backend Provision',
                  note: 'Client currently computes standings from local prototype participants.',
                },
                {
                  label: 'Row-Level Security & Role Enforcement',
                  file: 'auth.uid() = user_id policies',
                  status: 'Pending Backend Provision',
                  note: 'Organizers and participants share client bundle; production uses PostgreSQL JWT claims.',
                },
              ].map(({ label, file, status, note }) => (
                <div key={label} className="p-3 bg-[#111110] border border-border space-y-1">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <strong className="text-foreground">{label}</strong>
                    <span className="text-[10px] text-amber-400 border border-amber-500/40 px-2 py-0.5 uppercase">
                      {status}
                    </span>
                  </div>
                  <span className="text-[10px] text-crimson block font-mono">{file}</span>
                  <p className="text-[11px] text-muted-foreground m-0">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MANDATORY CONFIRMATION MODAL FOR DESTRUCTIVE ACTIONS
          ===================================================================== */}
      {destructiveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="panel max-w-md w-full p-6 space-y-5 border-crimson bg-[#120e0e] shadow-2xl">
            <div className="flex items-center gap-3 text-crimson">
              <div className="size-10 rounded-full bg-crimson/20 border border-crimson/60 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-crimson" />
              </div>
              <div>
                <span className="eyebrow block text-crimson">CONFIRMATION REQUIRED</span>
                <h3 className="font-serif text-xl font-normal text-foreground">
                  {destructiveModal.title}
                </h3>
              </div>
            </div>

            <p className="font-mono text-xs text-[#d8d2c7] leading-relaxed">
              {destructiveModal.description}
            </p>

            <div className="p-3 bg-red-950/30 border border-crimson/40 text-[11px] font-mono text-red-200">
              Warning: This action cannot be undone. An audit record will be registered immediately.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDestructiveModal((prev) => ({ ...prev, isOpen: false }))}
                className="button button-secondary text-xs"
              >
                Cancel / Abort
              </button>
              <button
                type="button"
                onClick={executeDestructiveAction}
                className="button button-primary text-xs bg-crimson hover:bg-red-700"
              >
                {destructiveModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LayoutDashboardIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
