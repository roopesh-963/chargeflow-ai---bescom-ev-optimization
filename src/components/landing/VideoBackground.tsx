import type { ReactNode } from 'react';

export default function VideoBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0d0d1a]">
      {/* VIDEO FILE: place bescom.mp4 in /public/videos/bescom.mp4 */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/videos/bescom-poster.jpg"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: 'scale(1.05)' }}
      >
        <source src="/videos/bescom.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a]/85 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />

      {children}
    </div>
  );
}
