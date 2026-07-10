// src/components/CardMenu.tsx
'use client';

import React, { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

export interface CardMenuProps {
  children: ReactNode;
  // Full control of the outer positioning class — the component doesn't
  // hardcode 'relative' itself, since a caller placing this in a card
  // corner needs 'absolute top-3 right-3' instead, and concatenating that
  // with a hardcoded 'relative' put both position values on the same
  // element (undefined/fragile — Tailwind's own utility ordering decides
  // which one actually applies, not the order they're written here).
  className?: string;
}

// Small "3-dot" popover menu used on card-style list items (project cards,
// MCP server cards, ...) — click the trigger to open, click outside or an
// item to close.
export const CardMenu: FC<CardMenuProps> = ({ children, className = 'relative' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className={className}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-1 rounded hover:bg-gray-200 text-gray-500"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg overflow-hidden z-10"
        >
          {children}
        </div>
      )}
    </div>
  );
};

export function CardMenuItem({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-gray-100">
      {children}
    </button>
  );
}
