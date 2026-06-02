> **One PR, everything.** This branch contains the full shop launch (523 products, real images, MJP-voice copy, shop/product/header UX, SEO/CMS) **plus** the refinements below. The "Enquire to buy" CTA is unchanged; no Stripe/cart yet.

Builds on the shop launch with a simplified pricing model, full competitor coverage on the hero tier, a mobile layout fix, a tone audit, and logo/marketing polish.

## 1. Pricing — two rules, nothing else

Replaced the old multi-factor formula in `scripts/gen-products.mjs` and regenerated all 523 prices.

- **Rule 1 — never lose money:** `FLOOR = (T + 8.19) / 0.8183` (T = RN trade; 8.19 = £7.99 ship + £0.20 Stripe fixed; 0.8183 = 1 − VAT 16.67% − Stripe 1.5%). Break-even only — no margin padding.
- **Rule 2 — beat every UK competitor by £1:** `TARGET = competitor_min − £1.00`.
- **FINAL = max(FLOOR, TARGET).** No ×2.2 cap, no buffer.
- Rounding: TARGET wins → round **down** to .95; FLOOR wins → round **up** to .95.
- Fallback (no competitor data): MAP brand → `compare_at − £1`; non-MAP → `T × 1.85`.

**Sanity check passes** — Venty (trade £219, cheapest UK £289) → **£287.95**.

| Product | RN trade | Cheapest UK | Our price | vs market |
|---|---|---|---|---|
| S&B Venty | £219 | £289 | **£287.95** | −£1.05 |
| S&B Volcano Hybrid | £289 | £385 | **£383.95** | −£1.05 |
| Arizer Solo 3 | £152.90 | £217.99 | **£216.95** | −£1.04 |
| DynaVap VonG Starter Kit | £99 | £147 | **£145.95** | −£1.05 |
| Mighty+ Medic | £199 | £259 | **£257.95** | −£1.05 |
| PAX Four | £99.50 | £189 | **£187.95** | −£1.05 |

**Distribution (523 products):** mean markup **2.72×** (was 3.47×).
- Priced to beat / at target: **196**
- Priced at floor (break-even, market below our floor): **327**
- With a real competitor price: **109** — of which **79 beat the cheapest UK price by £1** and **30 are floor-prevented** (see below).
- No competitor price (fallback formula): **414**.

### Floor-prevented products — handled, not listed at silly prices
On **30** products the RN trade cost is at or above the cheapest UK retail price, so Rule 1 would force a price *above* market. Rather than show an uncompetitive number, these are now:
- **Marked out of stock** with a calm "Not available to order online right now — contact us for availability and price" message;
- **Price hidden** ("Price on enquiry" on the card and product page);
- **Tagged `price-review`** so you can find them instantly in `/admin` (filter/search by tag) and decide: drop, renegotiate RN trade, or keep as enquire-only;
- **Removed from the featured row** (we don't feature what we can't sell competitively).

Examples (RN trade ≥ cheapest UK): Puffco Peak Pro (£339 vs £289), S&B Volcano Medic 2 (£305 vs £350… via medical channel), Boundless DV8 (£135 vs £115), Aromed 4.0, DaVinci Artiq. Full list = the 30 products tagged `price-review`.

## 2. Competitor scope expanded

`scripts/competitor-prices.json` now has **109 products** with real UK prices (was 56). Added the top-100-by-trade hero tier (Storz & Bickel, Puffco, Arizer, DynaVap, PAX) — **53 new products, most with 3+ sources each**. Sources span the approved list plus other UK specialist stores and medical dispensaries surfaced during research (magicvaporizers, vapefiend, herbalize, namaste, vapemountain, drop-vapes, cosmictree, greatvapes, cloudninevapes, maryjanevapes, tvape, vaporizerhut, montu, cannabisdispensary, etc.). Sale/flash prices were discarded in favour of standing prices.

## 3. Mobile layout fix

Root cause: the **footer grid columns** had default `min-width: auto`, so they sized to their longest link and pushed the page wider than the viewport — horizontal overflow that read as bottom content being cut/covered on mobile. Audited every fixed/sticky element (header, search overlay, drawer, sticky shop filters) — the only always-on fixed element is the top header; there is no bottom-fixed element. Fixes:
- `.foot-grid` tracks → `minmax(0, 1fr)` and `.fcol { min-width: 0 }` (kills the overflow at 320/375/414px).
- Sticky shop-filters offset updated for the taller header.

## 4. Tone audit (neutral / clinical)

The site was already largely factual-legal; combustion/smoke-free mentions are the **legal prescription mechanism** (kept, stated calmly). Removed the one health-superiority claim and the banned word:
- `src/content/posts/vaping-vs-smoking-medical-cannabis-uk.md` — removed "Not because it's healthier — though it is" → "This isn't about health claims — it's because the legislation…".
- `src/pages/partnerships.astro` — "future-sanctuary founders" → "future safe-space founders".

No "healthier choice / safer alternative / say goodbye to smoking" phrasing was present elsewhere.

## 5. Logo + marketing polish

- **Logo enlarged ~44%**: header 64→92px desktop, 56→78px (≤980), 48→66px (≤680); footer 70→88px. Header offsets (hero padding, sticky filters) adjusted so nothing is overlapped.
- **Reveal animation no longer loses content**: the fade-in now triggers as soon as content enters, reveals everything if reduced-motion/JS-off, and has a failsafe that force-reveals after 1.4s and on reaching the page bottom — so scrolled-past or tall sections are never left invisible.
- **Scroll affordance**: a subtle "More below ⌄" cue on the homepage hero that fades out once you scroll — so it's obvious there's more content.
- **Mobile breathing room**: increased section padding (`.pad` 56→64, `.pad-sm` 36→48), grid gaps, and side padding to reduce density on small screens.
- **Homepage**: added a primary **"Shop devices"** CTA and **"Free UK delivery over £60"** + "matched or beaten on UK price" trust signals above the fold.
- Verified no lorem/placeholder text remains.

## 6. Build & checklist

`npm run build` completes clean (zero errors, zero warnings); 542 pages, sitemap regenerated; all 523 product JSONs validate; CMS config unchanged and in sync.

Manual checklist:
- [ ] Verify Netlify deploy is green
- [ ] Spot-check 5 product pages incognito (mobile + desktop)
- [ ] **Review the 30 `price-review`-tagged products** in `/admin` — they're set out-of-stock/enquire with the price hidden; drop them, renegotiate RN trade, or keep as enquire-only
- [ ] Enable Netlify Identity for CMS (later, separate)
- [ ] Wire Stripe checkout (later, separate)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
