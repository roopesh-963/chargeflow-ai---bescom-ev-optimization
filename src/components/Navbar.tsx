import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Menu, X } from 'lucide-react';

import { BrandLogo } from '@/components/shared/BrandLogo';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onEnterDashboard: () => void;
}

const navItems = [
  { label: 'Solutions', target: 'features' },
  { label: 'Grid Map', target: 'map' },
  { label: 'Infrastructure', target: 'architecture' },
  { label: 'Impact', target: 'why' },
];

export default function Navbar({ onEnterDashboard }: NavbarProps) {
  const [activeSection, setActiveSection] = useState('features');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-40% 0px -45% 0px',
        threshold: 0.1,
      },
    );

    navItems.forEach((item) => {
      const element = document.getElementById(item.target);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  function navigateToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
      setIsMobileMenuOpen(false);
    }
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-obsidian/50 px-4 py-4 backdrop-blur-md md:px-6"
    >
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2"
          aria-label="Go to top"
        >
          <BrandLogo imageClassName="h-10 md:h-11" />
        </button>

        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-2 py-1 text-sm font-medium text-slate-400">
          {navItems.map((item) => (
            <button
              key={item.target}
              onClick={() => navigateToSection(item.target)}
              className={cn(
                'rounded-full px-4 py-2 transition-colors',
                activeSection === item.target
                  ? 'bg-electric-blue/10 text-white'
                  : 'hover:text-white',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onEnterDashboard}
            className="glass flex items-center gap-2 rounded-full border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            Launch Dashboard
            <LayoutDashboard className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:text-white md:hidden"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="mt-4 rounded-3xl border border-white/10 bg-[#05070c]/95 p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.target}
                onClick={() => navigateToSection(item.target)}
                className={cn(
                  'rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors',
                  activeSection === item.target
                    ? 'bg-electric-blue/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={onEnterDashboard}
              className="mt-2 rounded-2xl border border-cyber-green/20 bg-cyber-green/10 px-4 py-3 text-left text-sm font-semibold text-cyber-green"
            >
              Launch Dashboard
            </button>
          </div>
        </div>
      ) : null}
    </motion.nav>
  );
}
