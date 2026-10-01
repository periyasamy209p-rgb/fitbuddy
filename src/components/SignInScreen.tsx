import React, { FormEvent, useState } from 'react';
import { Dumbbell, LockKeyhole } from 'lucide-react';

interface SignInScreenProps {
  onAuthenticated: () => void;
  initialError: string | null;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ onAuthenticated, initialError }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign-in failed.');
      onAuthenticated();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080b11] text-slate-100 flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-sm border border-slate-800 bg-[#0f141f] p-7 sm:p-8 rounded-xl shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-slate-950">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">FitBuddy</h1>
            <p className="text-xs text-slate-400">Private access</p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-white">Sign in</h2>
        <p className="mt-1 text-sm text-slate-400">Enter the deployment access token to continue.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label htmlFor="access-token" className="block text-xs font-semibold text-slate-300">
            Access token
          </label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="access-token"
              type="password"
              autoComplete="current-password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-[#080b11] py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-amber-400"
              placeholder="Enter access token"
            />
          </div>
          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      </section>
    </main>
  );
};