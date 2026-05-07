import { useEffect, useState, type ReactNode } from 'react';

export default function VideoBackground({ children }: { children: ReactNode }) {
  const [showVideo, setShowVideo] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      setShowVideo(!mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener('change', updatePreference);
    };
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0d0d1a]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/videos/bescom-poster.jpg')" }}
      />

      {showVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/videos/bescom-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: 'scale(1.05)' }}
          onError={() => setShowVideo(false)}
        >
          <source src="/videos/bescom.mp4" type="video/mp4" />
        </video>
      ) : null}

      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a]/85 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />

      {children}
    </div>
  );
}
