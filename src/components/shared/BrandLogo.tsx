import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  alt?: string;
}

export function BrandLogo({
  className,
  imageClassName,
  alt = 'ChargeFlow AI BESCOM logo',
}: BrandLogoProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <img
        src="/chargeflow-bescom-logo.svg"
        alt={alt}
        className={cn('h-10 w-auto object-contain', imageClassName)}
      />
    </div>
  );
}
