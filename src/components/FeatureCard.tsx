// src/components/FeatureCard.tsx
import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  // Each defaults to the current dark-hero look but fully replaces (not
  // merges with) the default when passed -- avoids the usual Tailwind
  // trap of two conflicting utility classes both ending up in the string
  // with no guaranteed winner. Pass only what actually needs to change for
  // a given placement (e.g. just containerClassName for a light
  // background); the rest keep their defaults.
  containerClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  containerClassName = 'p-5 bg-white/5 border border-white/10 rounded-2xl',
  iconClassName = 'w-5 h-5 text-forest-400',
  titleClassName = 'mt-3 font-semibold text-neutral-50',
  descriptionClassName = 'mt-1 text-sm text-neutral-300',
}: FeatureCardProps) {
  return (
    <div className={containerClassName}>
      <Icon className={iconClassName} />
      <p className={titleClassName}>{title}</p>
      <p className={descriptionClassName}>{description}</p>
    </div>
  );
}
