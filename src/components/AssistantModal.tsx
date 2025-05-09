// src/components/AssistantModal.tsx
'use client';

import React, { FC, useState, useEffect } from 'react';
import type { Assistant } from '@/types/assistant';

export interface AssistantModalProps {
  isOpen: boolean;
  assistant: Assistant | null;
  isSubmitting: boolean;
  onSubmit: (data: {
    id?: number;
    name: string;
    instructions: string;
    model: string;
  }) => void;
  onClose: () => void;
}

const AssistantModal: FC<AssistantModalProps> = ({
  isOpen,
  assistant,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [name, setName] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [model, setModel] = useState<string>('gpt-4o');

  useEffect(() => {
    if (assistant) {
      setName(assistant.name);
      setInstructions(assistant.instructions ?? '');
      setModel(assistant.model);
    } else {
      setName('');
      setInstructions('');
      setModel('gpt-4o');
    }
  }, [assistant, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {assistant ? 'Edit Assistant' : 'New Assistant'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={isSubmitting}
              className="w-full border rounded px-3 py-2 h-24"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSubmit({
                id: assistant?.id,
                name: name.trim(),
                instructions: instructions.trim(),
                model: model.trim(),
              })
            }
            disabled={isSubmitting || !name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantModal;
