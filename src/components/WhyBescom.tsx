import { motion } from 'motion/react';
import { AlertTriangle, Clock, TrendingUp, ShieldAlert } from 'lucide-react';

const challenges = [
  {
    title: "Localized Overload",
    description: "Rapid EV clustering can exceed substation capacities by up to 300%, leading to power quality issues.",
    icon: ShieldAlert,
    color: "text-red-500",
    bg: "bg-red-500/10"
  },
  {
    title: "Non-Linear Growth",
    description: "Traditional infrastructure planning cannot keep pace with the 40% YoY growth in Bangalore's private EV fleet.",
    icon: TrendingUp,
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    title: "Peak Demand Conflict",
    description: "Unmanaged charging during evening hours creates massive stress on the grid without smart scheduling.",
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10"
  },
  {
    title: "Placement Inefficiency",
    description: "Sub-optimal charger locations lead to low utilization and customer range anxiety.",
    icon: AlertTriangle,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10"
  }
];

export default function WhyBescom() {
  return (
    <section id="why" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          <div>
            <h2 className="text-sm font-mono font-bold text-electric-blue uppercase tracking-[0.3em] mb-4">Strategic Imperative</h2>
            <h3 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8">
              Why BESCOM <br />Needs ChargeFlow AI
            </h3>
            <p className="text-lg text-slate-400 mb-12">
              The transition to electric mobility is no longer a forecast—it's a massive infrastructure challenge today. Static grid management is insufficient for the dynamic, high-load nature of EV fleets. 
            </p>
            
            <div className="p-8 rounded-[32px] bg-gradient-to-br from-electric-blue/20 to-cyber-green/20 border border-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8">
                  <div className="text-6xl font-black text-white/10 opacity-20">0%</div>
               </div>
               <div className="relative z-10">
                  <div className="text-5xl font-black text-white mb-2">35%</div>
                  <div className="text-sm font-bold text-cyber-green uppercase tracking-widest mb-4">Potential OPEX Savings</div>
                  <p className="text-slate-300">
                    By deferring costly substation upgrades through smart load shifting and precise infrastructure staging.
                  </p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {challenges.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 glass rounded-3xl border-white/5 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-start"
              >
                <div className={`p-4 rounded-2xl ${item.bg} ${item.color} mb-6`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white mb-4">{item.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
