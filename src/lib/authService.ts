/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * THE LAST SIGNAL — UNIFIED AUTHENTICATION SERVICE
 * 
 * Bridges between Supabase Auth (when credentials exist in .env)
 * and the local prototype authentication engine (when in offline/local testing mode).
 * 
 * Guarantees:
 * 1. Zero plaintext password storage in database or browser storage.
 * 2. Admission numbers are cryptographically hashed and masked for student privacy.
 * 3. Consistent session restoration and token refresh.
 * 4. Automatic fallback with diagnostic reporting.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import {
  registerPrototypeUser,
  loginPrototypeUser,
  getActiveUser as getLocalActiveUser,
  clearActiveSession as clearLocalActiveSession,
  setActiveSession as setLocalActiveSession,
  isCallSignTaken as isLocalCallSignTaken,
  hashString,
  maskAdmissionNumber,
  type PrototypeUser,
  type UserProgress,
  getUserProgress,
  createInitialProgress,
  saveUserProgress,
} from './prototypeAuth';
import { isRegistrationOpen, REGISTRATION_OPEN_IST } from './stageConfig';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: PrototypeUser;
  mode: 'live_supabase' | 'prototype_local';
}

const EMAIL_DOMAIN = '@case17.internal';

/**
 * Format a student call-sign into an internal auth email format for Supabase Auth.
 */
function callSignToInternalEmail(callSign: string): string {
  const clean = callSign.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  return `${clean}${EMAIL_DOMAIN}`;
}

/**
 * Check if a call-sign is already registered.
 */
export async function isCallSignAvailable(callSign: string): Promise<boolean> {
  const clean = callSign.trim();
  if (clean.length < 3) return false;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', clean)
        .maybeSingle();

      if (error) {
        console.warn('[authService] Supabase profile check error, checking local', error);
        return !isLocalCallSignTaken(clean);
      }
      return !data;
    } catch {
      return !isLocalCallSignTaken(clean);
    }
  }

  return !isLocalCallSignTaken(clean);
}

/**
 * Register a new student investigator.
 */
export async function registerUser(params: {
  fullName: string;
  studentClass: string;
  admissionNumber: string;
  callSign: string;
  passwordPlain: string;
}): Promise<AuthResult> {
  // Enforce registration window timing
  if (!isRegistrationOpen()) {
    return {
      success: false,
      error: `Registration is not open yet. Student intake begins on ${REGISTRATION_OPEN_IST}.`,
      mode: isSupabaseConfigured ? 'live_supabase' : 'prototype_local',
    };
  }

  const { fullName, studentClass, admissionNumber, callSign, passwordPlain } = params;

  if (!fullName.trim() || !studentClass.trim() || !admissionNumber.trim() || !callSign.trim() || !passwordPlain) {
    return {
      success: false,
      error: 'All fields are strictly required.',
      mode: isSupabaseConfigured ? 'live_supabase' : 'prototype_local',
    };
  }

  const cleanCallSign = callSign.trim();
  if (cleanCallSign.length < 3 || cleanCallSign.length > 24) {
    return {
      success: false,
      error: 'Call-sign must be between 3 and 24 characters.',
      mode: isSupabaseConfigured ? 'live_supabase' : 'prototype_local',
    };
  }

  if (!/^[A-Za-z0-9_]+$/.test(cleanCallSign)) {
    return {
      success: false,
      error: 'Call-sign can only contain letters, numbers, and underscores.',
      mode: isSupabaseConfigured ? 'live_supabase' : 'prototype_local',
    };
  }

  const reserved = ['admin', 'director', 'zodiac', 'system', 'moderator', 'staff', 'owner'];
  if (reserved.includes(cleanCallSign.toLowerCase())) {
    return {
      success: false,
      error: 'This call-sign is reserved by the investigation authority.',
      mode: isSupabaseConfigured ? 'live_supabase' : 'prototype_local',
    };
  }

  // Pre-calculate cryptographic hashes for privacy
  const [admissionHash, passwordHash] = await Promise.all([
    hashString(admissionNumber),
    hashString(passwordPlain),
  ]);
  const maskedAdmission = maskAdmissionNumber(admissionNumber);

  // If Supabase is live, register via Supabase Auth
  if (isSupabaseConfigured && supabase) {
    try {
      const email = callSignToInternalEmail(cleanCallSign);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: passwordPlain,
        options: {
          data: {
            username: cleanCallSign,
            callSign: cleanCallSign,
            fullName: fullName.trim(),
            full_name: fullName.trim(),
            studentClass,
            student_class: studentClass,
            admissionHash,
            admission_hash: admissionHash,
            admissionNumberMasked: maskedAdmission,
            admission_masked: maskedAdmission,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
          mode: 'live_supabase',
        };
      }

      if (data.user) {
        const userObj: PrototypeUser = {
          id: data.user.id,
          fullName: fullName.trim(),
          studentClass,
          admissionNumberMasked: maskedAdmission,
          admissionHash,
          callSign: cleanCallSign,
          passwordHash,
          registeredAt: data.user.created_at || new Date().toISOString(),
        };

        // Cache locally for fast UI hydration
        setLocalActiveSession(userObj);
        saveUserProgress(createInitialProgress(cleanCallSign));

        return {
          success: true,
          user: userObj,
          mode: 'live_supabase',
        };
      }
    } catch (err: unknown) {
      console.warn('[authService] Supabase registration error, falling back to local engine:', err);
    }
  }

  // Fallback / Prototype mode
  const localResult = await registerPrototypeUser(params);
  return {
    ...localResult,
    mode: 'prototype_local',
  };
}

