import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';

const stats = [
  { value: 7, label: 'Bengaluru Zones', suffix: '' },
  { value: 34, label: 'Peak Load Reduction', suffix: '%' },
  { value: 24, label: 'Forecast Horizon', suffix: 'h' },
  { value: 99, label: 'Grid Constraint Compliance', suffix: '%' },
];

function CountUpStat({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const durationMs = 2000;
    const start = performance.now();
    let frameId = 0;

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      setDisplayValue(Math.round(value * progress));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [inView, value]);

  const formattedValue = useMemo(() => `${displayValue}${suffix}`, [displayValue, suffix]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-black text-cyan-200">{formattedValue}</div>
      <div className="mt-1 text-sm text-slate-300/75">{label}</div>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section id="architecture" className="flex min-h-screen items-center px-6 py-24">
      <div className="mx-auto w-full max-w-6xl rounded-[32px] border border-white/10 bg-black/35 p-8 backdrop-blur-md md:p-12">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black tracking-tight text-slate-100 md:text-5xl">Grid Intelligence at Utility Scale</h2>
          <p className="mt-3 text-slate-300/70">Scroll-driven storytelling over a single continuous animation.</p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <CountUpStat value={stat.value} label={stat.label} suffix={stat.suffix} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
