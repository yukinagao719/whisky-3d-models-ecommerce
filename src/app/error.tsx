'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-400 mb-6">
          An error occurred while loading the page.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-accent-dark hover:bg-accent-light text-text-primary rounded-md transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}