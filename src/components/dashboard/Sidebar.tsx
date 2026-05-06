import { motion } from 'motion/react';
import { ChevronsLeft, PanelLeftClose, ShieldAlert, Sparkles, Wand2 } from 'lucide-react';

import { BrandLogo } from '@/components/shared/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { useDashboardUI } from '@/context/DashboardUIContext';
import { useZone } from '@/context/ZoneContext';
import { cn } from '@/lib/utils';
import { getVisibleNavItems, type DashboardPageId } from './dashboardData';

interface SidebarProps {
  activePage: DashboardPageId;
  highlightedPage?: DashboardPageId | null;
  onSelectPage: (page: DashboardPageId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  activePage,
  highlightedPage = null,
  onSelectPage,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { role } = useAuth();
  const { setCopilotDraft } = useDashboardUI();
  const { selectedZone } = useZone();
  const visibleNavItems = role ? getVisibleNavItems(role) : [];
  const commandShortcuts = [
    {
      label: 'Risk Brief',
      icon: ShieldAlert,
      pageId: 'copilot' as DashboardPageId,
      prompt:
        selectedZone === 'All Zones'
          ? 'Give me the highest grid risk zones, likely causes, and operator actions for today.'
          : `Give me the latest grid risk brief for ${selectedZone}, likely causes, and operator actions for today.`,
    },
    {
      label: 'Planner Ask',
      icon: Wand2,
      pageId: 'copilot' as DashboardPageId,
      prompt:
        selectedZone === 'All Zones'
          ? 'Which zones should receive the next charger rollout and why?'
          : `Should ${selectedZone} receive additional chargers next, and why?`,
    },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/5 bg-[#03070d]/95 backdrop-blur-xl transition-transform duration-300 md:relative md:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        isCollapsed ? 'md:w-24' : 'md:w-72',
        'w-72',
      )}
    >
      <div className={cn('flex items-center gap-3 p-4 md:p-6', isCollapsed && 'md:justify-center md:px-3')}>
        <BrandLogo imageClassName={isCollapsed ? 'h-9' : 'h-10'} />
        {!isCollapsed ? (
          <>
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  onCloseMobile();
                  return;
                }
                onToggleCollapse();
              }}
              className="ml-auto min-h-10 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>

      {!isCollapsed ? (
        <div className="space-y-3 px-4 md:px-5">
          <button
            type="button"
            onClick={() => onSelectPage('overview')}
            className="w-full rounded-2xl border border-cyber-green/15 bg-cyber-green/10 p-3 text-left transition hover:border-cyber-green/30 hover:bg-cyber-green/12"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyber-green text-[8px] font-black uppercase tracking-[0.14em] text-[#041016]">
                BESCOM
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyber-green">Utility Partner</div>
                <div className="text-xs text-slate-300">Control tower live view</div>
                {role === 'operator' ? (
                  <div className="mt-1 inline-flex rounded-full border border-cyber-green/20 bg-cyber-green/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-cyber-green">
                    Operator View
                  </div>
                ) : null}
              </div>
            </div>
          </button>
          <div className="rounded-2xl border border-electric-blue/15 bg-electric-blue/10 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-electric-blue">
              <Sparkles className="h-4 w-4" />
              AI command layer
            </div>
            <div className="text-xs leading-relaxed text-slate-300">
              Live command launcher for copilot prompts, alerts review, and planning decisions across {selectedZone}.
            </div>
            <div className="mt-3 grid gap-2">
              {commandShortcuts.map((command) => (
                <button
                  key={command.label}
                  type="button"
                  onClick={() => {
                    setCopilotDraft(command.prompt);
                    onSelectPage(command.pageId);
                  }}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-slate-200 transition hover:border-electric-blue/30 hover:bg-white/[0.04] hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <command.icon className="h-3.5 w-3.5 text-electric-blue" />
                    <span>{command.label}</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Run
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden px-3 md:block">
          <button
            onClick={onToggleCollapse}
            className="flex min-h-10 w-full items-center justify-center rounded-2xl border border-electric-blue/15 bg-electric-blue/10 p-3 text-electric-blue transition hover:text-white"
            aria-label="Expand sidebar"
          >
            <ChevronsLeft className="h-4 w-4 rotate-180" />
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5">
        {visibleNavItems.map((item, i) => (
          <button
            key={item.id}
            type="button"
            data-demo-nav={item.id}
            onClick={() => onSelectPage(item.id)}
            className={cn(
              'group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
              activePage === item.id
                ? 'border border-electric-blue/20 bg-electric-blue/10 text-white shadow-[0_12px_40px_-18px_rgba(0,112,255,0.9)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
              highlightedPage === item.id && 'ring-2 ring-cyber-green/90 ring-offset-2 ring-offset-[#03070d] shadow-[0_0_0_1px_rgba(0,255,148,0.5),0_0_28px_rgba(0,255,148,0.35)]',
              isCollapsed && 'md:justify-center md:px-3',
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon
              className={cn(
                'h-5 w-5 transition-colors',
                activePage === item.id ? 'text-electric-blue' : 'text-slate-500 group-hover:text-white',
              )}
            />
            {!isCollapsed ? (
              <div className="flex flex-1 items-center justify-between">
                <span>{item.label}</span>
                {i < 5 ? <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">AI</span> : null}
              </div>
            ) : null}
          </button>
        ))}
      </nav>

      {!isCollapsed ? (
        <div className="p-4">
          <div className="glass rounded-3xl border-white/5 bg-gradient-to-br from-electric-blue/5 to-transparent p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-electric-blue">Grid Sync Status</div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-cyber-green" />
              <span className="text-xs font-medium text-white">BENGALURU_EAST.LIVE</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-electric-blue" />
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden p-3 md:block">
          <div className="glass flex items-center justify-center rounded-2xl border-white/5 bg-gradient-to-br from-electric-blue/5 to-transparent p-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-cyber-green" />
          </div>
        </div>
      )}
    </aside>
  );
}
