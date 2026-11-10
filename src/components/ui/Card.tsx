import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A white rounded panel used to group each section of a page. */
export function Card({ title, action, children, className = '' }: CardProps) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100 sm:p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
