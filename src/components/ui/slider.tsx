import * as React from 'react';

import { cn } from '@/lib/utils';

interface SliderProps {
  defaultValue?: number[];
  max?: number;
  min?: number;
  step?: number;
  className?: string;
  onValueChange?: (value: number[]) => void;
}

export function Slider({
  defaultValue = [0],
  max = 100,
  min = 0,
  step = 1,
  className,
  onValueChange,
}: SliderProps) {
  const [value, setValue] = React.useState(defaultValue[0] ?? 0);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    setValue(nextValue);
    onValueChange?.([nextValue]);
  };

  return (
    <div className={cn('flex items-center', className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
      />
    </div>
  );
}
