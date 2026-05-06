import { motion } from 'motion/react';
import { Target, Zap, Waves, Signal } from 'lucide-react';

export default function MapPreview() {
  return (
    <section id="map" className="py-32 px-6 bg-black/40 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3b82f615_0%,transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <h2 className="text-sm font-mono font-bold text-cyber-green uppercase tracking-[0.3em] mb-4">Live GIS Engine</h2>
          <h3 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8">
            Visualizing the <br />
            <span className="text-electric-blue">Electric Pulse</span> of Bengaluru
          </h3>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            From Indiranagar to Electronics City, our platform monitors every transformer and EV charger in real-time. We visualize grid health, charging density, and forecast the next 24 hours of energy demand across the city.
          </p>

          <div className="space-y-6">
            {[
              { label: 'Real-time Station Ping', value: 'Active', icon: Signal, color: 'text-cyber-green' },
              { label: 'Hyperlocal Grid Health', value: 'Optimum', icon: Zap, color: 'text-electric-blue' },
              { label: 'Traffic Density Sync', value: 'Synced', icon: Waves, color: 'text-purple-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 glass rounded-2xl border-white/5 bg-white/5 w-full max-w-sm">
                <div className={`p-3 rounded-xl bg-white/5 ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{item.label}</div>
                  <div className="text-lg font-bold text-white font-mono">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative aspect-square glass rounded-[40px] border-white/5 bg-black/40 overflow-hidden shadow-[0_0_100px_-20px_rgba(0,112,255,0.2)]"
        >
          {/* Abstract Map Visualization */}
          <div className="absolute inset-0 p-12">
            <svg viewBox="0 0 500 500" className="w-full h-full opacity-40">
               {/* Grid nodes */}
               <path d="M50,100 L150,100 L150,200 L250,200 L250,150 L350,150 L350,300 L450,300" 
                     className="stroke-electric-blue stroke-[0.5] fill-none" />
               <path d="M100,50 L100,150 L200,150 L200,250 L150,250 L150,400 L300,400" 
                     className="stroke-cyber-green stroke-[0.5] fill-none" />
               <path d="M400,200 L400,100 L300,100 L300,50" 
                     className="stroke-white/20 stroke-[0.5] fill-none" />
               
               {/* Pulses */}
               {[
                 { x: 150, y: 100, delay: 0 },
                 { x: 350, y: 300, delay: 1 },
                 { x: 200, y: 150, delay: 0.5 },
                 { x: 150, y: 400, delay: 1.5 },
                 { x: 400, y: 100, delay: 0.8 },
               ].map((pos, i) => (
                 <g key={i}>
                    <circle cx={pos.x} cy={pos.y} r="2" className="fill-electric-blue" />
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      initial={{ r: 0, opacity: 1 }}
                      animate={{ r: 40, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, delay: pos.delay }}
                      className="stroke-electric-blue stroke-[0.5] fill-none"
                    />
                 </g>
               ))}

               {/* Grid Stations (Green) */}
               {[
                 { x: 250, y: 200 },
                 { x: 100, y: 150 },
                 { x: 300, y: 400 },
               ].map((pos, i) => (
                 <g key={i}>
                    <circle cx={pos.x} cy={pos.y} r="3" className="fill-cyber-green" />
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      initial={{ r: 0, opacity: 1 }}
                      animate={{ r: 25, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="stroke-cyber-green stroke-[0.5] fill-none"
                    />
                 </g>
               ))}
            </svg>
          </div>

          {/* Floaters */}
          <div className="absolute top-10 right-10 p-4 glass rounded-2xl border-white/20 bg-white/5 backdrop-blur-md">
            <div className="text-[10px] uppercase mb-1 text-slate-500 font-bold">Node Load</div>
            <div className="text-xl font-mono text-cyber-green font-black">42.8%</div>
          </div>

          <div className="absolute bottom-10 left-10 p-4 glass rounded-2xl border-white/20 bg-white/5 backdrop-blur-md">
            <div className="text-[10px] uppercase mb-1 text-slate-500 font-bold">Active Sessions</div>
            <div className="text-xl font-mono text-electric-blue font-black">1,248</div>
          </div>
          
          {/* Scanline Effect */}
          <div className="absolute inset-x-0 h-1 bg-electric-blue/20 blur-sm animate-scan z-20 pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
