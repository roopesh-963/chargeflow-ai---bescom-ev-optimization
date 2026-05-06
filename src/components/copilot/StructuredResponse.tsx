import { CheckCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StructuredCopilotResponse } from '@/lib/api';


function severityStyles(severity: StructuredCopilotResponse['severity']) {
  if (severity === 'critical') {
    return 'border-red-500/20 bg-red-500/10 text-red-300';
  }
  if (severity === 'warning') {
    return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  }
  return 'border-teal-400/20 bg-teal-400/10 text-teal-200';
}

export function StructuredResponse({
  structured,
  fallbackText,
}: {
  structured: StructuredCopilotResponse | null | undefined;
  fallbackText: string;
}) {
  if (!structured) {
    return <div className="text-sm leading-relaxed text-slate-200">{fallbackText}</div>;
  }

  const confidencePercent = Math.round(Math.max(0, Math.min(1, structured.confidence)) * 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-base font-semibold leading-relaxed text-white">{structured.answer || fallbackText}</div>
        <Badge className={cn('capitalize', severityStyles(structured.severity))}>{structured.severity}</Badge>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Confidence</span>
          <span>{confidencePercent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-cyber-green transition-all" style={{ width: `${confidencePercent}%` }} />
        </div>
      </div>

      {structured.zones_affected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {structured.zones_affected.map((zone) => (
            <Badge key={zone} className="bg-white/5 text-slate-300">
              {zone}
            </Badge>
          ))}
        </div>
      ) : null}

      {structured.action_items.length > 0 ? (
        <ol className="space-y-2">
          {structured.action_items.map((item, index) => (
            <li key={`${index}-${item}`} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-3 text-sm text-slate-200">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyber-green/15 text-cyber-green">
                <CheckCheck className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="mr-2 text-xs font-semibold text-slate-400">{index + 1}.</span>
                {item}
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {structured.explanation ? (
        <div className="text-sm italic leading-relaxed text-slate-400">{structured.explanation}</div>
      ) : null}
    </div>
  );
}
