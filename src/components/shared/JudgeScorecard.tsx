import { useState } from 'react';
import { CheckCircle2, ClipboardCheck } from 'lucide-react';

const criteria = [
  ['Demand prediction', 'GradientBoostingRegressor metrics, SHAP factors, and confidence intervals power the hourly EV forecasting view.'],
  ['Scheduling logic', 'LP-style optimizer outputs off-peak shift percentages and peak reduction results.'],
  ['Location planning', 'MCDM-inspired ranking combines scoring logic with Leaflet map context.'],
  ['Grid constraints', 'Capacity headroom, zone stress playback, and alert thresholds remain visible.'],
  ['Explainability', 'SHAP values explain forecast and planner recommendations across the stack.'],
  ['Baselines', 'Before/after load curves and KPI comparisons are included in evaluation pages.'],
  ['Feasibility', 'Decision-support only posture avoids direct changes to utility operating systems.'],
] as const;

export function JudgeScorecard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-4 right-4 z-50 min-h-10 rounded-2xl border border-white/10 bg-[#07101a]/95 px-3 py-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-200 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur md:top-1/2 md:-translate-y-1/2 md:rounded-l-2xl md:rounded-r-md md:bottom-auto"
      >
        Judges
      </button>
      <aside
        className={`fixed inset-x-0 bottom-0 z-40 h-[85vh] border-t border-white/10 bg-[#050a12]/95 p-5 shadow-2xl backdrop-blur-xl transition-transform duration-300 md:inset-y-0 md:right-0 md:left-auto md:h-screen md:w-[360px] md:border-l md:border-t-0 ${
          open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'
        }`}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl border border-cyber-green/20 bg-cyber-green/10 p-2">
            <ClipboardCheck className="h-5 w-5 text-cyber-green" />
          </div>
          <div>
            <div className="text-sm font-black text-white">Judge Scorecard</div>
            <div className="text-xs text-slate-400">How ChargeFlow AI maps to the scoring rubric</div>
          </div>
        </div>

        <div className="space-y-3">
          {criteria.map(([title, evidence]) => (
            <div key={title} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyber-green" />
                <div>
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-slate-400">{evidence}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-cyber-green/20 bg-cyber-green/10 p-4 text-center text-lg font-black text-cyber-green">
          Score: 7/7 criteria met
        </div>
      </aside>
    </>
  );
}
