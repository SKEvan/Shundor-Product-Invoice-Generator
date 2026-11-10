import { useState, type FormEvent } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/fields';
import { BUSINESS, DELIVERY_CHARGES } from '@/config/business';
import { useAuth } from '@/hooks/useAuth';
import { changePassword, signOut } from '@/services/authService';

const MIN_PASSWORD_LENGTH = 8;

export default function SettingsPage() {
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setStatus({ tone: 'error', text: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
      return;
    }
    if (password !== confirm) {
      setStatus({ tone: 'error', text: 'The two passwords don’t match.' });
      return;
    }
    setSaving(true);
    try {
      await changePassword(password);
      setPassword('');
      setConfirm('');
      setStatus({ tone: 'success', text: 'Password changed.' });
    } catch (err) {
      setStatus({ tone: 'error', text: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Settings" subtitle={session?.user.email ? `Signed in as ${session.user.email.split('@')[0]}` : undefined} />

      <Card title="Change password">
        <form onSubmit={handleChangePassword} className="space-y-3">
          <TextField label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
          <TextField label="Confirm new password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          {status && <Alert tone={status.tone} title={status.text} />}
          <Button type="submit" loading={saving} icon={<KeyRound className="size-4" />}>
            Update password
          </Button>
        </form>
      </Card>

      <Card title="Business details on invoices">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-gray-500">Name</dt>
          <dd>{BUSINESS.name}</dd>
          <dt className="text-gray-500">WhatsApp</dt>
          <dd>{BUSINESS.whatsapp}</dd>
          <dt className="text-gray-500">bKash</dt>
          <dd>{BUSINESS.payment.bkash}</dd>
          <dt className="text-gray-500">Nagad</dt>
          <dd>{BUSINESS.payment.nagad}</dd>
          <dt className="text-gray-500">Delivery</dt>
          <dd>
            Inside Dhaka Tk {DELIVERY_CHARGES.inside_dhaka} · Outside Dhaka Tk {DELIVERY_CHARGES.outside_dhaka}
          </dd>
        </dl>
        <p className="mt-3 text-xs text-gray-500">
          To change these, edit <code className="rounded bg-brand-50 px-1">src/config/business.ts</code>.
        </p>
      </Card>

      <Button variant="danger" fullWidth icon={<LogOut className="size-4" />} onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
}
