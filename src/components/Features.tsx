import { motion } from 'motion/react';
import { Brain, Cpu, Database, BarChart3, Fingerprint, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    title: "AI Demand Forecasting",
    description: "Deep learning models predict hyperlocal EV demand using traffic flows, city planning, and adoption trends.",
    icon: Brain,
    className: "md:col-span-2 md:row-span-2 bg-gradient-to-br from-electric-blue/10 to-transparent",
    accent: "bg-electric-blue"
  },
  {
    title: "Dynamic Grid Balancing",
    description: "Real-time synchronization with BESCOM's grid status to prevent localized substation overload.",
    icon: Activity,
    className: "md:col-span-1 md:row-span-1",
    accent: "bg-cyber-green"
  },
  {
    title: "Smart Placement Engine",
    description: "Optimize ROI by identifying precise locations for new charging infrastructure using multi-factor space analytics.",
    icon: MapPin,
    className: "md:col-span-1 md:row-span-1",
    accent: "bg-purple-500"
  },
  {
    title: "Scenario Simulation",
    description: "Model the impact of 'what-if' scenarios like summer peak demand or large-scale EV fleet migrations.",
    icon: Database,
    className: "md:col-span-2 md:row-span-1",
    accent: "bg-yellow-400"
  },
  {
    title: "Fleet Management API",
    description: "Seamlessly integrate with public transport and logistics operators for priority charging management.",
    icon: Cpu,
    className: "md:col-span-1 md:row-span-1",
    accent: "bg-pink-500"
  },
  {
    title: "Substation Health",
    description: "Predictive maintenance alerts based on continuous transformer stress monitoring and heat-maps.",
    icon: Shield,
    className: "md:col-span-1 md:row-span-1",
    accent: "bg-cyan-400"
  }
];

import { Activity, MapPin, Shield } from 'lucide-react';

export default function Features() {
  return (
    <section id="features" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-sm font-mono font-bold text-cyber-green uppercase tracking-[0.3em] mb-4">Precision Capabilities</h2>
          <h3 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Advanced Intelligence for <br />
            <span className="text-slate-500">Critical Infrastructure</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "group relative glass rounded-3xl p-8 border-white/5 overflow-hidden hover:border-white/20 transition-all duration-500",
                feature.className
              )}
            >
              <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 rounded-full", feature.accent)} />
              
              <div className={cn("inline-flex p-4 rounded-2xl mb-6 bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500")}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              <h4 className="text-2xl font-bold text-white mb-4 group-hover:translate-x-1 transition-transform duration-500">
                {feature.title}
              </h4>
              <p className="text-slate-400 leading-relaxed max-w-md">
                {feature.description}
              </p>

              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <BarChart3 className="w-24 h-24 text-white/5 -rotate-12" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
