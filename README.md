# Shundor Product — Invoice App

A small web app for **Shundor Product**. The owner pastes a buyer's order message, types the prices, and gets a branded invoice to **download as PDF/JPG** or **share straight to WhatsApp/Messenger**.

- Works on PC and Android Chrome. It can be installed like an app (PWA) and opens instantly after the first visit.
- Invoice numbers run per month: `SP-2611-001`, `SP-2611-002`, … and restart at `001` each month (`2611` = 2026 November).
- One shared database, so the PC and the phone see the same invoices and never clash on numbers.
- Single user (the owner). Sign-up is disabled.

First-time setup (database, login, deploy): **[docs/SETUP.md](docs/SETUP.md)**

---

## Tech stack

| Layer | Tool | Why |
| --- | --- | --- |
| UI | React 19 + TypeScript | Standard, typed, component-based |
| Build | Vite 8 | Fast dev server and small production bundles |
| Styling | Tailwind CSS 4 | Brand colours defined once in `src/styles/index.css` |
| Routing | React Router 7 | `/`, `/invoices`, `/invoices/:id`, `/settings`, `/login` |
| Backend | Supabase (Postgres + Auth) | Shared storage, login and atomic invoice numbering. No server code to host |
| Export | html-to-image + jsPDF | Captures the on-screen invoice, so PDF/JPG match the preview exactly |
| Offline/fast | vite-plugin-pwa | Caches the app on the device; installable on Android |
| Tests | Vitest | Unit tests for the parser and calculations |

---

## Folder structure

```
Shundor Product/
├── Memo/                        Original brand files (not used directly by the app)
├── docs/SETUP.md                Step-by-step setup & deployment guide
├── public/                      Static files served as-is (favicon, PWA icons)
├── supabase/
│   └── migrations/              ← BACKEND: database tables, security rules, functions (SQL)
├── src/                         ← FRONTEND
│   ├── main.tsx                 Entry point: loads fonts + styles, mounts <App/>
│   ├── App.tsx                  Route table (which page shows at which URL)
│   ├── assets/                  Images bundled into the app (logo)
│   ├── config/                  Business constants you may edit
│   │   ├── business.ts            phone numbers, bKash/Nagad, delivery charges
│   │   ├── dhakaAreas.ts          area names used to detect Inside/Outside Dhaka
│   │   └── env.ts                 reads the .env variables
│   ├── types/                   TypeScript shapes (Invoice, InvoiceItem, ParsedOrder…)
│   ├── services/                ← the ONLY code that talks to Supabase
│   │   ├── supabaseClient.ts      creates the client
│   │   ├── authService.ts         sign in / out, change password
│   │   ├── invoiceService.ts      create, update, get, list, delete invoices
│   │   └── invoiceMapper.ts       converts DB rows (snake_case) ↔ app objects (camelCase)
│   ├── utils/                   Pure logic (no React, no network), unit-tested
│   │   ├── order/                 ★ reads pasted order messages (any format)
│   │   │   ├── parseOrder.ts        main entry: message → customer, items, charges
│   │   │   ├── labels.ts            field labels (নাম:, Name, Phone…), template header/footer
│   │   │   ├── lineClassifier.ts    guesses unlabelled lines: phone / address / name
│   │   │   ├── moneyLines.ts        "Price 500tk", "Delivery 120", "Cod 620", "Advance 80 bkash"
│   │   │   └── itemParser.ts        "Lipstick Red x2, Bag Black 1" → items (qty, colour, price)
│   │   ├── delivery.ts            guesses Inside/Outside Dhaka
│   │   ├── phone.ts               cleans BD mobile numbers (+880, Bangla digits…)
│   │   ├── invoiceCalc.ts         subtotal / total / amount due
│   │   ├── invoiceDraft.ts        empty draft, validation, comparisons
│   │   ├── invoiceExport.ts       JPG / PDF generation, download, share
│   │   ├── format.ts              money and date formatting
│   │   └── *.test.ts              tests next to the code they test
│   ├── hooks/                   Reusable React state logic
│   │   ├── useInvoiceDraft.ts     form state (reducer) for one invoice
│   │   ├── useInvoiceExport.ts    save → render → download/share
│   │   ├── useInvoiceList.ts      history list with search + "load more"
│   │   └── useAuth.ts             current session
│   ├── context/                 AuthProvider (shares the login session app-wide)
│   ├── components/
│   │   ├── ui/                    Generic building blocks: Button, Card, Alert, fields
│   │   ├── layout/                AppLayout (header + phone tab bar), ProtectedRoute
│   │   └── invoice/               Invoice-specific pieces
│   │       ├── InvoiceEditor.tsx    the whole workflow, used by New + Detail pages
│   │       ├── InvoiceDocument.tsx  ★ the invoice design that gets exported
│   │       ├── InvoicePreview.tsx   scales the A4 invoice to fit a phone screen
│   │       ├── PasteOrderBox.tsx, CustomerSection.tsx, ItemsSection.tsx,
│   │       │   ChargesSection.tsx, ExportBar.tsx, InvoiceListItem.tsx
│   ├── pages/                   One file per screen (route)
│   └── styles/index.css         Tailwind + brand colour palette
├── index.html                   HTML shell
├── vite.config.ts               Build, PWA and test config
└── vercel.json                  SPA routing for Vercel (public/_redirects for Netlify)
```

