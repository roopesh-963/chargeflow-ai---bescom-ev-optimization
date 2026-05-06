export function SkeletonCard({
  height = '120px',
  width = '100%',
}: {
  height?: string;
  width?: string;
}) {
  return (
    <div
      className="animate-pulse rounded-3xl border border-white/8 bg-white/[0.04]"
      style={{ height, width }}
    >
      <div className="h-full w-full rounded-3xl bg-[linear-gradient(110deg,rgba(255,255,255,0.02),rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
    </div>
  );
}
