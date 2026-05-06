import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const headingLines = [
  {
    text: 'Intelligent EV Charging',
    className:
      'text-5xl md:text-7xl lg:text-8xl font-black text-transparent tracking-tight leading-none [font-variation-settings:"wght"_900] [-webkit-text-stroke:1.5px_rgba(191,219,254,0.88)]',
  },
  {
    text: 'Optimization',
    className:
      'text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200/65 via-sky-300/75 to-blue-400/70 tracking-tight leading-none [font-variation-settings:"wght"_900]',
  },
  {
    text: 'for Bengaluru',
    className:
      'text-5xl md:text-7xl lg:text-8xl font-black text-transparent tracking-tight leading-none [font-variation-settings:"wght"_900] [-webkit-text-stroke:1.5px_rgba(226,232,240,0.58)]',
  },
];

export default function HeroContent() {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-6 rounded-full border border-cyan-300/35 bg-slate-950/35 px-4 py-1.5 text-xs tracking-[0.22em] text-cyan-100/80 backdrop-blur-sm"
      >
        BESCOM x ChargeFlow AI
      </motion.div>

      <div className="space-y-1">
        {headingLines.map((line, index) => (
          <motion.h1
            key={line.text}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.4 + index * 0.1 }}
            className={line.className}
          >
            {line.text}
          </motion.h1>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-200/80 md:text-lg"
      >
        AI-powered demand forecasting, smart scheduling, and infrastructure planning for BESCOM&apos;s EV grid
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-10 flex flex-col gap-4 sm:flex-row"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard')}
          className="rounded-full border border-cyan-200/20 bg-gradient-to-r from-sky-200/85 via-cyan-200/80 to-teal-200/85 px-8 py-4 text-lg font-bold text-slate-950 transition-all hover:shadow-lg hover:shadow-cyan-400/20"
        >
          Enter Dashboard -&gt;
        </motion.button>
      </motion.div>
    </div>
  );
}
