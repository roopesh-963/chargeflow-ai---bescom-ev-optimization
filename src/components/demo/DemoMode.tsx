import { useEffect, useMemo, useState } from 'react';
import { PlayCircle, SkipForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getDashboardPagePath, type DashboardPageId } from '@/components/dashboard/dashboardData';
import { Button } from '@/components/ui/button';

type DemoStep = {
  page: DashboardPageId;
  description: string;
};

const DEMO_STEP_DURATION_MS = 4000;

const demoSteps: DemoStep[] = [
  { page: 'overview', description: 'Dashboard — Live KPIs showing 7 Bengaluru zones monitored' },
  { page: 'forecast', description: 'Demand Forecast — GradientBoostingRegressor predicting hourly EV load' },
  { page: 'scheduling', description: 'Smart Scheduler — Off-peak shifting reduces peak by 34%' },
  { page: 'gridstress', description: 'Grid Stress Player — Real-time zone stress animation' },
  { page: 'planner', description: 'Infrastructure Planner — SHAP-explained station recommendations' },
  { page: 'adoption', description: 'Adoption Forecast — 12-month growth scenarios' },
  { page: 'copilot', description: 'AI Copilot — Structured BESCOM planning assistant' },
];

interface DemoModeProps {
  activePage: DashboardPageId;
  onHighlightPageChange: (page: DashboardPageId | null) => void;
}

export function DemoMode({ activePage, onHighlightPageChange }: DemoModeProps) {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = demoSteps[stepIndex];
  const progressLabel = useMemo(() => `${stepIndex + 1}/${demoSteps.length}`, [stepIndex]);

  useEffect(() => {
    if (!enabled) {
      onHighlightPageChange(null);
      return;
    }

    onHighlightPageChange(currentStep.page);
    if (activePage !== currentStep.page) {
      navigate(getDashboardPagePath(currentStep.page));
    }

    const timer = window.setTimeout(() => {
      setStepIndex((current) => {
        if (current >= demoSteps.length - 1) {
          setEnabled(false);
          return current;
        }
        return current + 1;
      });
    }, DEMO_STEP_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [activePage, currentStep.page, enabled, navigate, onHighlightPageChange]);

  function startDemo() {
    setStepIndex(0);
    setEnabled(true);
    navigate(getDashboardPagePath(demoSteps[0].page));
  }

  function stopDemo() {
    setEnabled(false);
    onHighlightPageChange(null);
  }

  function goToStep(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(demoSteps.length - 1, nextIndex));
    setStepIndex(boundedIndex);
    navigate(getDashboardPagePath(demoSteps[boundedIndex].page));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (enabled ? stopDemo() : startDemo())}
        className={`fixed bottom-5 left-5 z-50 flex min-h-10 items-center gap-2 rounded-full border px-4 py-3 text-sm font-bold shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur ${
          enabled
            ? 'border-cyber-green/30 bg-cyber-green/15 text-cyber-green'
            : 'border-white/10 bg-[#081019]/95 text-white'
        }`}
      >
        <PlayCircle className="h-4 w-4" />
        Demo Mode
      </button>

      {enabled ? (
        <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]">
          <div className="absolute inset-0 rounded-none border-0 bg-[#07101a]/95 p-4 shadow-[0_28px_80px_-32px_rgba(0,0,0,0.95)] md:left-1/2 md:top-24 md:h-auto md:w-[min(520px,calc(100vw-32px))] md:-translate-x-1/2 md:rounded-[28px] md:border md:border-white/10 md:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-electric-blue">Guided walkthrough</div>
                <div className="mt-1 text-lg font-black text-white">Step {stepIndex + 1}</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                {progressLabel}
              </div>
            </div>

            <div className="rounded-3xl border border-cyber-green/15 bg-cyber-green/10 p-4 text-sm leading-relaxed text-slate-100">
              {currentStep.description}
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
              <div className="text-xs text-slate-400">The matching sidebar page is highlighted and auto-opened every 4 seconds.</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => goToStep(stepIndex - 1)}
                  disabled={stepIndex === 0}
                  className="rounded-2xl bg-white/10 text-white hover:bg-white/15 disabled:opacity-40"
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  onClick={() => goToStep(stepIndex + 1)}
                  disabled={stepIndex === demoSteps.length - 1}
                  className="rounded-2xl bg-electric-blue text-white hover:bg-electric-blue/90 disabled:opacity-40"
                >
                  Next
                </Button>
                <Button type="button" onClick={stopDemo} className="rounded-2xl bg-transparent text-slate-300 hover:bg-white/5">
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
