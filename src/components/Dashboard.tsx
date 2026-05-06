import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import Header from './dashboard/Header';
import Sidebar from './dashboard/Sidebar';
import { DashboardContent } from './dashboard/DashboardContent';
import {
  getDashboardPagePath,
  getDefaultPageForRole,
  isDashboardPageId,
  isPageVisibleForRole,
} from './dashboard/dashboardData';
import { DashboardUIProvider } from '@/context/DashboardUIContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const params = useParams<{ pageId?: string }>();
  const currentPageId = params.pageId ?? '';
  const activePage = isDashboardPageId(currentPageId) ? currentPageId : 'overview';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isDashboardPageId(currentPageId)) {
      navigate(getDashboardPagePath('overview'), { replace: true });
    }
  }, [currentPageId, navigate]);

  useEffect(() => {
    if (!role) return;
    if (isDashboardPageId(currentPageId) && !isPageVisibleForRole(currentPageId, role)) {
      navigate(getDashboardPagePath(getDefaultPageForRole(role)), { replace: true });
    }
  }, [currentPageId, navigate, role]);

  return (
    <DashboardUIProvider>
      <div className="relative flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(0,112,255,0.18),_transparent_24%),linear-gradient(180deg,#020408_0%,#04070d_60%,#020408_100%)] font-sans text-white selection:bg-electric-blue/30 dark">
        {isMobileSidebarOpen ? (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
          />
        ) : null}
        <Sidebar
          activePage={activePage}
          onSelectPage={(page) => {
            navigate(getDashboardPagePath(page));
            setIsMobileSidebarOpen(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            activePage={activePage}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsMobileSidebarOpen((current) => !current)}
            onToggleDesktopSidebar={() => setIsSidebarCollapsed((current) => !current)}
            onSelectPage={(page) => {
              navigate(getDashboardPagePath(page));
              setIsMobileSidebarOpen(false);
            }}
          />
          <ScrollArea className="min-h-0 flex-1">
            <div className="container-fluid max-w-[1680px]">
              <DashboardContent activePage={activePage} />
              <div className="flex flex-col gap-3 border-t border-white/5 bg-black/20 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-8">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  ChargeFlow AI &copy; 2026 // PAN IIT x BESCOM HACKATHON
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="flex min-h-10 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-white"
                >
                  Exit to Website
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                </button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </DashboardUIProvider>
  );
}
