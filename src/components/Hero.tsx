import { motion } from 'motion/react';
import { ArrowRight, Zap } from 'lucide-react';

interface HeroProps {
  onEnterDashboard: () => void;
}

export default function Hero({ onEnterDashboard }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-electric-blue/20 rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-cyber-green/20 rounded-full blur-[120px] opacity-20 pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-white/10 text-xs font-mono text-cyber-green mb-8"
        >
          <Zap className="w-4 h-4 fill-cyber-green" />
          <span>BESCOM DECISION-SUPPORT LAYER FOR EV CHARGING</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-8xl font-black tracking-tight text-white mb-6 leading-[1.05]"
        >
          Powering Bengaluru's <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue via-cyber-green to-electric-blue bg-[length:200%_auto] animate-gradient">
            EV Future with AI
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12"
        >
          Predict EV charging demand by time and zone, reduce peak load through smarter scheduling, and prioritize new station locations without changing existing distribution systems.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex items-center justify-center"
        >
          <button 
            onClick={onEnterDashboard}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-electric-blue hover:bg-electric-blue/90 text-white font-bold transition-all shadow-[0_0_30px_-5px_rgba(0,112,255,0.5)] flex items-center justify-center gap-2 group"
          >
            Launch Command Center
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Hero Visual - Abstract Simulation UI */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-20 relative px-4"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-electric-blue to-cyber-green rounded-2xl opacity-20 blur-2xl" />
          <div className="relative glass rounded-2xl border-white/10 overflow-hidden aspect-video max-w-5xl mx-auto bg-black/40">
             <div className="absolute top-0 left-0 right-0 h-8 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                <div className="w-3 h-3 rounded-full bg-green-500/20" />
                <span className="text-[10px] text-slate-500 font-mono ml-2">SIMULATION_CORE_V4 // BENGALURU_EAST.GRID</span>
             </div>
             
             {/* Fake simulation visual content */}
             <div className="h-full w-full flex items-center justify-center p-8 pt-12">
                <div className="grid grid-cols-12 gap-4 w-full h-full opacity-50">
                   {[...Array(48)].map((_, i) => (
                      <div 
                        key={i} 
                        className="h-full rounded-sm bg-gradient-to-t from-electric-blue/20 to-transparent flex flex-col justify-end gap-1 p-0.5"
                      >
                         <div 
                           className="w-full bg-electric-blue/40 rounded-sm" 
                           style={{ height: `${Math.random() * 80 + 10}%` }} 
                         />
                      </div>
                   ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-8 glass rounded-full animate-pulse border-electric-blue/50">
                        <Zap className="w-12 h-12 text-cyber-green drop-shadow-[0_0_15px_#00FF94]" />
                    </div>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
