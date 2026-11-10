# Setup & deployment

This takes about 15 minutes once. Everything uses free tiers.

## 1. Create the Supabase project (backend)

1. Sign up at <https://supabase.com> and click **New project**.
2. Pick the region **closest to Bangladesh**: *South Asia (Mumbai)*, or *Southeast Asia (Singapore)*. This keeps saving fast.
3. Set a database password, save it somewhere safe, and wait for the project to start.

## 2. Create the database

1. In the project, open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/migrations/20261110000000_init.sql`](../supabase/migrations/20261110000000_init.sql) and click **Run**.
3. Check **Table Editor**. You should see `invoices`, `invoice_items` and `invoice_counters`.

## 3. Create the owner's login

1. **Authentication → Sign In / Providers**: keep **Email** enabled, and turn **off** "Allow new users to sign up". Now nobody else can create an account.
2. **Authentication → Users → Add user → Create new user**:
   - Email: `admin@shundorproduct.app`
   - Password: `Shundor@2026`
   - Tick **Auto Confirm User**

The owner signs in with:

| Username | Password |
| --- | --- |
| `admin` | `Shundor@2026` |

> The app adds `@shundorproduct.app` behind the scenes, because Supabase needs an email address. No email is ever sent.
> **Change the password after the first login:** Settings → Change password.

To use a different username, create the user as `<username>@shundorproduct.app`. To use a different domain, also set `VITE_AUTH_EMAIL_DOMAIN`.

## 4. Connect the app to Supabase

1. **Project Settings → API**. Copy the **Project URL** and the **anon / publishable** key. (Never use the `service_role` / secret key in the app.)
2. In the project folder:
   ```bash
   cp .env.example .env.local
   ```
   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run it:
   ```bash
   npm install
   npm run dev
   ```
   Open <http://localhost:5173> and sign in with `admin`.

## 5. Deploy (Vercel)

1. Push the project to a GitHub repository. `.env.local` is git-ignored and won't be uploaded.
2. On <https://vercel.com>, go to **Add New → Project** and import the repository. The framework is detected as **Vite**.
3. Under **Environment Variables**, add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_AUTH_EMAIL_DOMAIN`.
4. Click **Deploy**. `vercel.json` already handles page refreshes on routes like `/invoices/…`.

On Netlify it works the same way. Build command `npm run build`, publish directory `dist`; `public/_redirects` handles routing.

## 6. Install on the owner's Android phone

1. Open the site in **Chrome** and sign in.
2. Tap **⋮ → Add to Home screen / Install app**.
3. It now opens from its own icon, full-screen, and loads instantly. **Share** sends the invoice JPG straight into WhatsApp or Messenger.

## Good to know

- **Free Supabase projects pause after 7 days with no activity.** Daily use keeps the project awake. If it does pause, click **Restore** in the dashboard and nothing is lost.
- **Backups:** Table Editor → `invoices` → Export to CSV at any time.
- **Updates:** after you deploy a new version, the installed app updates itself the next time it's opened.
