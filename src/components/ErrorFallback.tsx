// src/components/ErrorFallback.tsx
'use client';

interface ErrorFallbackProps {
  message?: string;
  onRetry: () => void;
}

export default function ErrorFallback({ message, onRetry }: ErrorFallbackProps) {
  return (
    <div className="text-center max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-gray-500 mb-4">
        {message ?? 'An unexpected error occurred. Try again, or pick something else.'}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
