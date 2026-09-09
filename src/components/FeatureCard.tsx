// src/components/FeatureCard.tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  // Each merges with (not replaces) its part's default classes via cn() --
  // pass only what actually needs to change (e.g. descriptionClassName="text-base"
  // to bump just the font size) and the rest of that part's defaults
  // (color, spacing, weight) stay intact.
  containerClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  containerClassName,
  iconClassName,
  titleClassName,
  descriptionClassName,
}: FeatureCardProps) {
  return (
    <div className={cn('p-5 bg-white/5 border border-white/10 rounded-2xl', containerClassName)}>
      <Icon className={cn('w-5 h-5 text-forest-400', iconClassName)} />
      <p className={cn('mt-3 font-semibold text-neutral-50', titleClassName)}>{title}</p>
      <p className={cn('mt-1 text-sm text-neutral-300', descriptionClassName)}>{description}</p>
    </div>
  );
}
