import { useState } from 'react';

import { BrandLogo } from '@/components/shared/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

const DEMO_USERS = [
  { label: 'Admin', username: 'admin', password: 'bescom2025' },
  { label: 'Operator', username: 'operator1', password: 'operator123' },
  { label: 'Planner', username: 'planner', password: 'planner123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(0,112,255,0.18),_transparent_24%),linear-gradient(180deg,#020408_0%,#04070d_60%,#020408_100%)] px-4 text-white">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#07101a]/95 p-6 shadow-[0_30px_120px_-40px_rgba(0,112,255,0.65)] md:p-8">
        <div className="mb-8 text-center">
          <BrandLogo className="justify-center" imageClassName="h-16 md:h-20" />
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyber-green">BESCOM Secure Access</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">ChargeFlow AI</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to access live EV planning and grid operations.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="h-11 rounded-2xl border-white/10 bg-white/5"
          />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="h-11 rounded-2xl border-white/10 bg-white/5"
          />
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error === 'Failed to fetch'
                ? 'Cannot reach server. Is the backend running on port 8000?'
                : error.includes('401') || error.includes('Invalid')
                  ? 'Wrong username or password'
                  : error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="h-11 w-full rounded-2xl bg-electric-blue text-white hover:bg-electric-blue/90">
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6">
          <p className="mb-3 text-center text-xs text-gray-600">Demo credentials</p>
          <div className="flex gap-2 justify-center">
            {DEMO_USERS.map((credential) => (
              <button
                key={credential.label}
                type="button"
                onClick={() => {
                  setUsername(credential.username);
                  setPassword(credential.password);
                }}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition-all hover:border-teal-500/40 hover:text-teal-400"
              >
                {credential.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
