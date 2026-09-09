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

// Faint noise texture (feTurbulence SVG, inlined as a data URI), laid over
// the glow via mix-blend-mode so the gradient doesn't read as a flat,
// artificial-looking blend.
const GRAIN_BACKGROUND =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Three radial glows from this brand's own forest/neutral CSS variables
// (see globals.css's @theme block -- these read the same tokens Tailwind's
// forest-*/neutral-* classes do, just via var() since an inline gradient
// can't reference a Tailwind class), each at a random position/spread --
// an organic-looking blend that differs per card and per render, instead
// of picking from a small fixed set of flat linear gradients.
function randomGlowBackground(): string {
  const colors = ['var(--color-forest-600)', 'var(--color-forest-800)', 'var(--color-neutral-900)'];
  const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
  const glows = colors
    .map((color) => `radial-gradient(circle at ${rand(0, 100)}% ${rand(0, 100)}%, ${color}, transparent ${rand(55, 75)}%)`)
    .join(', ');
  return `${glows}, var(--color-forest-950)`;
}

// FeatureCard has no 'use client' and is only ever rendered from within a
// Server Component (HomePage) -- this subtree is never hydrated/re-rendered
// client-side, so computing the glow here with Math.random() at server
// render time is safe (no server/client markup mismatch to warn about).
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
    <div
      className={cn('relative overflow-hidden p-5 border border-white/10 rounded-2xl', containerClassName)}
      style={{ backgroundImage: randomGlowBackground() }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
        style={{ backgroundImage: GRAIN_BACKGROUND }}
      />
      <div className="relative">
        <Icon className={cn('w-5 h-5 text-forest-400', iconClassName)} />
        <h2 className={cn('mt-3 text-3xl font-extralight text-neutral-50', titleClassName)}>{title}</h2>
        <p className={cn('mt-1 text-sm text-neutral-300', descriptionClassName)}>{description}</p>
      </div>
    </div>
  );
}
