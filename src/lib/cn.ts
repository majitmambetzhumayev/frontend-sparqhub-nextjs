// src/lib/cn.ts
import { twMerge } from 'tailwind-merge';

// Merges Tailwind class strings, keeping only the last value for any
// conflicting utility (e.g. cn('text-sm text-neutral-300', 'text-lg')
// -> 'text-neutral-300 text-lg', not both text sizes stacked with an
// unpredictable winner) -- lets a caller override a single property
// (font size, say) without having to repeat every other default class.
export function cn(...classes: Array<string | undefined | false>): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
