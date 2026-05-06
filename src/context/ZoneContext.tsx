import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';

import { clearApiCache, getZones } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

export type ZoneContextType = {
  selectedZone: string;
  debouncedZone: string;
  setSelectedZone: (zone: string) => void;
  zones: string[];
};

const fallbackZones = [
  'All Zones',
  'Whitefield',
  'Koramangala',
  'Electronic City',
  'Hebbal',
  'Sarjapur',
  'Indiranagar',
  'Yelahanka',
  'HSR Layout',
  'Marathahalli',
  'Jayanagar',
  'Rajajinagar',
  'Banashankari',
];

export const ZoneContext = createContext<ZoneContextType | undefined>(undefined);

export function ZoneProvider({ children }: { children: ReactNode }) {
  const [selectedZone, setSelectedZone] = useState<string>('All Zones');
  const [zones, setZones] = useState<string[]>(fallbackZones);
  const hasMountedRef = useRef(false);
  const debouncedZone = useDebounce(selectedZone, 300);

  useEffect(() => {
    let cancelled = false;

    async function loadZones() {
      try {
        const backendZones = await getZones();
        if (!cancelled && backendZones.length > 0) {
          const normalizedZones = Array.from(
            new Set(
              backendZones.filter((zone): zone is string => typeof zone === 'string' && zone.trim().length > 0),
            ),
          );
          setZones(normalizedZones.length > 0 ? normalizedZones : fallbackZones);
        }
      } catch {
        if (!cancelled) {
          setZones(fallbackZones);
        }
      }
    }

    void loadZones();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (zones.length === 0) {
      if (selectedZone !== 'All Zones') {
        setSelectedZone('All Zones');
      }
      return;
    }

    if (!zones.includes(selectedZone)) {
      setSelectedZone(zones[0] ?? 'All Zones');
    }
  }, [selectedZone, zones]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    toast(`Viewing ${selectedZone} — data updated`, { icon: '📍' });
  }, [selectedZone]);

  const handleSetSelectedZone = (zone: string) => {
    clearApiCache();
    setSelectedZone(zone);
  };

  const value = useMemo<ZoneContextType>(
    () => ({
      selectedZone,
      debouncedZone,
      setSelectedZone: handleSetSelectedZone,
      zones: zones.length > 0 ? zones : fallbackZones,
    }),
    [debouncedZone, selectedZone, zones],
  );

  return <ZoneContext.Provider value={value}>{children}</ZoneContext.Provider>;
}

export function useZone() {
  const context = useContext(ZoneContext);
  if (!context) {
    throw new Error('useZone must be used within ZoneProvider');
  }
  return context;
}
