// src/components/Modal.tsx
'use client';

import React, { FC, ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  children: ReactNode;
  // e.g. 'max-w-sm', 'max-w-lg' — modals vary in content width, the
  // backdrop/card shell itself is otherwise identical across all of them.
  maxWidthClassName?: string;
}

// Shared shell for every modal in the app — backdrop is the current page
// itself, heavily blurred (not a flat dark scrim), so context behind the
// modal stays visible but unreadable/out of focus.
const Modal: FC<ModalProps> = ({ isOpen, children, maxWidthClassName = 'max-w-sm' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg">
      <div className={`w-full ${maxWidthClassName} bg-white rounded-lg shadow-lg p-6`}>{children}</div>
    </div>
  );
};

export default Modal;
