import { BrandLogo } from '@/components/shared/BrandLogo';

export default function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-6">
            <BrandLogo imageClassName="h-11" />
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Explainable EV charging demand prediction, scheduling optimization, and infrastructure planning for BESCOM using synthetic or masked data.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          <div>
            <h5 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">Solution</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#features" className="hover:text-electric-blue transition-colors">Demand Prediction</a></li>
              <li><a href="#map" className="hover:text-electric-blue transition-colors">Grid-Aware Scheduling</a></li>
              <li><a href="#architecture" className="hover:text-electric-blue transition-colors">Infrastructure Planning</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">Constraints</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><span>No grid system changes</span></li>
              <li><span>Synthetic or masked data</span></li>
              <li><span>Explainable recommendations</span></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">Outcomes</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><span>Peak load reduction</span></li>
              <li><span>Priority charging corridors</span></li>
              <li><span>Planner-ready actions</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          &copy; 2026 ChargeFlow AI Intelligence Systems // BENGALURU, INDIA
        </div>
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          THEME 9 // AI FOR EV CHARGING OPTIMIZATION & INFRASTRUCTURE PLANNING
        </div>
      </div>
    </footer>
  );
}
