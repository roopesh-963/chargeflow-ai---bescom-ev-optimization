import * as React from 'react';

import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
