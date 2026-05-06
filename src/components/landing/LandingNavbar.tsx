import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BrandLogo } from '@/components/shared/BrandLogo';

export default function LandingNavbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 80);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'bg-black/60 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3">
          <BrandLogo imageClassName="h-11 md:h-12" />
        </button>

        <div className="flex items-center gap-3 md:gap-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-full border border-cyan-200/20 bg-gradient-to-r from-sky-200/85 to-cyan-200/85 px-5 py-2 text-sm font-semibold text-slate-950 transition-all hover:shadow-md hover:shadow-cyan-400/20"
          >
            Open Dashboard
          </button>
        </div>
      </div>
    </header>
  );
}
