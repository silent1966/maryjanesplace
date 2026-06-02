Ships the complete Retail North (RN) catalogue as the Mary Jane's Place shop in one PR — real products, real photos, MJP-voice copy, cheapest-where-it-matters pricing, and the shop UX upgrades. No Stripe/cart yet; the existing **"Enquire to buy"** CTA is unchanged.

## 1. Counts

| | Count |
|---|---|
| Source rows in catalogue | 826 |
| **Included (live products)** | **523** |
| Excluded | 303 |
| Unprofitable-skipped | 0 |

**Excluded breakdown**

| Reason | Count |
|---|---|
| All variants out of stock | 222 |
| Bong / water pipe / pipe / gravity infuser (vaporiser-only rule) | 63 |
| Wholesale / display bulk units (not retail-suitable) | 15 |
| Non-product / fee (Payment Method, "Tree to be Planted") | 2 |
| No valid trade price | 1 |

> **Unprofitable-skipped = 0.** Final price is `max(floor, min(ceiling, T×2.2))`, which is always ≥ the 20%-net-margin floor, so nothing is ever sold at a loss. Where the cheapest UK price sits *below* our floor, the product is kept and priced **at floor** (profitable but not the cheapest) and counted as such below — matching the PR-spec's "priced at floor (profitable but not cheapest)" bucket.
>
> **0 nicotine products** were found in the catalogue (it is a cannabis-vaporiser catalogue), so no nicotine exclusions were needed.

## 2. Category breakdown

| Category | Count |
|---|---|
| Accessories | 310 |
| Portable vapes | 74 |
| Batteries | 27 |
| 510 batteries (cartridge) | 22 |
| Grinders | 19 |
| Cases | 19 |
| Pen vapes | 15 |
| Desktop vapes | 13 |
| Cleaning | 10 |
| Storage | 10 |
| Concentrate rigs (dab-rigs) | 4 |
| **Total** | **523** |

## 3. Pricing summary

Pure dropship model only: trade cost `T` (ex-VAT) + £7.99 RN shipping + Stripe (1.5% + £0.20) + 16.67% VAT to HMRC + 20% net margin. No padding.

- **Mean markup ratio (final ÷ trade): 3.47×**  ·  **median: 2.75×**
  - The mean is inflated by low-trade accessories: the floor folds in fixed per-order costs (£7.99 shipping absorbed worst-case + £0.20 Stripe), so a £2–4 trade item still floors around £15–17. This is the formula as specified, not padding. Worth a pass during your pricing review.
- **Priced at ceiling (cheapest in UK / 5% under): 17**  — premium lines where the market price sits above our floor (e.g. Peak Pro, Switch 2, Aromed 4.0, Volcano, IQ3).
- **Priced at floor (profitable but not cheapest): 506.**
- **Pricing source:**
  - MAP-brand formula (Storz & Bickel, PAX, Puffco, Arizer, DynaVap, Tinymight/Volcano): **61** — `compare_at × 0.95`, or `T × 1.75 × 0.95` where no compare price exists (only 4 rows had one).
  - Real competitor price (approved UK retailers): **56** matched 1:1 from batched research.
  - Sub-£40 trade (formula only, scan not worth it): **400**.
  - Fallback `T × 1.85` (non-MAP ≥£40, no competitor price found): **6**.
- **Products with no competitor price found:** the 400 sub-£40 + 61 MAP-formula + 6 fallback = **467** priced by formula; **56** carry a real cheapest-UK price.

All prices rounded to the `.95` UK convention.

## 4. UX additions

**Shop (`shop.astro`)**
- Live client-side search (name / brand / tags) above the category pills
- Brand filter dropdown next to the sort dropdown
- Price-range pills: £0–50, £50–150, £150–300, £300+
- "Showing X of Y products" live count
- Lazy-loaded images; empty categories auto-hidden

**Product page (`shop/[slug].astro`)**
- Image gallery: large primary + thumbnail strip, click-to-swap
- Pure-CSS hover zoom (no library)
- "More from \<brand\>" (4 same-brand) + existing "More in \<category\>"
- "Recently viewed" (last 6, localStorage)
- Free-delivery callout: "You're £X away from free UK delivery"

**Header (`Header.astro`)**
- Desktop search icon → full-screen search overlay (submits to `/shop?q=`)
- Search input at the top of the mobile drawer

**Visual**
- `mix-blend-mode: multiply` so white manufacturer photos blend into the cream cards.

**Pre-flight checks (all green):** `npm run build` completes with **zero errors and zero warnings**; all 523 product JSONs validate against the (unchanged) Zod schema; every `image`/`gallery` reference is a valid HTTPS CDN URL (1,383 refs, 0 empty, sampled HEAD checks all 200); `/admin/config.yml` matches `config.ts` with no field drift; all 523 product URLs appear in `sitemap-index.xml`.

## 5. Notes for you (manual checklist)
- [ ] Verify the Netlify deploy is green
- [ ] Spot-check ~5 product pages incognito
- [ ] Enable Netlify Identity for CMS access (later, separate)
- [ ] Wire Stripe checkout (later, separate)
- [ ] Review pricing — adjust outliers via `/admin` once Identity is on (esp. low-trade accessories carrying high markup ratios from the fixed-cost floor)

### Implementation notes
- **Images** reference RN's Shopify CDN directly (no `/public` download) for speed — a follow-up can self-host them.
- **Copy:** 106 device-tier products (portable/desktop/pen/dab-rig + all featured) have hand-written MJP-voice copy; the remaining accessories use cleaned, UK-English, banned-word-free copy derived from the source listings. 0 banned words across the catalogue.
- **Build:** content collections were migrated to Astro 5 `glob()` loaders to clear deprecation/glob warnings — **the Zod schema itself is unchanged** — and the blog was updated to the `render()` API to match.
- **Reproducible:** generation lives in `scripts/` (`gen-products.mjs`, competitor + copy data). Re-run with `node scripts/gen-products.mjs`.
- Two pre-existing uses of the banned word "sanctuary" live outside the shop (`partnerships.astro` meta description; fixed in `package.json`). The partnerships one is flagged as a separate follow-up to keep this PR scoped.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
