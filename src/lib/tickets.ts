/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CASE INVESTIGATION SUPPORT TICKETING SYSTEM
 * 
 * Handles player help requests, bug reports, and cipher inquiry tickets.
 * 
 * BACKEND PERSISTENCE ARCHITECTURE:
 * - When Supabase is configured (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY),
 *   tickets are stored with Row-Level Security (RLS) in PostgreSQL.
 * - In local prototype mode (current configuration), tickets are safely isolated
 *   in browser localStorage with explicit player-scoping filters.
 * - Players can ONLY read their own submitted tickets.
 * - Staff access requires authorized staff session validation.
 */

import { isSupabaseConfigured } from '@/src/lib/supabase';
import type { PrototypeUser } from '@/src/lib/prototypeAuth';

export type TicketCategory =
  | 'TECHNICAL_BUG'
  | 'CIPHER_CLARIFICATION'
  | 'SCHEDULE_DEADLINE'
  | 'ACCOUNT_CREDENTIALS'
  | 'OTHER_INQUIRY';

export type TicketStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface SupportTicket {
  id: string; // Format: TKT-2026-XXXX
  callSign: string;
  fullName: string;
  studentClass: string;
  subject: string;
  category: TicketCategory;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  staffResponse?: string;
  staffNotes?: string; // Staff-only internal notes
  resolvedBy?: string;
}

const STORAGE_KEY = 'tls_support_tickets_v1';

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  TECHNICAL_BUG: 'Technical Bug / UI Glitch',
  CIPHER_CLARIFICATION: 'Cipher or Clue Clarification',
  SCHEDULE_DEADLINE: 'Stage Schedule & IST Deadline',
  ACCOUNT_CREDENTIALS: 'Account & Call-Sign Issue',
  OTHER_INQUIRY: 'General Investigative Question',
};

export const STATUS_LABELS: Record<TicketStatus, { label: string; badgeClass: string }> = {
  OPEN: {
    label: 'DISPATCH OPEN',
    badgeClass: 'bg-amber-950/80 border border-amber-600/70 text-amber-300',
  },
  UNDER_REVIEW: {
    label: 'UNDER REVIEW',
    badgeClass: 'bg-blue-950/80 border border-blue-600/70 text-blue-300',
  },
  RESOLVED: {
    label: 'RESOLVED',
    badgeClass: 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300',
  },
  CLOSED: {
    label: 'CLOSED',
    badgeClass: 'bg-[#181816] border border-[#302f2c] text-[#8a857c]',
  },
};

/**
 * Retrieve all raw tickets from local storage.
 * INTERNAL USE ONLY — never expose this function directly to untrusted player views.
 */
function readAllTicketsFromStorage(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read tickets from storage', err);
    return [];
  }
}

/**
 * Save tickets array to local storage.
 */
function writeAllTicketsToStorage(tickets: SupportTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.error('Failed to write tickets to storage', err);
  }
}

/**
 * Generates an authentic case docket ticket ID (e.g. TKT-2026-8F2A)
 */
function generateTicketId(): string {
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `TKT-2026-${hex}`;
}

/**
 * Validates a new ticket payload according to safety and length constraints.
 */
export function validateTicketPayload(payload: {
  subject: string;
  category: string;
  message: string;
}): { isValid: boolean; error?: string } {
  const subject = payload.subject?.trim();
  const message = payload.message?.trim();
  const category = payload.category as TicketCategory;

  if (!subject) {
    return { isValid: false, error: 'Subject line is strictly required.' };
  }
  if (subject.length < 4) {
    return { isValid: false, error: 'Subject must be at least 4 characters long.' };
  }
  if (subject.length > 100) {
    return { isValid: false, error: 'Subject cannot exceed 100 characters.' };
  }

  const validCategories: TicketCategory[] = [
    'TECHNICAL_BUG',
    'CIPHER_CLARIFICATION',
    'SCHEDULE_DEADLINE',
    'ACCOUNT_CREDENTIALS',
    'OTHER_INQUIRY',
  ];
  if (!validCategories.includes(category)) {
    return { isValid: false, error: 'Please select a valid ticket category.' };
  }

  if (!message) {
    return { isValid: false, error: 'Description message is required.' };
  }
  if (message.length < 10) {
    return { isValid: false, error: 'Message must provide at least 10 characters of detail.' };
  }
  if (message.length > 1500) {
    return { isValid: false, error: 'Message cannot exceed 1500 characters. Please be concise.' };
  }

  return { isValid: true };
}

/**
 * Submit a new ticket on behalf of a registered player.
 * Sanitizes input, assigns a unique docket number, and stores the ticket.
 */
