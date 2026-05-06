import { BellRing, Bot, BrainCircuit, Gauge, Map, TimerReset } from 'lucide-react';
import { motion } from 'motion/react';

const features = [
  {
    icon: Gauge,
    title: 'Demand Forecasting',
    description: 'GradientBoostingRegressor predicts hourly EV load per zone with confidence scores',
  },
  {
    icon: TimerReset,
    title: 'Smart Scheduling',
    description: 'Linear programming shifts charging load to off-peak hours automatically',
  },
  {
    icon: Map,
    title: 'Infrastructure Planning',
    description: 'SHAP-explained recommendations for new charging station locations',
  },
  {
    icon: BellRing,
    title: 'Real-time Alerts',
    description: 'WebSocket-powered live grid stress monitoring with severity levels',
  },
  {
    icon: BrainCircuit,
    title: 'Anomaly Detection',
    description: 'IsolationForest flags unusual charging patterns before they cause outages',
  },
  {
    icon: Bot,
    title: 'AI Copilot',
    description: 'Gemini-powered planning assistant with structured actionable insights',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="flex min-h-screen items-center px-6 py-24">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-white/10 bg-black/35 p-8 backdrop-blur-md md:p-12">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-black tracking-tight text-slate-100 md:text-5xl">Everything BESCOM Needs</h2>
          <p className="mt-3 text-slate-300/70">The video stays constant while the operator story unfolds.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group rounded-2xl border border-white/8 bg-white/[0.04] p-6 transition-all duration-300 hover:border-teal-500/40 hover:bg-white/[0.08]"
            >
              <feature.icon className="mb-4 h-8 w-8 text-cyan-200" />
              <h3 className="mb-2 text-lg font-bold text-slate-100">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-300/75">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
