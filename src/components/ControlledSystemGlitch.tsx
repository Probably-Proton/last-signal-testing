/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CONTROLLED FORENSIC GLITCH COMPONENT (STAGE 6 / 7)
 * 
 * Reconstructed 5-phase forensic terminal malfunction sequence:
 * 1. Normal Operation (0ms - 900ms): Faint tracking line, quiet electrical hum.
 * 2. Initial Signal Interruption (900ms - 2200ms): Horizontal image displacement,
 *    restrained scanline flutter, subtle RGB separation, short transmission static.
 * 3. Escalating Corruption (2200ms - 4200ms): Pronounced image tearing, frame jitter,
 *    fragment displacement, synchronized digital static bursts.
 * 4. Recovery Attempt (4200ms - 5800ms): Intermittent signal stabilization, tension pulse.
 * 5. Final Interruption (5800ms - 6600ms): Abrupt signal cutoff, CRT phosphor decay,
 *    clean transition into Directorate lockdown.
 * 
 * Safety & Accessibility:
 * - Respects prefers-reduced-motion and reducedScareMode (non-flashing static alert).
 * - Keyboard ESC and explicit recovery button prevent trapped states.
 * - Cleanup guaranteed on unmount.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ShieldAlert, AlertTriangle, RefreshCw, XCircle, Terminal } from 'lucide-react';
import { tacticalAudio } from '../lib/tacticalAudio';

export interface ControlledSystemGlitchProps {
  isActive: boolean;
  reducedScareMode?: boolean;
  onComplete: () => void;
  onDismiss?: () => void;
}

type GlitchStep =
  | 'idle'
  | 'normal_with_subtle_interference'
  | 'initial_interruption'
  | 'escalating_corruption'
  | 'recovery_attempt'
  | 'final_interruption'
  | 'resolved';

