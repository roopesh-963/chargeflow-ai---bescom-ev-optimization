import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Calendar,
  ChevronDown,
  FileText,
  Info,
  Menu,
  Map as MapIcon,
  PanelLeft,
  Settings,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { LiveIndicator } from '@/components/live/LiveIndicator';
import { useDashboardUI } from '@/context/DashboardUIContext';
import { useZone } from '@/context/ZoneContext';
import { getModelInfo, type ModelInfoResponse } from '@/lib/api';
import { bengaluruZones } from '@/data/bengaluruZones';
import { navItems, pageMeta, type DashboardPageId } from './dashboardData';

type SearchResult =
  | {
      id: string;
      type: 'page';
      label: string;
      description: string;
      pageId: DashboardPageId;
    }
  | {
      id: string;
      type: 'zone' | 'station' | 'poi';
      label: string;
      description: string;
      zone: string;
      pageId: DashboardPageId;
    };

interface HeaderProps {
  activePage: DashboardPageId;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleDesktopSidebar: () => void;
  onSelectPage: (page: DashboardPageId) => void;
}

function formatDateLabel(value: string) {
  if (!value) return 'Select date';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Select date';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(parsed);
}

function formatNotificationTime(value: string) {
  if (!value) return 'Pending';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Pending';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

function resultTypeLabel(type: SearchResult['type']) {
  if (type === 'page') return 'Page';
  if (type === 'zone') return 'Zone';
  if (type === 'station') return 'Station';
  return 'POI';
}

function notificationTone(severity: 'critical' | 'warning' | 'healthy' | 'info') {
  if (severity === 'critical') return 'border-red-500/20 bg-red-500/10 text-red-300';
  if (severity === 'warning') return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  if (severity === 'healthy') return 'border-cyber-green/20 bg-cyber-green/10 text-cyber-green';
  return 'border-electric-blue/20 bg-electric-blue/10 text-electric-blue';
}

function quickDate(offsetDays: number) {
  const next = new Date();
  next.setDate(next.getDate() + offsetDays);
  const offsetMs = next.getTimezoneOffset() * 60 * 1000;
  return new Date(next.getTime() - offsetMs).toISOString().slice(0, 10);
}

export default function Header({
  activePage,
  isSidebarCollapsed,
  onToggleSidebar,
  onToggleDesktopSidebar,
  onSelectPage,
}: HeaderProps) {
  const { user, role } = useAuth();
  const meta = pageMeta[activePage];
  const { selectedZone, setSelectedZone, zones } = useZone();
  const {
    notifications,
    unreadCount,
    selectedDate,
    setSelectedDate,
    markAllNotificationsRead,
    markNotificationRead,
    operatorProfile,
    updateOperatorProfile,
    setCopilotDraft,
  } = useDashboardUI();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(operatorProfile);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const dateRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const safeZones = useMemo(
    () =>
      Array.isArray(zones) && zones.length > 0
        ? zones.filter((zone): zone is string => typeof zone === 'string' && zone.trim().length > 0)
        : ['All Zones'],
    [zones],
  );

  const resolvedSelectedZone = safeZones.includes(selectedZone) ? selectedZone : (safeZones[0] ?? 'All Zones');
  const hasSpecificZone = resolvedSelectedZone !== 'All Zones';
  const zoneMetadata = useMemo(() => new Map(bengaluruZones.map((zone) => [zone.name, zone])), []);

  const searchResults = useMemo<SearchResult[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const pages: SearchResult[] = navItems.map((item) => ({
      id: `page-${item.id}`,
      type: 'page',
      label: item.label,
      description: pageMeta[item.id].description,
      pageId: item.id,
    }));

    const zoneResults: SearchResult[] = safeZones.map((zoneName) => {
      const zone = zoneMetadata.get(zoneName);
      return {
        id: `zone-${zoneName}`,
        type: 'zone',
        label: zoneName,
        description: zone
          ? `${zone.ward} ward | ${zone.chargers} chargers | ${zone.ev_users.toLocaleString('en-IN')} EV users`
          : 'Available dashboard zone scope',
        zone: zoneName,
        pageId: 'overview',
      };
    });

    const stationResults: SearchResult[] = bengaluruZones.flatMap((zone) =>
      zone.existing_stations.map((station) => ({
        id: `station-${zone.name}-${station.name}`,
        type: 'station',
        label: station.name,
        description: `${zone.name} | ${station.chargers} chargers installed`,
        zone: zone.name,
        pageId: 'gridstress',
      })),
    );

    const poiResults: SearchResult[] = bengaluruZones.flatMap((zone) =>
      zone.major_poi.map((poi) => ({
        id: `poi-${zone.name}-${poi}`,
        type: 'poi',
        label: poi,
        description: `${zone.name} point of interest`,
        zone: zone.name,
        pageId: 'planner',
      })),
    );

    const combined = [...zoneResults, ...stationResults, ...poiResults, ...pages];
    if (!normalizedQuery) return combined.slice(0, 8);

    return combined
      .filter((item) =>
        `${item.label} ${item.description} ${item.type} ${'zone' in item ? item.zone : ''}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 8);
  }, [query, safeZones, zoneMetadata]);

  useEffect(() => {
    setActiveResultIndex(0);
  }, [query]);

  useEffect(() => {
    setProfileDraft((current) => ({
      ...current,
      ...operatorProfile,
      name: user?.username ?? operatorProfile.name,
      role: role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : operatorProfile.role,
    }));
  }, [operatorProfile, role, user?.username]);

  useEffect(() => {
    let cancelled = false;

    async function loadModelInfo() {
      try {
        const payload = await getModelInfo();
        if (!cancelled) {
          setModelInfo(payload);
        }
      } catch {
        if (!cancelled) {
          setModelInfo(null);
        }
      }
    }

    void loadModelInfo();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (dateRef.current && !dateRef.current.contains(target)) setIsDateOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(target)) setIsNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
        setIsEditingProfile(false);
        setProfileDraft(operatorProfile);
      }
    }

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const datePresets = [
    { label: 'Today', value: quickDate(0) },
    { label: 'Tomorrow', value: quickDate(1) },
    { label: 'Next Week', value: quickDate(7) },
  ];

  function handleSearchSelection(result: SearchResult) {
    if (result.type === 'page') {
      onSelectPage(result.pageId);
    } else {
      setSelectedZone(result.zone);
      onSelectPage(result.pageId);
    }
    setQuery('');
    setSearchOpen(false);
  }

  function handleNotificationOpen(notificationId: string, pageId: DashboardPageId, zone?: string) {
    if (zone) setSelectedZone(zone);
    markNotificationRead(notificationId);
    setIsNotificationsOpen(false);
    onSelectPage(pageId);
  }

  function saveProfile() {
    updateOperatorProfile(profileDraft);
    setIsEditingProfile(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#04080e] px-4 py-3 backdrop-blur-md md:px-5 md:py-2.5 xl:px-6 2xl:px-8">
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex min-h-10 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="glass h-10 w-10 shrink-0 rounded-xl border-white/5 text-slate-300 hover:text-white"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <BrandLogo imageClassName="h-8" />
            <div className="truncate text-sm font-semibold text-white">{meta.title}</div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="scale-[0.9]">
              <LiveIndicator />
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen((current) => !current)}
              className="rounded-xl border border-white/8 bg-white/[0.03] p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectPage('alerts')}
              className="relative rounded-xl border border-white/8 bg-white/[0.03] p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
              aria-label="Open alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[9px] font-bold text-white">
                  {Math.min(unreadCount, 9)}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
              className="rounded-xl border border-white/8 bg-white/[0.03] p-1 text-slate-300 transition hover:bg-white/5 hover:text-white"
              aria-label="Open profile"
            >
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-electric-blue/20 text-xs text-electric-blue">
                  {(user?.username ?? operatorProfile.name).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div ref={searchRef} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActiveResultIndex((current) => Math.min(current + 1, Math.max(searchResults.length - 1, 0)));
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveResultIndex((current) => Math.max(current - 1, 0));
                }
                if (event.key === 'Enter' && searchResults[activeResultIndex]) {
                  event.preventDefault();
                  handleSearchSelection(searchResults[activeResultIndex]);
                }
              }}
              placeholder="Search zones, pages, stations..."
              className="h-10 w-full rounded-xl border-white/5 bg-white/5 pl-10 text-sm text-white focus:border-electric-blue/50 focus:ring-0"
            />

            <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#07101a]/95 shadow-[0_20px_80px_-32px_rgba(0,112,255,0.9)] backdrop-blur-xl">
              <div className="max-h-[240px] overflow-y-auto p-2">
                {searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => handleSearchSelection(result)}
                      className={`mb-1 flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-3 text-left transition ${
                        index === activeResultIndex
                          ? 'bg-electric-blue/12 text-white'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{result.label}</div>
                        <div className="mt-1 text-xs text-slate-400">{result.description}</div>
                      </div>
                      <Badge className="border-0 bg-white/5 text-[10px] text-slate-300">{resultTypeLabel(result.type)}</Badge>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-5 text-sm text-slate-400">No results found for "{query}".</div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className="relative">
            <MapIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-electric-blue" />
            <select
              value={resolvedSelectedZone}
              onChange={(event) => setSelectedZone(event.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-white/5 bg-white/5 pl-10 pr-10 text-sm font-medium text-white outline-none transition hover:border-white/10 focus:border-electric-blue/50"
            >
              {safeZones.map((zone) => (
                <option key={zone} value={zone} className="bg-obsidian text-white">
                  {zone}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <label className="flex h-10 items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 text-xs font-medium text-slate-200">
            <Calendar className="h-4 w-4 text-electric-blue" />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                if (event.target.value) setSelectedDate(event.target.value);
              }}
              className="w-[118px] bg-transparent text-xs text-slate-200 outline-none [color-scheme:dark]"
            />
          </label>
        </div>

        {isProfileOpen ? (
          <div ref={profileRef} className="rounded-2xl border border-white/10 bg-[#07101a]/95 p-4 shadow-[0_20px_80px_-32px_rgba(0,112,255,0.9)] backdrop-blur-xl">
            <div className="mb-4 flex items-start gap-3">
              <Avatar className="h-11 w-11 border border-white/10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-electric-blue/20 text-electric-blue">
                  {(user?.username ?? operatorProfile.name).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{user?.username ?? operatorProfile.name}</div>
                <div className="text-xs text-slate-400">{role ?? operatorProfile.role}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyber-green">
                  {operatorProfile.status}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCopilotDraft(`Give ${operatorProfile.name} a concise operator briefing for ${resolvedSelectedZone}.`);
                  setIsProfileOpen(false);
                  onSelectPage('copilot');
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm text-slate-200 transition hover:text-white"
              >
                Brief Me
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onSelectPage('reports');
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm text-slate-200 transition hover:text-white"
              >
                Reports
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onSelectPage('settings');
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm text-slate-200 transition hover:text-white"
              >
                Settings
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="hidden md:flex md:flex-col md:gap-3">
        <div className="flex min-h-12 flex-wrap items-start justify-between gap-3 xl:min-h-14 xl:flex-nowrap xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDesktopSidebar}
              className="glass h-9 w-9 shrink-0 rounded-xl border-white/5 text-slate-300 hover:text-white"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <BrandLogo imageClassName="h-9" />
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-electric-blue">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{meta.accent}</span>
                </div>
              </div>
              <div className="mt-0.5 truncate text-[11px] text-slate-400">{meta.title}</div>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-2.5 py-1.5">
              <LiveIndicator />
              <div className="group relative">
                <Badge
                  variant="outline"
                  className="items-center gap-1.5 border-cyber-green/20 bg-cyber-green/10 px-2.5 py-1 font-mono text-[10px] text-cyber-green"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-cyber-green" />
                  {meta.confidence}% MODEL
                  <Info className="h-3 w-3 text-cyber-green/80" />
                </Badge>
                <div className="pointer-events-none absolute right-0 top-[calc(100%+0.65rem)] hidden w-[270px] rounded-2xl border border-white/10 bg-[#07101a]/95 p-3 text-left shadow-[0_20px_80px_-32px_rgba(0,112,255,0.9)] backdrop-blur-xl group-hover:block">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    System Info
                  </div>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Model</span>
                      <span>GradientBoostingRegressor</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Test R²</span>
                      <span>{modelInfo ? modelInfo.test_r2.toFixed(4) : 'Loading...'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Zones</span>
                      <span>7</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Optimizer</span>
                      <span>scipy LP (HiGHS)</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Explainability</span>
                      <span>SHAP</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Data</span>
                      <span>Synthetic (Bengaluru patterns)</span>
                    </div>
                  </div>
                </div>
              </div>
              <Badge className="border border-electric-blue/20 bg-electric-blue/10 px-2.5 py-1 text-[10px] text-electric-blue">
                LP Optimizer
              </Badge>
              <Badge className="border border-teal-400/20 bg-teal-400/10 px-2.5 py-1 text-[10px] text-teal-300">
                GBR Model
              </Badge>
              <Badge className="border border-fuchsia-400/20 bg-fuchsia-400/10 px-2.5 py-1 text-[10px] text-fuchsia-300">
                SHAP Explained
              </Badge>
            </div>

            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((current) => !current)}
                className="relative rounded-xl p-1.5 transition-colors hover:bg-white/5"
                aria-label="Open notifications"
              >
                <Bell className="h-4.5 w-4.5 text-slate-400" />
                {unreadCount > 0 ? (
                  <>
                    <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-obsidian bg-red-500" />
                    <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {Math.min(unreadCount, 9)}
                    </span>
                  </>
                ) : null}
              </button>

              {isNotificationsOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-[#07101a]/95 shadow-[0_20px_80px_-32px_rgba(0,112,255,0.9)] backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Notifications</div>
                      <div className="text-xs text-slate-500">{unreadCount} unread alerts and updates</div>
                    </div>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-blue"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto p-2">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationOpen(notification.id, notification.pageId, notification.zone)}
                          className={`mb-2 w-full rounded-2xl border p-3 text-left transition ${
                            notification.read
                              ? 'border-white/8 bg-white/[0.03]'
                              : 'border-electric-blue/15 bg-electric-blue/8'
                          }`}
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-white">{notification.title}</div>
                              <div className="mt-1 text-sm text-slate-400">{notification.description}</div>
                            </div>
                            <Badge className={notificationTone(notification.severity)}>{notification.severity}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{notification.zone ?? 'Network-wide'}</span>
                            <span>{formatNotificationTime(notification.createdAt)}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-sm text-slate-400">
                        No notifications yet. Live backend alerts will appear here.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((current) => !current)}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-1.5 transition hover:border-white/15 hover:bg-white/[0.05]"
              >
                <div className="hidden min-w-0 text-right xl:block">
                  <div className="truncate text-xs font-bold leading-tight text-white">{user?.username ?? operatorProfile.name}</div>
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <Badge className="bg-electric-blue/10 text-[9px] uppercase text-electric-blue">
                      {role ?? 'guest'}
                    </Badge>
                    {role === 'operator' ? (
                      <Badge className="bg-cyber-green/10 text-[9px] uppercase text-cyber-green">
                        Operator View
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <Avatar className="h-9 w-9 shrink-0 border border-white/10">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-electric-blue/20 text-electric-blue">
                    {(user?.username ?? operatorProfile.name).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>

              {isProfileOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[360px] rounded-3xl border border-white/10 bg-[#07101a]/95 p-4 shadow-[0_20px_80px_-32px_rgba(0,112,255,0.9)] backdrop-blur-xl">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-white/10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-electric-blue/20 text-electric-blue">
                          {(user?.username ?? operatorProfile.name).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-semibold text-white">{user?.username ?? operatorProfile.name}</div>
                        <div className="text-xs text-slate-400">{role ?? operatorProfile.role}</div>
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyber-green">
                          {operatorProfile.status}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile((current) => !current);
                        setProfileDraft(operatorProfile);
                      }}
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-blue"
                    >
                      {isEditingProfile ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {isEditingProfile ? (
                    <div className="space-y-3">
                      <Input
                        value={profileDraft.name}
                        onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Name"
                        className="rounded-2xl bg-white/5"
                      />
                      <Input
                        value={profileDraft.role}
                        onChange={(event) => setProfileDraft((current) => ({ ...current, role: event.target.value }))}
                        placeholder="Role"
                        className="rounded-2xl bg-white/5"
                      />
                      <Input
                        value={profileDraft.desk}
                        onChange={(event) => setProfileDraft((current) => ({ ...current, desk: event.target.value }))}
                        placeholder="Desk"
                        className="rounded-2xl bg-white/5"
                      />
                      <Input
                        value={profileDraft.email}
                        onChange={(event) => setProfileDraft((current) => ({ ...current, email: event.target.value }))}
                        placeholder="Email"
                        className="rounded-2xl bg-white/5"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={profileDraft.phone}
                          onChange={(event) => setProfileDraft((current) => ({ ...current, phone: event.target.value }))}
                          placeholder="Phone"
                          className="rounded-2xl bg-white/5"
                        />
                        <select
                          value={profileDraft.status}
                          onChange={(event) =>
                            setProfileDraft((current) => ({
                              ...current,
                              status: event.target.value as typeof profileDraft.status,
                            }))
                          }
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        >
                          <option value="online">online</option>
                          <option value="focus">focus</option>
                          <option value="offline">offline</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileDraft(operatorProfile);
                          }}
                          className="rounded-2xl"
                        >
                          Reset
                        </Button>
                        <Button type="button" onClick={saveProfile} className="rounded-2xl bg-electric-blue text-white">
                          Save Profile
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Desk</div>
                          <div className="mt-1 text-sm text-white">{operatorProfile.desk}</div>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Shift</div>
                          <div className="mt-1 text-sm text-white">{operatorProfile.shift}</div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm text-slate-300">
                        <div>{operatorProfile.email}</div>
                        <div className="mt-1">{operatorProfile.phone}</div>
                        <div className="mt-2 text-xs text-slate-500">
                          Current scope: {resolvedSelectedZone} | Date: {formatDateLabel(selectedDate)}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCopilotDraft(`Give ${operatorProfile.name} a concise operator briefing for ${resolvedSelectedZone}.`);
                            setIsProfileOpen(false);
                            onSelectPage('copilot');
                          }}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 transition hover:text-white"
                        >
                          <UserRound className="mx-auto mb-1 h-4 w-4 text-electric-blue" />
                          Brief Me
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            onSelectPage('reports');
                          }}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 transition hover:text-white"
                        >
                          <FileText className="mx-auto mb-1 h-4 w-4 text-electric-blue" />
                          Reports
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            onSelectPage('settings');
                          }}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 transition hover:text-white"
                        >
                          <Settings className="mx-auto mb-1 h-4 w-4 text-electric-blue" />
                          Settings
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div ref={searchRef} className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <Input
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setSearchOpen(true);
                  setActiveResultIndex((current) => Math.min(current + 1, Math.max(searchResults.length - 1, 0)));
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveResultIndex((current) => Math.max(current - 1, 0));
                }
                if (event.key === 'Enter' && searchResults[activeResultIndex]) {
                  event.preventDefault();
                  handleSearchSelection(searchResults[activeResultIndex]);
                }
                if (event.key === 'Escape') {
                  setSearchOpen(false);
                }
              }}
              placeholder="Search zones, pages, stations..."
              className="h-9 w-full rounded-xl border-white/5 bg-white/5 pl-9 text-xs text-white focus:border-electric-blue/50 focus:ring-0 xl:text-sm"
            />

            {searchOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.65rem)] z-50 overflow-hidden rounded-3xl border border-white/10 bg-[#07101a]/95 shadow-[0_20px_80px_-32px_rgba(0,112,255,0.9)] backdrop-blur-xl">
                <div className="border-b border-white/8 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Search Results
                </div>
                <div className="max-h-[360px] overflow-y-auto p-2">
                  {searchResults.length > 0 ? (
                    searchResults.map((result, index) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSearchSelection(result)}
                        className={`flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-3 text-left transition ${
                          index === activeResultIndex
                            ? 'bg-electric-blue/12 text-white'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{result.label}</div>
                          <div className="mt-1 text-sm text-slate-400">{result.description}</div>
                        </div>
                        <Badge className="border-0 bg-white/5 text-slate-300">{resultTypeLabel(result.type)}</Badge>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-5 text-sm text-slate-400">
                      No results found for "{query}".
                    </div>
                  )}
                </div>
              </div>
              ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-end gap-3 xl:justify-end">
            <div className="w-full min-w-[220px] flex-1 xl:w-[220px] xl:flex-none">
              <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                <span>Zone Scope</span>
                <span
                  className={`h-2 w-2 rounded-full bg-cyber-green transition-opacity ${hasSpecificZone ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>
              <div className="relative">
                <MapIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-electric-blue" />
                <select
                  value={resolvedSelectedZone}
                  onChange={(event) => setSelectedZone(event.target.value)}
                  className="h-9 w-full appearance-none rounded-xl border border-white/5 bg-white/5 pl-9 pr-9 text-xs font-medium text-white outline-none transition hover:border-white/10 focus:border-electric-blue/50 xl:text-sm"
                >
                  {safeZones.map((zone) => (
                    <option key={zone} value={zone} className="bg-obsidian text-white">
                      {zone}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div ref={dateRef} className="relative w-full min-w-[190px] flex-1 xl:w-[190px] xl:flex-none 2xl:w-[210px]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDateOpen((current) => !current)}
                className="glass h-9 w-full justify-start rounded-xl border-white/5 px-3 text-slate-300 hover:text-white"
              >
                <Calendar className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                <span className="truncate text-xs font-medium xl:text-sm">{formatDateLabel(selectedDate)}</span>
              </Button>

              {isDateOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[320px] rounded-3xl border border-white/10 bg-[#07101a]/95 p-4 shadow-[0_20px_80px_-32px_rgba(0,112,255,0.9)] backdrop-blur-xl">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Operating Date
                  </div>
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {datePresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setSelectedDate(preset.value);
                          setIsDateOpen(false);
                        }}
                        className={`rounded-2xl border px-3 py-2 text-sm transition ${
                          selectedDate === preset.value
                            ? 'border-electric-blue/40 bg-electric-blue/10 text-white'
                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-slate-500">Select a date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => {
                      if (event.target.value) setSelectedDate(event.target.value);
                    }}
                    className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
