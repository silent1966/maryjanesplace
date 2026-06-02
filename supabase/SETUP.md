# Member portal — Supabase setup (one-time, ~10 minutes)

The portal page (`/portal`) is already built and deployed. It stays in a friendly
"launching soon" state until you connect Supabase. Do these steps and it goes live.

## 1. Create the Supabase project
1. Go to https://supabase.com → sign up (free) → **New project**.
2. Name it `maryjanesplace`, choose a region near the UK (London), set a database password.
3. Wait ~2 minutes for it to provision.

## 2. Create the database tables
1. In the project: **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this repo, copy all of it, paste, click **Run**.
   You should see "Success".

## 3. Turn on magic-link email
1. **Authentication → Providers → Email**: make sure **Email** is enabled and
   **"Confirm email" / magic link** is on (it is by default).
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://maryjanesplace.co.uk`
   - **Redirect URLs**: add `https://maryjanesplace.co.uk/portal`
     (and `http://localhost:4321/portal` if you ever test locally).

## 4. Get your two public keys
1. **Project Settings → API**.
2. Copy:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key (a long `eyJ...` string — this one is safe to expose)

## 5. Add the keys to Netlify
1. Netlify → your site → **Site configuration → Environment variables → Add a variable**.
2. Add these two (exact names):
   - `PUBLIC_SUPABASE_URL` = the Project URL
   - `PUBLIC_SUPABASE_ANON_KEY` = the anon public key
3. **Deploys → Trigger deploy → Deploy site** (so the build picks up the keys).

That's it. Visit `/portal`, enter your email, get the link, and you'll see your card,
member number and points. New members get a sequential ID automatically (MJP-2026-0001…).

## Adding loyalty points (staff)
Until the staff admin screen exists, add points from the Supabase dashboard:
**Table editor → members**, edit a row's `points`. (Editing via the dashboard uses the
service role, which is allowed; members can't change their own points.)

## Notes
- The **offline, no-data card** (`/join`) is unchanged and always available — the portal
  is the optional online upgrade.
- The anon key is *designed* to be public; security is enforced by Row Level Security in
  `schema.sql`, so members can only ever see their own row.
- Email sending uses Supabase's built-in mailer for now. For high volume or custom
  branding, connect your own SMTP under **Authentication → Emails** later.
