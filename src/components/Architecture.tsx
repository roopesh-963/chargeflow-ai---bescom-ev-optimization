import { motion } from 'motion/react';
import { Database, Server, Share2, Shield, Eye } from 'lucide-react';

const steps = [
  { title: "Ingest", desc: "AMI Meter data & GIS city layers", icon: Database },
  { title: "Compute", desc: "Distributed AI optimization nodes", icon: Server },
  { title: "Shield", desc: "Encryption & Cybersecurity layer", icon: Shield },
  { title: "Deliver", desc: "Real-time API & Control Dashboard", icon: Share2 },
];

export default function Architecture() {
  return (
    <section id="architecture" className="py-32 px-6 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-sm font-mono font-bold text-purple-400 uppercase tracking-[0.3em] mb-4">The Engine Underneath</h2>
          <h3 className="text-4xl md:text-6xl font-black text-white tracking-tight">Enterprise Architecture</h3>
        </div>

        <div className="relative">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent hidden lg:block -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 rounded-full glass border-white/10 bg-black flex items-center justify-center mb-8 group-hover:border-electric-blue transition-colors duration-500 relative">
                    <div className="absolute inset-0 bg-electric-blue/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <step.icon className="w-10 h-10 text-white relative z-10" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">{step.title}</h4>
                <p className="text-slate-500 text-sm max-w-[200px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Technical Callout */}
        <div className="mt-24 p-12 glass rounded-[40px] border-white/5 bg-white/5 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
                <div className="flex items-center gap-2 text-cyber-green font-mono text-sm mb-4">
                    <Eye className="w-4 h-4" />
                    <span>SYSTEM_OBSERVABILITY_STATUS: NOMINAL</span>
                </div>
                <h4 className="text-3xl font-black text-white mb-4">Unmatched Grid Transparency</h4>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  Built on top of a highly resilient microservices architecture, ChargeFlow AI processes over 10 million data points per day to ensure Bengaluru's grid stays stable as its EV population doubles every 18 months.
                </p>
                <div className="flex flex-wrap gap-4">
                    <span className="px-4 py-2 glass rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border-white/10">Zero-Trust Auth</span>
                    <span className="px-4 py-2 glass rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border-white/10">GraphQL Engine</span>
                    <span className="px-4 py-2 glass rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border-white/10">Temporal Workflows</span>
                </div>
            </div>
            <div className="w-full lg:w-1/3 aspect-square glass rounded-3xl border-white/10 p-8 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent opacity-50" />
                <div className="relative space-y-4 w-full">
                    {[70, 40, 90, 60, 80].map((w, i) => (
                        <div key={i} className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${w}%` }}
                              transition={{ duration: 1.5, delay: i * 0.1 }}
                              className="h-full bg-gradient-to-r from-electric-blue to-cyber-green"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </section>
  );
}
