import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[260px] items-center justify-center">
      <div className="w-full max-w-xl rounded-xl border border-red-200 bg-red-50 p-8 text-center text-slate-900">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h3 className="text-2xl font-bold text-red-700">Something went wrong</h3>
        <p className="mt-2 text-sm text-red-600">
          {message ?? 'We could not load this view right now. Please try again.'}
        </p>
        {onRetry ? (
          <Button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-xl bg-red-600 px-5 text-white hover:bg-red-700"
          >
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
