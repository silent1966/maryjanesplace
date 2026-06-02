Single PR. No colour changes (palette variables untouched; the only non-global hex are the pre-existing in/out-of-stock dots in `shop/[slug].astro`). Build clean: **544 pages, zero errors, zero warnings**, sitemap regenerated.

> **Note on the static stack:** the site is static Astro on Netlify (no SSR adapter). So forms are wired with `data-netlify="true"` (email routing is set in the Netlify dashboard → set the notification address to **info@maryjanesplace.co.uk**, and test on the deployed site — I can't email-test from here). Member IDs are generated client-side and are unique-per-submission; truly *global-sequential* IDs and a dynamic `/member/[id]` need a serverless counter (v2) — verify page reads the ID from the URL, which is what the card QR encodes.

## Changed (with paths)
- **Pricing → .99** — `scripts/gen-products.mjs` (directional rounding: target rounds **down** to keep the ≥£1 undercut, floor rounds **up** above breakeven); regenerated all 520 `src/content/products/*.json`. **Venty £287.95 → £287.99**; every price ends `.99`.
- **Hours 8:30–22:30 daily** — `src/content/site/settings.json`, `src/layouts/Base.astro` (LocalBusiness JSON-LD single 7-day block).
- **18+ removed sitewide** → "valid prescription required"; "6 months" claim dropped — multiple pages.
- **WhatsApp** `wa.me/447922431038` — `src/components/Footer.astro`, `src/pages/contact.astro`.
- **Navigation restructured** — `src/components/Header.astro`: desktop **Shop · Lounge & Hire▾ · Members▾ · About▾ · Contact** (dropdowns, hover + click + keyboard, Esc-close); mobile drawer mirrors the **same groups** (Lounge & Hire / Members / About / More) — every previously-linked page preserved. `src/components/Footer.astro` links refreshed.
- **New routes** — `/join`, `/contact`, `/book`, `/member`, `/member-card-faq` (+ `src/components/MemberCard.astro`).
- **Membership rebuilt** — `src/pages/membership.astro`: one-sentence hero, single "Member" tier (£X/month placeholder, includes lounge/food & drinks/hire/loyalty/events), "Other options — enquire via Contact" → /contact, member-card preview, Join CTA. Cost-speculation FAQ removed.
- **Hire streamlined** — `src/pages/hire.astro`: 2 category cards (Vapes & Accessories / Lounge Facilities), "Browse, book a slot, pay on arrival."
- **Medical broadened** — `src/pages/medical-cannabis.astro`: administration methods (vapour/oils/capsules/edibles), strain types, vapour-only-on-premises line; dosing kept.
- **Blog cleaned** — `src/content/posts/*.md`: banned words + all hardcoded prices stripped (→ /shop), preachy lines rewritten.
- **Shop filters (section 15, clutter reduction)** — `src/pages/shop.astro`: price pills **4→3 tiers** (£0–50 / £50–200 / £200+), **active-filter chips + Clear all**. The approved left-sidebar layout was kept (already clean, not overloaded on desktop).
- **Site-wide tone/CTA polish** — about, your-rights, vaping-lounge, partnerships, for-police-and-venues, visit, returns, terms, privacy: wet/preachy/sales copy cut, CTAs standardised ("Plan your visit", "Book a slot", "Join", "Browse the shop"), "private room"→"lounge".
- **Mobile** — `src/styles/global.css` + `src/pages/shop.astro`: inputs 16px (no iOS zoom), tap targets ≥40px, `min-width:0` overflow fix at 320px, product-card photos get breathing room on phones; `hireAvailable` CMS field added (`src/content/config.ts`, `public/admin/config.yml`).

## Already correct before this PR — no change needed
- Product CDN images, blended-image styling, sitemap wiring, SEO/JSON-LD per product, CMS↔schema parity (other than the new `hireAvailable` field).

## Verification
- **Member ID / name-only**: `/join` requires only Full name; all other fields labelled "(optional)"; submit generates `MJP-2026-NNNN` and shows it + a live digital card. (Client-generated unique IDs — see static-stack note.)
- **Booking duration**: `/book` lounge slots are user-selectable 15 → 180 minutes in 15-minute steps, group 1–4, within 8:30–22:30.
- **Pricing**: Venty £287.99 verified; all 520 prices end `.99`.
- **Nav**: desktop dropdowns open (Membership/Join/Member card etc.); mobile drawer grouped; no header overflow.
- **Routes**: /join, /contact, /book, /member, /member-card-faq all built and in the sitemap; 3 Netlify forms detected in built HTML.
- **Banned words**: grep across pages/components/posts = 0.
- **Colours**: no new palette variables or new hex outside global.css (pre-existing stock-dot greens/reds untouched).
- **Build**: clean (zero errors, zero warnings).

## Manual checklist for you (needs the deployed site)
- [ ] In Netlify → Forms, set the notification email to **info@maryjanesplace.co.uk**; then test /contact, /join, /book submissions land there.
- [ ] Test /join with **name only** three times → three unique Member IDs + confirmation card.
- [ ] Test /book — pick a 15-min slot and a 3-hour slot; confirm email arrives.
- [ ] Test the WhatsApp link (wa.me/447922431038) opens a chat.
- [ ] Verify .99 prices and shop filters/chips feel clean on mobile + desktop.
- [ ] Confirm the Netlify deploy is green.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
