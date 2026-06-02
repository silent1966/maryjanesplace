# Where form submissions go

Every form on the site is wired to **info@maryjanesplace.co.uk**:

- **Contact** (`/contact` and the form on `/visit`) → form name `contact`
- **Booking** (`/book`) → form name `booking`
- **Join / membership** (`/join`) → form name `join`
- All `mailto:` links (footer, contact, visit, returns, privacy, terms) → info@maryjanesplace.co.uk

Submissions are captured by **Netlify Forms** (stored on every deploy) and emailed by the
`netlify/functions/submission-created.js` function.

## To receive the emails — pick ONE (both is fine)

### Option A — Netlify built-in notification (zero code, ~1 min)
Netlify dashboard → your site → **Forms → Form notifications → Add notification →
Email notification** → send to `info@maryjanesplace.co.uk`. Done.

### Option B — Branded emails via the function (code-controlled)
1. Create a free account at https://resend.com and **verify the maryjanesplace.co.uk
   domain** (so mail can be sent *from* info@maryjanesplace.co.uk).
2. Create an API key.
3. Netlify → **Site config → Environment variables**, add:
   - `RESEND_API_KEY` = your key
   - (optional) `MAIL_TO` = info@maryjanesplace.co.uk (this is the default)
4. Redeploy. Every submission now emails info@maryjanesplace.co.uk, with the sender's
   email set as reply-to so you can reply directly.

If neither is set up yet, submissions are still safely stored in the Netlify dashboard
under **Forms** — nothing is lost.
