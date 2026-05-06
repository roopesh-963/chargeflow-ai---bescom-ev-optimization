import { Suspense, lazy } from 'react';

import HeroContent from '@/components/landing/HeroContent';
import LandingNavbar from '@/components/landing/LandingNavbar';
import StatsSection from '@/components/landing/StatsSection';
import VideoBackground from '@/components/landing/VideoBackground';

const FeaturesSection = lazy(() => import('@/components/landing/FeaturesSection'));

export default function LandingPage() {
  return (
    <div className="relative bg-[#05070c]">
      <LandingNavbar />

      <div className="relative">
        <div className="sticky top-0 h-screen">
          <VideoBackground>{null}</VideoBackground>
        </div>

        <div className="relative z-10 -mt-[100vh]">
          <HeroContent />
          <StatsSection />
          <Suspense fallback={<div className="min-h-screen" />}>
            <FeaturesSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
