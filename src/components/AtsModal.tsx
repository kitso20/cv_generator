import React, { useMemo, useRef } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wand2,
  TrendingUp,
} from 'lucide-react';
import { ResumeData } from '../types/resume';
import { runAtsAudit, autoFormatForAts } from '../utils/atsAuditor';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface AtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeData;
  onUpdateResume: (updated: ResumeData) => void;
}

export const AtsModal: React.FC<AtsModalProps> = ({
  isOpen,
  onClose,
  resume,
  onUpdateResume,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useModalDismiss(isOpen, onClose, panelRef);

  // Audit is expensive (runs on every keystroke upstream) — compute only while visible.
  const report = useMemo(() => (isOpen ? runAtsAudit(resume) : null), [isOpen, resume]);

  if (!isOpen || !report) return null;

  const handleAutoFormat = () => {
    const formatted = autoFormatForAts(resume);
    onUpdateResume(formatted);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ats-audit-title"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="ats-audit-title" className="text-sm font-bold text-slate-900 dark:text-white">
                ATS Compatibility &amp; Parser Audit
              </h2>
              <p className="text-xs text-slate-500">
                Checked against common ATS parsing rules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer shrink-0"
            aria-label="Close ATS audit"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score Banner */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white shadow-md ${
                report.overallScore >= 85
                  ? 'bg-emerald-600'
                  : report.overallScore >= 70
                  ? 'bg-amber-600'
                  : 'bg-rose-600'
              }`}
            >
              <span className="text-2xl font-black font-mono leading-none">
                {report.overallScore}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                Grade {report.letterGrade}
              </span>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {report.overallScore >= 85
                  ? 'High ATS Pass Likelihood'
                  : report.overallScore >= 70
                  ? 'Moderate ATS Readiness'
                  : 'Requires Optimization for ATS'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {report.quantifiedPercentage}% quantified bullet points · {report.actionVerbPercentage}% strong action verbs
              </div>
            </div>
          </div>

          <button
            onClick={handleAutoFormat}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap w-full sm:w-auto"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Auto-Format for ATS</span>
          </button>
        </div>

        {/* Audit Checklist */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Algorithm Verification Checklist
          </div>

          <div className="space-y-2.5">
            {report.checklist.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                  item.status === 'passed'
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : item.status === 'warning'
                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {item.status === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : item.status === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-start sm:items-center justify-between gap-2">
                    <span>{item.title}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        item.status === 'passed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : item.status === 'warning'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Verbs Recommendation Drawer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Recommended High-Impact Action Verbs</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Start your bullet points with these action verbs to trigger resume parser scoring bumps:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {report.recommendedKeywords.map((word, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] border border-slate-200 dark:border-slate-700"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
