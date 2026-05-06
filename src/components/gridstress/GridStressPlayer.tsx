import { memo, useEffect, useMemo, useState } from 'react';
import { Activity, Pause, Play } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip as LeafletTooltip, useMap } from 'react-leaflet';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useZone } from '@/context/ZoneContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  bbmpWardBoundaries,
  bengaluruZones,
  type BengaluruZone,
  zoneStressCoordinates,
} from '@/data/bengaluruZones';
import {
  getGridStress,
  getPlanner,
  getWebSocketUrl,
  type GridStressSnapshot,
  type LiveSnapshot,
  type PlannerRecommendation,
} from '@/lib/api';

const speedOptions = [1, 2, 4] as const;

function markerColor(status: GridStressSnapshot['status']) {
  if (status === 'critical') return '#E24B4A';
  if (status === 'warning') return '#EF9F27';
  return '#1D9E75';
}

function markerClass(status: GridStressSnapshot['status']) {
  if (status === 'critical') return 'gridstress-pulse-critical';
  if (status === 'warning') return 'gridstress-pulse-warning';
  return '';
}

function incomeTone(income: BengaluruZone['avg_income']) {
  if (income === 'high') return 'bg-cyber-green/10 text-cyber-green';
  if (income === 'medium') return 'bg-electric-blue/10 text-electric-blue';
  return 'bg-amber-400/10 text-amber-200';
}

function MapViewport({ selectedZone }: { selectedZone: string }) {
  const map = useMap();

  useEffect(() => {
    if (selectedZone === 'All Zones') {
      map.flyTo([12.9716, 77.5946], 10.7, { duration: 1.1 });
      return;
    }

    const zone = bengaluruZones.find((item) => item.name === selectedZone);
    if (zone) {
      map.flyTo([zone.lat, zone.lon], 13, { duration: 1.1 });
    }
  }, [map, selectedZone]);

  return null;
}

