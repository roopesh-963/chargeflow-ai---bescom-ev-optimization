import { motion } from 'motion/react';
import { TrendingUp, BatteryCharging, MapPin, Activity } from 'lucide-react';

const stats = [
  { label: 'Charging Demand Forecast', value: '24h', icon: TrendingUp, color: 'text-electric-blue' },
  { label: 'Peak Load Reduction', value: '14-18%', icon: BatteryCharging, color: 'text-cyber-green' },
  { label: 'Priority Expansion Zones', value: '3', icon: Activity, color: 'text-purple-500' },
  { label: 'Decision Layer', value: 'NON-INTRUSIVE', icon: Zap, color: 'text-yellow-400' },
];

import { Zap } from 'lucide-react';

export default function StatsStrip() {
  return (
    <div className="relative z-20 -mt-10 px-6">
      <div className="max-w-6xl mx-auto glass rounded-2xl border-white/10 p-2 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-black/20">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 text-center group cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-center mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color} mb-1`} />
              </div>
              <div className="text-2xl font-black text-white font-mono tracking-tight leading-none mb-1 group-hover:scale-110 transition-transform">
                {stat.value}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
