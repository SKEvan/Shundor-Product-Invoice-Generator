import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { LogIn } from 'lucide-react';
import logo from '@/assets/logo-main.webp';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/fields';
import { BUSINESS } from '@/config/business';
import { useAuth } from '@/hooks/useAuth';
import { signIn } from '@/services/authService';

export default function LoginPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';
  if (session) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signIn(username, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-linear-to-b from-brand-100 to-brand-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src={logo} alt={BUSINESS.name} width={260} height={164} className="mx-auto h-auto w-[220px]" />
          <p className="mt-2 text-sm font-medium text-brand-700 italic">{BUSINESS.tagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-lg shadow-brand-900/5 ring-1 ring-brand-100">
          <h1 className="text-lg font-semibold text-gray-900">Sign in</h1>
          <TextField label="Username" value={username} onChange={setUsername} autoComplete="username" autoCapitalize="none" required />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
          {error && <Alert tone="error" title={error} />}
          <Button type="submit" fullWidth loading={submitting} icon={<LogIn className="size-4" />}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
