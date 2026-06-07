/**
 * WizardShell - Step indicator bar with Previous/Next navigation.
 * Wraps wizard step content and handles step transitions.
 */
import { WIZARD_STEPS } from '../../constants/defaults';
import { Button } from '../shared/Button';
import { Check } from 'lucide-react';

interface WizardShellProps {
  currentStep: number;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  stepError: string | null;
  saving: boolean;
  /** Optional extra action buttons rendered next to "下一步" */
  extraActions?: React.ReactNode;
  children: React.ReactNode;
}

export function WizardShell({ currentStep, onPrev, onNext, onSave, stepError, saving, extraActions, children }: WizardShellProps) {
  const isFirst = currentStep === 1;
  const isLast = currentStep === WIZARD_STEPS.length;

  return (
    <div>
      {/* Step indicator bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((step, i) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex items-center">
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                      ${isCurrent
                        ? 'bg-gradient-to-b from-indigo-400 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-110'
                        : isCompleted
                          ? 'bg-emerald-500/90 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-700/60 text-slate-500'
                      }`}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : step.id}
                  </div>
                  <span className={`mt-1.5 text-[11px] font-medium transition-colors duration-200
                    ${isCurrent ? 'text-indigo-300' : isCompleted ? 'text-emerald-400/70' : 'text-slate-600'}`}>
                    {step.label}
                  </span>
                </div>
                {/* Connector line */}
                {i < WIZARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 min-w-[16px] rounded-full transition-colors duration-500
                    ${isCompleted ? 'bg-emerald-500/50' : 'bg-slate-700/40'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {children}
      </div>

      {/* Error display */}
      {stepError && (
        <div className="mt-4 rounded-lg bg-red-900/20 border border-red-500/30 px-4 py-2.5 text-sm text-red-300 animate-scale-in">
          {stepError}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between border-t border-white/5 pt-6">
        <Button variant="ghost" onClick={onPrev} disabled={isFirst}>
          ← 上一步
        </Button>
        <div className="flex items-center gap-3">
          {extraActions}
          {isLast ? (
            <Button onClick={onSave} disabled={saving}>
              {saving ? '保存中...' : '保存卡片'}
            </Button>
          ) : (
            <Button onClick={onNext}>
              下一步 →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
