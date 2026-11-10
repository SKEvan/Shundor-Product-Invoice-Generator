import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router';
import { FilePlus2, History, Settings } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

const NAV_ITEMS = [
  { to: '/', label: 'New invoice', icon: FilePlus2, end: true },
  { to: '/invoices', label: 'History', icon: History, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

/** Page frame: top bar (desktop nav) + bottom tab bar on phones. */
export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="" width={32} height={32} className="size-8" />
            <span className="font-semibold text-brand-700">Shundor Invoice</span>
          </NavLink>
          <nav className="hidden gap-1 sm:flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-brand-50'
                  }`
                }
              >
                <Icon className="size-4" /> {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pt-6 sm:pb-10">
        <Suspense
          fallback={
            <div className="grid place-items-center py-24 text-brand-600">
              <Spinner />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-3 border-t border-brand-100 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                isActive ? 'text-brand-600' : 'text-gray-500'
              }`
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
