import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { DashboardPageId } from '@/components/dashboard/dashboardData';
import { useAuth } from '@/context/AuthContext';

export type NotificationSeverity = 'critical' | 'warning' | 'healthy' | 'info';

export type DashboardNotification = {
  id: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  zone?: string;
  pageId: DashboardPageId;
  createdAt: string;
  read: boolean;
};

export type OperatorProfile = {
  name: string;
  role: string;
  desk: string;
  email: string;
  phone: string;
  shift: string;
  status: 'online' | 'focus' | 'offline';
};

export type OptimizationMode = 'Grid-constrained hybrid' | 'Peak reduction first' | 'Planner-first';

export type GovernanceSettings = {
  decisionSupportOnly: boolean;
  syntheticMaskedData: boolean;
  explainableOutputs: boolean;
  offPeakAlignment: boolean;
  alertThreshold: number;
  optimizationMode: OptimizationMode;
};

type DashboardUIContextType = {
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  notifications: DashboardNotification[];
  unreadCount: number;
  replaceNotifications: (nextNotifications: DashboardNotification[]) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  operatorProfile: OperatorProfile;
  updateOperatorProfile: (nextProfile: Partial<OperatorProfile>) => void;
  governanceSettings: GovernanceSettings;
  updateGovernanceSettings: (nextSettings: Partial<GovernanceSettings>) => void;
  resetGovernanceSettings: () => void;
  copilotDraft: string;
  setCopilotDraft: (value: string) => void;
};

const DashboardUIContext = createContext<DashboardUIContextType | undefined>(undefined);
const governanceStorageKey = 'chargeflow-governance-settings';

const defaultGovernanceSettings: GovernanceSettings = {
  decisionSupportOnly: true,
  syntheticMaskedData: true,
  explainableOutputs: true,
  offPeakAlignment: true,
  alertThreshold: 82,
  optimizationMode: 'Grid-constrained hybrid',
};

function todayIsoDate() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function readGovernanceSettings() {
  if (typeof window === 'undefined') {
    return defaultGovernanceSettings;
  }

  try {
    const raw = window.localStorage.getItem(governanceStorageKey);
    if (!raw) {
      return defaultGovernanceSettings;
    }

    const parsed = JSON.parse(raw) as Partial<GovernanceSettings>;
    return {
      ...defaultGovernanceSettings,
      ...parsed,
      alertThreshold:
        typeof parsed.alertThreshold === 'number'
          ? Math.max(50, Math.min(99, Math.round(parsed.alertThreshold)))
          : defaultGovernanceSettings.alertThreshold,
      optimizationMode:
        parsed.optimizationMode === 'Peak reduction first' || parsed.optimizationMode === 'Planner-first'
          ? parsed.optimizationMode
          : defaultGovernanceSettings.optimizationMode,
    };
  } catch {
    return defaultGovernanceSettings;
  }
}

export function DashboardUIProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayIsoDate);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [copilotDraft, setCopilotDraft] = useState('');
  const [operatorProfile, setOperatorProfile] = useState<OperatorProfile>({
    name: 'Roopesh G',
    role: 'Grid Strategy Lead',
    desk: 'BESCOM Strategy Desk',
    email: 'roopesh.g@chargeflow.ai',
    phone: '+91 80 4600 2231',
    shift: 'Day Shift',
    status: 'online',
  });
  const [governanceSettings, setGovernanceSettings] = useState<GovernanceSettings>(readGovernanceSettings);

  useEffect(() => {
    window.localStorage.setItem(governanceStorageKey, JSON.stringify(governanceSettings));
  }, [governanceSettings]);

  const replaceNotifications = useCallback((nextNotifications: DashboardNotification[]) => {
    setNotifications((current) => {
      const readState = new Map(current.map((item) => [item.id, item.read]));
      return nextNotifications.map((item) => ({
        ...item,
        read: readState.get(item.id) ?? item.read,
      }));
    });
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const updateOperatorProfile = useCallback((nextProfile: Partial<OperatorProfile>) => {
    setOperatorProfile((current) => ({ ...current, ...nextProfile }));
  }, []);

  const updateGovernanceSettings = useCallback((nextSettings: Partial<GovernanceSettings>) => {
    setGovernanceSettings((current) => ({
      ...current,
      ...nextSettings,
      alertThreshold:
        typeof nextSettings.alertThreshold === 'number'
          ? Math.max(50, Math.min(99, Math.round(nextSettings.alertThreshold)))
          : current.alertThreshold,
    }));
  }, []);

  const resetGovernanceSettings = useCallback(() => {
    setGovernanceSettings(defaultGovernanceSettings);
  }, []);

  const value = useMemo<DashboardUIContextType>(
    () => ({
      selectedDate,
      setSelectedDate,
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      replaceNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      operatorProfile: {
        ...operatorProfile,
        name: user?.username ?? operatorProfile.name,
        role: role ? `${role.charAt(0).toUpperCase()} access` : operatorProfile.role,
      },
      updateOperatorProfile,
      governanceSettings,
      updateGovernanceSettings,
      resetGovernanceSettings,
      copilotDraft,
      setCopilotDraft,
    }),
    [
      copilotDraft,
      governanceSettings,
      markAllNotificationsRead,
      markNotificationRead,
      notifications,
      operatorProfile,
      replaceNotifications,
      role,
      selectedDate,
      resetGovernanceSettings,
      updateGovernanceSettings,
      updateOperatorProfile,
      user?.username,
    ],
  );

  return <DashboardUIContext.Provider value={value}>{children}</DashboardUIContext.Provider>;
}

export function useDashboardUI() {
  const context = useContext(DashboardUIContext);
  if (!context) {
    throw new Error('useDashboardUI must be used within DashboardUIProvider');
  }
  return context;
}
