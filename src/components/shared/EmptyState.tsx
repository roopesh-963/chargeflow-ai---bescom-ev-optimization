import { MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useZone } from '@/context/ZoneContext';

export function EmptyState({
  zone,
  message,
}: {
  zone?: string;
  message?: string;
}) {
  const { setSelectedZone } = useZone();
  const zoneLabel = zone ?? 'this selection';

  return (
    <div className="flex min-h-[260px] items-center justify-center">
      <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-slate-900">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-600">
          <MapPin className="h-7 w-7" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">No data for {zoneLabel}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {message ?? 'Try selecting a different zone or All Zones'}
        </p>
        <Button
          type="button"
          onClick={() => setSelectedZone('All Zones')}
          className="mt-5 rounded-xl bg-teal-600 px-5 text-white hover:bg-teal-700"
        >
          View All Zones
        </Button>
      </div>
    </div>
  );
}
