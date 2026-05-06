import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getWebSocketUrl, type LiveSnapshot, type LiveZoneSnapshot } from '@/lib/api';

type LiveFeedItem = LiveZoneSnapshot & {
  id: string;
  timestamp: string;
};

function statusTone(status: LiveZoneSnapshot['status']) {
  if (status === 'critical') return 'border-red-500/20 bg-red-500/10 text-red-300';
  if (status === 'warning') return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  return 'border-cyber-green/20 bg-cyber-green/10 text-cyber-green';
}

function formatTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Just now';
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(parsed);
}

export function LiveFeed() {
  const { data, isConnected } = useWebSocket<LiveSnapshot>(getWebSocketUrl());
  const [isOpen, setIsOpen] = useState(true);
  const [items, setItems] = useState<LiveFeedItem[]>([]);

  useEffect(() => {
    if (!data) return;
    const nextItems = data.zones.map((zone) => ({
      ...zone,
      id: `${data.timestamp}-${zone.name}`,
      timestamp: data.timestamp,
    }));

    setItems((current) => [...nextItems, ...current].slice(0, 20));
  }, [data]);

  const renderedItems = useMemo(() => items, [items]);

  return (
    <Card className="glass overflow-hidden border-white/8 bg-white/[0.03]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 md:p-6">
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-electric-blue/80">
            Live WebSocket stream
          </div>
          <CardTitle className="text-lg font-black text-white">Live Feed</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={isConnected ? 'bg-cyber-green/10 text-cyber-green' : 'bg-slate-500/10 text-slate-300'}>
            {isConnected ? 'Connected' : 'Offline'}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen((current) => !current)} className="rounded-2xl">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isOpen ? (
        <CardContent className="space-y-3 p-4 pt-0 md:p-6 md:pt-0">
          {renderedItems.length > 0 ? (
            renderedItems.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 opacity-100 transition-all duration-500 ease-out"
                style={{ transform: `translateY(${index === 0 ? 0 : 0}px)` }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {item.current_demand_kw.toFixed(2)} kW • {formatTime(item.timestamp)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={item.delta_from_last >= 0 ? 'bg-cyber-green/10 text-cyber-green' : 'bg-red-500/10 text-red-300'}>
                      {item.delta_from_last >= 0 ? '▲' : '▼'} {Math.abs(item.delta_from_last).toFixed(2)} kW
                    </Badge>
                    <Badge className={statusTone(item.status)}>{item.status}</Badge>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
              Waiting for live zone updates...
            </div>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}