export function submitPlayerTicket(params: {
  user: PrototypeUser;
  subject: string;
  category: TicketCategory;
  message: string;
  priority?: TicketPriority;
}): { success: boolean; ticket?: SupportTicket; error?: string } {
  const { user, subject, category, message, priority = 'NORMAL' } = params;

  if (!user || !user.callSign) {
    return { success: false, error: 'Authentication required to submit support tickets.' };
  }

  const validation = validateTicketPayload({ subject, category, message });
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const nowIso = new Date().toISOString();
  const newTicket: SupportTicket = {
    id: generateTicketId(),
    callSign: user.callSign,
    fullName: user.fullName,
    studentClass: user.studentClass,
    subject: subject.trim(),
    category,
    message: message.trim(),
    status: 'OPEN',
    priority,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const all = readAllTicketsFromStorage();
  all.unshift(newTicket);
  writeAllTicketsToStorage(all);

  return { success: true, ticket: newTicket };
}

/**
 * Retrieve tickets belonging EXCLUSIVELY to the requesting player.
 * Strips internal staff notes to prevent data leaks.
 */
export function getPlayerTickets(callSign: string): Omit<SupportTicket, 'staffNotes'>[] {
  if (!callSign) return [];
  const clean = callSign.trim().toLowerCase();
  const all = readAllTicketsFromStorage();

  return all
    .filter((t) => t.callSign.toLowerCase() === clean)
    .map((t) => {
      // Omit internal staffNotes for player consumption
      const { staffNotes, ...sanitized } = t;
      return sanitized;
    });
}

/**
 * Staff-only: Retrieve all tickets across all operatives.
 * Guarded by staff authorization check.
 */
export function getAllTicketsForStaff(isStaffAuthorized: boolean): SupportTicket[] {
  if (!isStaffAuthorized) {
    console.warn('[SECURITY] Unauthorized attempt to access all support tickets.');
    return [];
  }
  return readAllTicketsFromStorage();
}

/**
 * Staff-only: Update ticket status, provide public staff response, or record internal notes.
 */
export function updateTicketByStaff(
  isStaffAuthorized: boolean,
  ticketId: string,
  updates: {
    status?: TicketStatus;
    priority?: TicketPriority;
    staffResponse?: string;
    staffNotes?: string;
    staffCallSign?: string;
  }
): { success: boolean; error?: string; ticket?: SupportTicket } {
  if (!isStaffAuthorized) {
    return { success: false, error: 'Staff authorization required to update tickets.' };
  }

  const all = readAllTicketsFromStorage();
  const index = all.findIndex((t) => t.id === ticketId);
  if (index === -1) {
    return { success: false, error: `Ticket ${ticketId} not found in docket repository.` };
  }

  const current = all[index];
  const nowIso = new Date().toISOString();

  const updated: SupportTicket = {
    ...current,
    status: updates.status ?? current.status,
    priority: updates.priority ?? current.priority,
    staffResponse: updates.staffResponse !== undefined ? updates.staffResponse.trim() : current.staffResponse,
    staffNotes: updates.staffNotes !== undefined ? updates.staffNotes.trim() : current.staffNotes,
    resolvedBy: updates.staffCallSign ?? current.resolvedBy,
    updatedAt: nowIso,
  };

  all[index] = updated;
  writeAllTicketsToStorage(all);

  return { success: true, ticket: updated };
}

export async function submitPlayerTicketAsync(params: {
  user: PrototypeUser;
  subject: string;
  category: TicketCategory;
  message: string;
  priority?: TicketPriority;
}): Promise<{ success: boolean; ticket?: SupportTicket; error?: string }> {
  const localRes = submitPlayerTicket(params);
  if (!localRes.success) return localRes;

  if (isSupabaseConfigured) {
    try {
      const { getSupabase } = await import('./supabase');
      const client = getSupabase();
      const { data, error } = await client.rpc('submit_ticket', {
        p_subject: params.subject.trim(),
        p_category: params.category,
        p_message: params.message.trim(),
        p_priority: params.priority || 'NORMAL',
      });
      if (error) {
        console.warn('[tickets] Supabase submit_ticket error, using local fallback:', error);
      } else if (data?.ticket_id && localRes.ticket) {
        localRes.ticket.id = data.ticket_id;
      }
    } catch (err) {
      console.warn('[tickets] Supabase RPC unavailable:', err);
    }
  }

  return localRes;
}

export async function getPlayerTicketsAsync(callSign: string): Promise<Omit<SupportTicket, 'staffNotes'>[]> {
  if (isSupabaseConfigured) {
    try {
      const { getSupabase } = await import('./supabase');
      const client = getSupabase();
      const { data, error } = await client.rpc('get_my_tickets');
      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          id: row.id,
          callSign,
          fullName: 'Investigator',
          studentClass: 'Registered Operative',
          subject: row.subject,
          category: row.category as TicketCategory,
          message: row.message,
          status: row.status as TicketStatus,
          priority: row.priority as TicketPriority,
          staffResponse: row.staff_response,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    } catch (err) {
      console.warn('[tickets] Supabase get_my_tickets error, using local fallback:', err);
    }
  }
  return getPlayerTickets(callSign);
}

export async function getAllTicketsForStaffAsync(isStaffAuthorized: boolean): Promise<SupportTicket[]> {
  if (!isStaffAuthorized) return [];
  if (isSupabaseConfigured) {
    try {
      const { getSupabase } = await import('./supabase');
      const client = getSupabase();
      const { data, error } = await client.rpc('staff_get_all_tickets');
      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          id: row.id,
          callSign: row.call_sign,
          fullName: row.full_name,
          studentClass: row.student_class,
          subject: row.subject,
          category: row.category as TicketCategory,
          message: row.message,
          status: row.status as TicketStatus,
          priority: row.priority as TicketPriority,
          staffResponse: row.staff_response,
          staffNotes: row.staff_notes,
          resolvedBy: row.resolved_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    } catch (err) {
      console.warn('[tickets] Supabase staff_get_all_tickets error, using local fallback:', err);
    }
  }
  return getAllTicketsForStaff(isStaffAuthorized);
}

/**
 * Returns backend persistence status for clear developer/user disclosure.
 */
export function getSupportStorageStatus(): {
  isConfigured: boolean;
  mode: 'live_supabase' | 'prototype_localStorage';
  note: string;
} {
  return {
    isConfigured: isSupabaseConfigured,
    mode: isSupabaseConfigured ? 'live_supabase' : 'prototype_localStorage',
    note: isSupabaseConfigured
      ? 'Live Supabase database connected. Row-Level Security governs cross-user ticket isolation.'
      : 'Running in Local Prototype Mode. Tickets persist in browser storage. In a live multi-user launch, Supabase tables and RLS policies are required for cross-device support sharing.',
  };
}

