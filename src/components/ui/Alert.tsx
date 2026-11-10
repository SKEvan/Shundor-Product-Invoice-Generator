import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

type Tone = 'warning' | 'error' | 'success';

const TONES: Record<Tone, { box: string; icon: ReactNode }> = {
  warning: { box: 'bg-amber-50 text-amber-900 ring-amber-200', icon: <AlertTriangle className="size-4 shrink-0" /> },
  error: { box: 'bg-red-50 text-red-800 ring-red-200', icon: <XCircle className="size-4 shrink-0" /> },
  success: { box: 'bg-emerald-50 text-emerald-800 ring-emerald-200', icon: <CheckCircle2 className="size-4 shrink-0" /> },
};

interface AlertProps {
  tone: Tone;
  title?: string;
  /** A list of messages, or any custom content. */
  messages?: string[];
  children?: ReactNode;
}

export function Alert({ tone, title, messages, children }: AlertProps) {
  const { box, icon } = TONES[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-2 rounded-xl p-3 text-sm ring-1 ${box}`}>
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {messages && messages.length > 0 && (
          <ul className={`${title ? 'mt-1' : ''} list-disc space-y-0.5 pl-4`}>
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </div>
  );
}
