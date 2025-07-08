'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background-primary">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Something went wrong!
            </h2>
            <p className="text-gray-400 mb-6">
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}