/**
 * Authenticate an existing student investigator.
 */
export async function loginUser(
  callSign: string,
  passwordPlain: string
): Promise<AuthResult> {
  const cleanCallSign = callSign.trim();
  if (!cleanCallSign || !passwordPlain) {
    return {
      success: false,
      error: 'Please enter both your call-sign and password.',
      mode: isSupabaseConfigured ? 'live_supabase' : 'prototype_local',
    };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const email = callSignToInternalEmail(cleanCallSign);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: passwordPlain,
      });

      if (error) {
        return {
          success: false,
          error: 'Invalid case credentials. Please check your call-sign and password.',
          mode: 'live_supabase',
        };
      }

      if (data.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        const passwordHash = await hashString(passwordPlain);
        const userObj: PrototypeUser = {
          id: data.user.id,
          fullName: profile?.full_name || (data.user.user_metadata?.full_name as string) || cleanCallSign,
          studentClass: profile?.student_class || (data.user.user_metadata?.student_class as string) || 'Class 9',
          admissionNumberMasked: profile?.admission_masked || (data.user.user_metadata?.admission_masked as string) || 'ADM-••••0000',
          admissionHash: profile?.admission_hash || '',
          callSign: profile?.username || cleanCallSign,
          passwordHash,
          registeredAt: data.user.created_at || new Date().toISOString(),
        };

        setLocalActiveSession(userObj);
        return {
          success: true,
          user: userObj,
          mode: 'live_supabase',
        };
      }
    } catch (err: unknown) {
      console.warn('[authService] Supabase login error, falling back to local engine:', err);
    }
  }

  // Fallback / Prototype mode
  const localResult = await loginPrototypeUser(callSign, passwordPlain);
  return {
    ...localResult,
    mode: 'prototype_local',
  };
}

/**
 * Restore current session on page refresh.
 */
export async function restoreSession(): Promise<PrototypeUser | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle();

        const callSign = profile?.username || (data.session.user.user_metadata?.username as string) || 'Operative';
        const userObj: PrototypeUser = {
          id: data.session.user.id,
          fullName: profile?.full_name || (data.session.user.user_metadata?.full_name as string) || callSign,
          studentClass: profile?.student_class || (data.session.user.user_metadata?.student_class as string) || 'Class 9',
          admissionNumberMasked: profile?.admission_masked || (data.session.user.user_metadata?.admission_masked as string) || 'ADM-••••0000',
          admissionHash: profile?.admission_hash || '',
          callSign,
          passwordHash: '',
          registeredAt: data.session.user.created_at || new Date().toISOString(),
        };

        setLocalActiveSession(userObj);
        return userObj;
      }
    } catch (err) {
      console.warn('[authService] Session restoration check failed:', err);
    }
  }

  return getLocalActiveUser();
}

/**
 * Log out the active session.
 */
export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[authService] Supabase sign out error:', err);
    }
  }
  clearLocalActiveSession();
}