export const ControlledSystemGlitch: React.FC<ControlledSystemGlitchProps> = ({
  isActive,
  reducedScareMode = false,
  onComplete,
  onDismiss,
}) => {
  const [step, setStep] = useState<GlitchStep>('idle');
  const [telemetryText, setTelemetryText] = useState('SYSTEM MONITOR: OK');
  const [cycleCount, setCycleCount] = useState(0);

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const hasCompletedRef = useRef(false);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const handleSkipOrRecover = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    clearAllTimers();
    tacticalAudio.playGlitchCutoff();
    setStep('resolved');
    setTimeout(() => {
      setStep('idle');
      onComplete();
    }, 250);
  }, [onComplete]);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!isActive) {
      setStep('idle');
      clearAllTimers();
      hasCompletedRef.current = false;
      return;
    }

    hasCompletedRef.current = false;
    clearAllTimers();

    // If student has reduced scare mode or system prefers reduced motion, present a clean static alert
    if (reducedScareMode || prefersReducedMotion) {
      setStep('recovery_attempt');
      setTelemetryText('DIRECTORATE EMBARGO: TERMINAL INPUT RESTRICTED');
      tacticalAudio.playGlitchHum();

      const t = setTimeout(() => {
        handleSkipOrRecover();
      }, 3000);
      timersRef.current.push(t);
      return;
    }

    // Step 1: Normal Operation with subtle interference (0ms -> 900ms)
    setStep('normal_with_subtle_interference');
    setTelemetryText('MONITORING ARCHIVAL REEL 0x17-TLS-VALE... [STREAM SYNCHRONIZED]');
    tacticalAudio.playGlitchHum();

    // Step 2: Initial Signal Interruption (900ms -> 2200ms)
    const t1 = setTimeout(() => {
      setStep('initial_interruption');
      setTelemetryText('CARRIER FREQUENCY DRIFT: 50.2Hz MISMATCH DETECTED');
      tacticalAudio.playGlitchInterference();
    }, 900);
    timersRef.current.push(t1);

    // Step 3: Escalating Corruption (2200ms -> 4200ms)
    const t2 = setTimeout(() => {
      setStep('escalating_corruption');
      setTelemetryText('BUFFER OVERFLOW: REPOSITORY EMBARGO ENFORCED BY DIRECTORATE');
      tacticalAudio.playGlitchStaticBurst(0.75);

      // Micro-burst halfway through Phase 3
      const t2b = setTimeout(() => {
        tacticalAudio.playGlitchStaticBurst(0.9);
      }, 950);
      timersRef.current.push(t2b);
    }, 2200);
    timersRef.current.push(t2);

    // Step 4: Recovery Attempt (4200ms -> 5800ms)
    const t3 = setTimeout(() => {
      setStep('recovery_attempt');
      setTelemetryText('ATTEMPTING RESTORATION... PACKETS RECOVERED [4/17]');
      tacticalAudio.playGlitchPulse();

      const t3b = setTimeout(() => {
        tacticalAudio.playGlitchPulse();
      }, 700);
      timersRef.current.push(t3b);
    }, 4200);
    timersRef.current.push(t3);

    // Step 5: Final Interruption (5800ms -> 6600ms)
    const t4 = setTimeout(() => {
      setStep('final_interruption');
      setTelemetryText('TERMINAL INPUT SEVERED // PERMANENT EMBARGO ACTIVE');
      tacticalAudio.playGlitchCutoff();

      const t5 = setTimeout(() => {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setStep('resolved');
          setTimeout(() => {
            setStep('idle');
            onComplete();
          }, 300);
        }
      }, 800);
      timersRef.current.push(t5);
    }, 5800);
    timersRef.current.push(t4);

    return () => {
      clearAllTimers();
    };
  }, [isActive, reducedScareMode, prefersReducedMotion, handleSkipOrRecover, onComplete]);

  // Subtle cyclic counter in corruption phase
  useEffect(() => {
    if (step !== 'initial_interruption' && step !== 'escalating_corruption') return;
    const interval = setInterval(() => {
      setCycleCount((c) => c + 1);
    }, 110);
    return () => clearInterval(interval);
  }, [step]);

  // Keyboard Escape to quickly recover
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkipOrRecover();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleSkipOrRecover]);

  if (!isActive && step === 'idle') return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/92 backdrop-blur-md transition-opacity duration-300 ${
        step === 'resolved' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Dynamic Scanline & Tracking Overlays */}
      <div className="absolute inset-0 glitch-scanlines pointer-events-none opacity-45" />

      {/* VHS Horizontal Tracking Bar during interruption and corruption */}
      {(step === 'initial_interruption' || step === 'escalating_corruption') && (
        <div className="absolute inset-x-0 h-16 bg-white/5 pointer-events-none glitch-tracking-bar mix-blend-overlay" />
      )}

      {/* Screen Tearing during Phase 3 */}
      {step === 'escalating_corruption' && (
        <div className="absolute inset-0 glitch-tear pointer-events-none bg-red-950/15 mix-blend-screen" />
      )}

      {/* Main Forensic Malfunction Frame */}
      <div
        className={`relative max-w-xl w-full bg-[#0a0a09] border p-6 sm:p-8 shadow-[0_0_90px_rgba(180,20,20,0.45)] text-center transition-transform ${
          step === 'final_interruption'
            ? 'glitch-phosphor-collapse border-red-700 bg-black'
            : step === 'escalating_corruption'
            ? 'glitch-rgb border-red-700/80'
            : 'border-red-900/60'
        }`}
      >
        {/* Terminal Header Telemetry */}
        <div className="flex items-center justify-between border-b border-red-900/40 pb-3 mb-5 font-mono text-[11px] tracking-widest text-red-400 uppercase">
          <div className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-full ${
                step === 'escalating_corruption'
                  ? 'bg-red-500 animate-ping'
                  : step === 'recovery_attempt'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-red-600'
              }`}
            />
            <span>
              {step === 'escalating_corruption'
                ? `ANOMALOUS EMBARGO // HEX 0x17-${(cycleCount * 7) % 89}`
                : step === 'recovery_attempt'
                ? 'RESTORING TELEMETRY...'
                : 'DISPATCH INTERRUPT // SEQ 017'}
            </span>
          </div>
          <span>SEC-LVL 4</span>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center mb-4">
          {step === 'escalating_corruption' ? (
            <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse" />
          ) : step === 'recovery_attempt' ? (
            <Terminal className="w-12 h-12 text-amber-400" />
          ) : (
            <AlertTriangle className="w-12 h-12 text-red-400" />
          )}
        </div>

        {/* Narrative Title */}
        <h3 className="font-serif text-xl sm:text-2xl text-[#f4efe6] mb-2 tracking-wide">
          {step === 'final_interruption'
            ? 'TERMINAL POWER CUTOFF'
            : step === 'recovery_attempt'
            ? 'SIGNAL RECOVERY SUSPENDED'
            : step === 'escalating_corruption'
            ? 'ARCHIVAL TRANSMISSION EMBARGO'
            : 'ANOMALOUS CARRIER INTERRUPT'}
        </h3>

        {/* Dynamic Telemetry Narrative */}
        <p className="font-mono text-xs sm:text-sm text-red-300/90 tracking-wider mb-6 leading-relaxed glitch-corrupted-text">
          {telemetryText}
        </p>

        {/* Diagnostic Strip */}
        <div className="bg-[#050505] border border-stone-800 p-3 mb-6 text-left font-mono text-[10px] text-stone-400 space-y-1">
          <div className="flex justify-between">
            <span>REPOSITORY: CASE 17 // ELLEN VALE ARCHIVE</span>
            <span className="text-red-400 font-bold">{step.toUpperCase().replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span>DIRECTORATE PROTOCOL: EMBARGO ACTIVE</span>
            <span>CONTAINMENT: ENFORCED</span>
          </div>
        </div>

        {/* Safe Recovery Action */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSkipOrRecover}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-white font-mono text-xs tracking-wider transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>BYPASS INTERRUPT (ESC)</span>
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="flex items-center gap-2 px-3 py-2 text-stone-500 hover:text-stone-300 font-mono text-xs tracking-wider transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>DISMISS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
