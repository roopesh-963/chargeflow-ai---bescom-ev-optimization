import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getWebSocketUrl, type LiveSnapshot } from '@/lib/api';

export function LiveIndicator() {
  const { isConnected } = useWebSocket<LiveSnapshot>(getWebSocketUrl());

  return (
    <Badge
      variant="outline"
      className={
        isConnected
          ? 'hidden items-center gap-1.5 border-cyber-green/20 bg-cyber-green/10 px-2 py-1 font-mono text-[10px] text-cyber-green xl:flex'
          : 'hidden items-center gap-1.5 border-slate-500/20 bg-slate-500/10 px-2 py-1 font-mono text-[10px] text-slate-300 xl:flex'
      }
    >
      <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'animate-pulse bg-cyber-green' : 'bg-slate-400'}`} />
      {isConnected ? 'LIVE' : 'Offline'}
    </Badge>
  );
}