function GridStressPlayerComponent() {
  const { selectedZone, debouncedZone } = useZone();
  const [snapshots, setSnapshots] = useState<GridStressSnapshot[]>([]);
  const [planner, setPlanner] = useState<PlannerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [currentHour, setCurrentHour] = useState(0);
  const [speed, setSpeed] = useState<(typeof speedOptions)[number]>(1);
  const [selectedZoneName, setSelectedZoneName] = useState<string>(bengaluruZones[0]?.name ?? 'Whitefield');
  const [reloadIndex, setReloadIndex] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth < 768);
  const [goLive, setGoLive] = useState(false);
  const { data: liveSnapshot, isConnected: isLiveConnected } = useWebSocket<LiveSnapshot>(getWebSocketUrl());

  useEffect(() => {
    function handleResize() {
      setIsMobileViewport(window.innerWidth < 768);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [stressResponse, plannerResponse] = await Promise.all([getGridStress(debouncedZone), getPlanner(debouncedZone)]);
        if (!cancelled) {
          setSnapshots(stressResponse);
          setPlanner(plannerResponse);
        }
      } catch {
        if (!cancelled) {
          toast.error('Failed to load grid stress simulation');
          setError(`Unable to load grid stress playback for ${debouncedZone}.`);
          setSnapshots([]);
          setPlanner([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [debouncedZone, reloadIndex]);

  useEffect(() => {
    setCurrentHour(0);
    if (debouncedZone !== 'All Zones') {
      setSelectedZoneName(debouncedZone);
    }
  }, [debouncedZone]);

  useEffect(() => {
    if (!playing || loading || snapshots.length === 0) return;

    const interval = window.setInterval(() => {
      setCurrentHour((hour) => (hour + 1) % 24);
    }, 800 / speed);

    return () => window.clearInterval(interval);
  }, [playing, speed, loading, snapshots.length]);

  useEffect(() => {
    if (goLive) {
      setPlaying(false);
    }
  }, [goLive]);

  const groupedByHour = useMemo(() => {
    return snapshots.reduce<Record<number, GridStressSnapshot[]>>((accumulator, snapshot) => {
      const bucket = accumulator[snapshot.hour] ?? [];
      bucket.push(snapshot);
      accumulator[snapshot.hour] = bucket;
      return accumulator;
    }, {});
  }, [snapshots]);

  const liveSnapshots = useMemo(
    () =>
      (liveSnapshot?.zones ?? []).map(
        (zone): GridStressSnapshot => ({
          hour: new Date(liveSnapshot?.timestamp ?? Date.now()).getHours(),
          zone_name: zone.name,
          demand_kw: zone.current_demand_kw,
          capacity_kw:
            bengaluruZones.find((item) => item.name === zone.name)?.grid_capacity_kw ??
            Math.max(zone.current_demand_kw, 1),
          stress_pct: zone.grid_stress_pct,
          status: zone.status,
        }),
      ),
    [liveSnapshot],
  );
  const currentSnapshots = goLive && liveSnapshots.length > 0 ? liveSnapshots : groupedByHour[currentHour] ?? [];
  const visibleStressSnapshots = isMobileViewport ? currentSnapshots.slice(0, 4) : currentSnapshots;
  const criticalCount = currentSnapshots.filter((snapshot) => snapshot.status === 'critical').length;
  const warningCount = currentSnapshots.filter((snapshot) => snapshot.status === 'warning').length;
  const focusedZoneName = selectedZone === 'All Zones' ? selectedZoneName : selectedZone;
  const focusedZone = bengaluruZones.find((zone) => zone.name === focusedZoneName) ?? bengaluruZones[0];
  const selectedRecommendation = planner.find((item) => item.zone === focusedZone?.name) ?? null;
  const zoneStressMarkers = useMemo(
    () =>
      currentSnapshots.map((snapshot) => {
        const coordinates = zoneStressCoordinates[snapshot.zone_name];
        if (!coordinates) return null;

        const isSelected = debouncedZone !== 'All Zones' && snapshot.zone_name === debouncedZone;
        const isMuted = debouncedZone !== 'All Zones' && snapshot.zone_name !== debouncedZone;

        return (
          <CircleMarker
            key={`${snapshot.hour}-${snapshot.zone_name}`}
            center={coordinates}
            radius={isSelected ? 26 : Math.max(10, Math.min(24, snapshot.stress_pct / 5))}
            eventHandlers={{
              click: () => setSelectedZoneName(snapshot.zone_name),
            }}
            pathOptions={{
              color: isSelected ? '#FFFFFF' : markerColor(snapshot.status),
              fillColor: markerColor(snapshot.status),
              fillOpacity: isMuted ? 0.18 : 0.35,
              opacity: isMuted ? 0.4 : 1,
              weight: isSelected ? 3 : 2,
              className: markerClass(snapshot.status),
            }}
          >
            <LeafletTooltip direction="top" offset={[0, -8]} opacity={1}>
              <div className="space-y-1 text-xs">
                <div className="font-semibold">{snapshot.zone_name}</div>
                <div>Demand: {snapshot.demand_kw.toFixed(1)} kW</div>
                <div>Capacity: {snapshot.capacity_kw.toFixed(1)} kW</div>
                <div>Stress: {snapshot.stress_pct.toFixed(1)}%</div>
              </div>
            </LeafletTooltip>
          </CircleMarker>
        );
      }),
    [currentSnapshots, debouncedZone],
  );
  const stationMarkers = useMemo(
    () =>
      bengaluruZones.flatMap((zone) =>
        zone.existing_stations.map((station) => (
          <CircleMarker
            key={`${zone.name}-${station.name}`}
            center={[station.lat, station.lon]}
            radius={8}
            eventHandlers={{
              click: () => setSelectedZoneName(zone.name),
            }}
            pathOptions={{
              color: '#38BDF8',
              fillColor: '#38BDF8',
              fillOpacity: debouncedZone !== 'All Zones' && zone.name !== debouncedZone ? 0.35 : 0.85,
              opacity: debouncedZone !== 'All Zones' && zone.name !== debouncedZone ? 0.4 : 1,
              weight: 1.5,
            }}
          >
            <LeafletTooltip direction="top" offset={[0, -8]} opacity={1}>
              <div className="space-y-1 text-xs">
                <div className="font-semibold">{station.name}</div>
                <div>{station.chargers} chargers</div>
              </div>
            </LeafletTooltip>
          </CircleMarker>
        )),
      ),
    [debouncedZone],
  );

  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadIndex((current) => current + 1)} />;
  }

  if (!loading && snapshots.length === 0) {
    return <EmptyState zone={selectedZone} message="No grid stress playback data is available for this selection." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="glass overflow-hidden border-white/8 bg-white/[0.03]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-electric-blue/80">
                Real-time control room simulation
              </div>
              <CardTitle className="text-lg font-black text-white">Bengaluru Grid Stress Playback</CardTitle>
            </div>
            <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] ${
              goLive && isLiveConnected
                ? 'border-cyber-green/20 bg-cyber-green/10 text-cyber-green'
                : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}>
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              {goLive && isLiveConnected ? 'Live' : 'Playback'}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonCard height="540px" />
            ) : (
              <div className="space-y-5">
                <div className="relative overflow-hidden rounded-[28px] border border-white/8">
                  <MapContainer
                    center={[12.9716, 77.5946]}
                    zoom={10.7}
                    scrollWheelZoom={false}
                    zoomControl={!isMobileViewport}
                    preferCanvas
                    className="h-[280px] w-full bg-[#07101a] md:h-[420px]"
                    style={{ touchAction: 'pan-y' }}
                  >
                    <MapViewport selectedZone={debouncedZone} />
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <GeoJSON
                      data={bbmpWardBoundaries}
                      style={(feature) => ({
                        color: feature?.properties.name === focusedZone?.ward ? '#00FF94' : '#7C8DA6',
                        weight: feature?.properties.name === focusedZone?.ward ? 2.2 : 1.2,
                        fillOpacity: 0.06,
                        fillColor: feature?.properties.name === focusedZone?.ward ? '#00FF94' : '#0070FF',
                      })}
                    />
                    {zoneStressMarkers}
                    {stationMarkers}
                  </MapContainer>
                  <div
                    className={`pointer-events-none absolute right-4 top-4 z-[500] rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] shadow-lg backdrop-blur ${
                      goLive && isLiveConnected
                        ? 'border-cyber-green/20 bg-[#09111a]/90 text-cyber-green'
                        : 'border-red-500/20 bg-[#09111a]/90 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 animate-pulse rounded-full ${
                          goLive && isLiveConnected ? 'bg-cyber-green' : 'bg-red-400'
                        }`}
                      />
                      {goLive && isLiveConnected ? 'Live' : 'Playback'}
                    </div>
                  </div>
                  <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-3xl border border-white/10 bg-[#09111a]/90 p-3 text-xs text-slate-200 shadow-lg backdrop-blur md:bottom-4 md:left-4 md:p-4">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Legend</div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#1D9E75]" />
                      Zone stress marker
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#38BDF8]" />
                      Existing station
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-3 w-6 rounded-full border border-slate-400 bg-white/5" />
                      BBMP ward boundary
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 rounded-[28px] border border-white/8 bg-black/20 p-4 md:p-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button
                      onClick={() => {
                        setGoLive(false);
                        setPlaying((current) => !current);
                      }}
                      className="rounded-2xl bg-electric-blue px-4 text-white hover:bg-electric-blue/90"
                    >
                      {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {playing ? 'Pause' : 'Play'}
                    </Button>
                    <Button
                      onClick={() => setGoLive((current) => !current)}
                      className={goLive ? 'rounded-2xl bg-cyber-green/15 px-4 text-cyber-green hover:bg-cyber-green/20' : 'rounded-2xl bg-white/10 px-4 text-white hover:bg-white/15'}
                    >
                      Go Live
                    </Button>
                    <Badge className="bg-white/5 text-slate-200">
                      {goLive && isLiveConnected ? 'LIVE' : `Hour ${currentHour.toString().padStart(2, '0')}`}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-500">
                      <span>{goLive ? 'Live stream' : 'Playback time'}</span>
                      <span>
                        {goLive && liveSnapshot?.timestamp
                          ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(liveSnapshot.timestamp))
                          : `${currentHour}:00`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={23}
                      value={currentHour}
                      onChange={(event) => setCurrentHour(Number(event.target.value))}
                      disabled={goLive}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-electric-blue disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Speed</div>
                    <select
                      value={speed}
                      onChange={(event) => setSpeed(Number(event.target.value) as (typeof speedOptions)[number])}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    >
                      {speedOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}x
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass overflow-hidden border-white/8 bg-white/[0.03]">
          <CardHeader>
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-electric-blue/80">
                Zone intelligence
              </div>
              <CardTitle className="text-lg font-black text-white">POI and Charger View</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <SkeletonCard height="110px" />
                <SkeletonCard height="110px" />
                <SkeletonCard height="110px" />
              </div>
            ) : (
              <ScrollArea className="max-h-[780px] pr-2">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Selected zone</div>
                      <div className="mt-2 text-xl font-black text-white md:text-3xl">{focusedZone.name}</div>
                      <div className="mt-1 text-sm text-slate-400">{focusedZone.ward} ward</div>
                    </div>
                    <Badge className={incomeTone(focusedZone.avg_income)}>{focusedZone.avg_income} income</Badge>
                  </div>
                </div>
                  <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-red-500/15 bg-red-500/10 p-4">
                    <div className="text-xs text-red-200">Population</div>
                    <div className="mt-1 text-xl font-black text-white md:text-3xl">{focusedZone.population.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="rounded-3xl border border-amber-400/15 bg-amber-400/10 p-4">
                    <div className="text-xs text-amber-200">Area</div>
                    <div className="mt-1 text-xl font-black text-white md:text-3xl">{focusedZone.area_sqkm} km2</div>
                  </div>
                </div>
                  <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-electric-blue/15 bg-electric-blue/10 p-4">
                    <div className="text-xs text-electric-blue">Current chargers</div>
                    <div className="mt-1 text-xl font-black text-white md:text-3xl">{focusedZone.chargers}</div>
                  </div>
                  <div className="rounded-3xl border border-cyber-green/15 bg-cyber-green/10 p-4">
                    <div className="text-xs text-cyber-green">Recommended new chargers</div>
                    <div className="mt-1 text-xl font-black text-white md:text-3xl">
                      {selectedRecommendation?.recommended_new_stations ?? 0}
                    </div>
                  </div>
                </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">Major POIs</div>
                  <div className="flex flex-wrap gap-2">
                    {focusedZone.major_poi.map((poi) => (
                      <Badge key={poi} className="bg-white/5 text-slate-200">
                        {poi}
                      </Badge>
                    ))}
                  </div>
                </div>
                  <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-red-500/15 bg-red-500/10 p-4">
                    <div className="text-xs text-red-200">Critical zones</div>
                    <div className="mt-1 text-xl font-black text-white md:text-3xl">{criticalCount}</div>
                  </div>
                  <div className="rounded-3xl border border-amber-400/15 bg-amber-400/10 p-4">
                    <div className="text-xs text-amber-200">Warning zones</div>
                    <div className="mt-1 text-xl font-black text-white md:text-3xl">{warningCount}</div>
                  </div>
                </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-slate-400">
                  Hour {currentHour.toString().padStart(2, '0')}:00 playback is live at {speed}x. Changing the global zone selector resets playback and refreshes the stress stream for the selected area.
                </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass overflow-hidden border-white/8 bg-white/[0.03]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-electric-blue/80">
                Zone-by-zone stress monitor
              </div>
              <CardTitle className="text-lg font-black text-white">Live Stress Percent by Zone</CardTitle>
            </div>
            <Badge className="bg-red-500/10 text-red-300">
              <Activity className="mr-2 h-4 w-4" />
              85% critical threshold
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonCard height="360px" />
          ) : (
            <div className="h-[180px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%" debounce={120}>
                <BarChart data={visibleStressSnapshots}>
                  <CartesianGrid stroke="#ffffff0b" vertical={false} />
                  <XAxis dataKey="zone_name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#081018', border: '1px solid #1e293b', borderRadius: '18px' }}
                    formatter={(value: number) => [`${Number(value).toFixed(1)}%`, 'Stress']}
                  />
                  <ReferenceLine y={85} stroke="#E24B4A" strokeDasharray="6 3" />
                  <Bar dataKey="stress_pct" radius={[10, 10, 0, 0]} isAnimationActive={false}>
                    {visibleStressSnapshots.map((snapshot) => (
                      <Cell
                        key={`${snapshot.zone_name}-${snapshot.hour}`}
                        fill={
                          selectedZone === 'All Zones' || snapshot.zone_name === selectedZone
                            ? markerColor(snapshot.status)
                            : '#475569'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const GridStressPlayer = memo(GridStressPlayerComponent);
