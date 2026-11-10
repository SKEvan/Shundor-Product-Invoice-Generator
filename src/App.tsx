import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { isSupabaseConfigured } from '@/config/env';
import { AuthProvider } from '@/context/AuthProvider';
import LoginPage from '@/pages/LoginPage';
import NewInvoicePage from '@/pages/NewInvoicePage';
import SetupRequiredPage from '@/pages/SetupRequiredPage';

// The main screen loads with the app; the others load when first opened.
const InvoiceHistoryPage = lazy(() => import('@/pages/InvoiceHistoryPage'));
const InvoiceDetailPage = lazy(() => import('@/pages/InvoiceDetailPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/**
 * Routes
 *   /login          sign in (public)
 *   /               new invoice
 *   /invoices       history
 *   /invoices/:id   view / edit / re-download one invoice
 *   /settings       password, business details, sign out
 */
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <NewInvoicePage /> },
          { path: 'invoices', element: <InvoiceHistoryPage /> },
          { path: 'invoices/:id', element: <InvoiceDetailPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export default function App() {
  if (!isSupabaseConfigured) return <SetupRequiredPage />;
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