**Rule of thumb:** pages compose components → components use hooks → hooks call services/utils → services talk to Supabase. Nothing outside `services/` imports Supabase.

---

## How an invoice is made

```
Paste order text ──► utils/order/parseOrder ──► form (draft) ──► live preview (InvoiceDocument)
                                              │
              owner types prices / edits      │  tap PDF / JPG / Share
                                              ▼
                     services/invoiceService.createInvoice()
                     → Postgres function create_invoice()  (assigns SP-YYMM-NNN atomically,
                                                             recalculates totals)
                                              ▼
                     utils/invoiceExport → JPG/PDF → download or Android share sheet
```

- The invoice is **saved on its first download or share**, which is when it gets its number. Later downloads reuse the same number. If you edit a saved invoice, the next download updates it and the number stays the same.
- Totals are calculated in the browser for the preview **and** again in the database (`private.recalculate_totals`), so stored numbers are always consistent.
- Unsaved work on the New invoice screen is kept in the browser, so a reload or a closed tab doesn't lose it.

### Order formats it understands

Paste any of these and the form fills itself. Anything it can't find is listed under "Please check".

| Format | Example |
| --- | --- |
| Bangla template | `নাম: …` / `মোবাইল নম্বর( English): …` / `ঠিকানা: …` / `থানা: …` / `পন্যের নাম/রঙ: …` |
| English labels (colon optional) | `Name: Tania`, `Phone 017…`, `Address - …`, `Items:` |
| No labels at all | `Samiya` / `8801722922527` / `Baridiya, Faridpur…` / `Kitty clock` |
| Everything on one line | `Mitu, 01611223344, House 22 Road 3 Mohammadpur` |

**Prices and charges are filled when the message has them:** `Kitty clock 500tk`, a `Price 500tk` line under a product (`350 tk each` means per piece), `Delivery 120tk`, `Discount 50`, `Advance 80 bkash`, `Total 1,070`, `Cod 620tk`.
- If the message gives **COD** but no advance, the advance is worked out: COD 620 on a Tk 620 total means nothing was paid in advance.
- If the message's COD doesn't match the invoice, it warns you.
- Without any of these, the template defaults apply: Tk 80/120 by zone, paid in advance.

### Money rules
```
Subtotal    = Σ (quantity × unit price)
Total       = Subtotal + Delivery charge − Discount
Amount due  = Total − Advance paid          (collected in cash on delivery)
```
Delivery charge defaults to Tk 80 (Inside Dhaka) / Tk 120 (Outside Dhaka). Advance paid defaults to the delivery charge.

---

## Scripts

```bash
npm install          # once
npm run dev          # local dev server → http://localhost:5173
npm test             # unit tests (parser, phone, delivery, totals)
npm run typecheck    # TypeScript check
npm run build        # production build into dist/
npm run preview      # serve the production build locally
```

## Common changes

| I want to… | Edit |
| --- | --- |
| Change a phone number, bKash/Nagad, delivery charge | `src/config/business.ts` |
| Fix an area that's detected as the wrong zone | `src/config/dhakaAreas.ts` |
| Teach the parser a new colour word | `COLORS` in `src/utils/order/itemParser.ts` |
| Teach it a new money word (e.g. "Condition") | `MONEY_LABELS` in `src/utils/order/moneyLines.ts` |
| Change the invoice design | `src/components/invoice/InvoiceDocument.tsx` |
| Change brand colours | `@theme` in `src/styles/index.css` |
| Change the invoice number format | `create_invoice` in the SQL migration (write a new migration) |
