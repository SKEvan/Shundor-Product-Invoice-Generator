/** Shown when the Supabase keys are missing (developer setup step, see README). */
export default function SetupRequiredPage() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-md rounded-2xl bg-white p-6 text-sm ring-1 ring-brand-100">
        <h1 className="text-lg font-semibold text-brand-700">Setup needed</h1>
        <p className="mt-2 text-gray-600">
          The app can’t find its database settings. Copy <code>.env.example</code> to <code>.env.local</code>, fill in{' '}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then restart the dev server.
        </p>
        <p className="mt-2 text-gray-600">
          On Vercel/Netlify, add the same variables in the project’s Environment Variables settings and redeploy.
        </p>
      </div>
    </div>
  );
}
