import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex items-center justify-center min-h-screen">
          <Loader2
            className="w-8 h-8 animate-spin text-accent-dark"
            aria-hidden="true"
          />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
