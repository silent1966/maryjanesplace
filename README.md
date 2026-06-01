# Mary Jane's Place — website

Britain's first patient sanctuary for prescribed medical cannabis. Flagship in Bournemouth, with a UK-wide network in development.

This is the official website. **Astro** + **GitHub** + **Netlify** + **Decap CMS** — all open-source, all free at this scale.

---

## TL;DR

- **Code lives in this GitHub repo.** Every commit to `main` auto-deploys to Netlify in ~30 seconds.
- **Content (hours, address, prices, products, blog, membership tiers, partner categories)** is edited at https://maryjanesplace.co.uk/admin via a friendly visual editor. No code needed.
- **Bigger changes (layout, new pages, code features)** — edit the Astro files, or ask Claude to do it.
- **The domain is configured once.** Then never touched.

---

## What's in this site

| Page | Path | What it does |
| --- | --- | --- |
| Home | `/` | National positioning, founding-member CTA, intro to the model |
| Medical Cannabis | `/medical-cannabis` | Patient education, plain-English law, FAQ |
| Your Rights | `/your-rights` | UK law sources directly cited |
| Membership | `/membership` | Three tiers (Patient · Plus · Founding), FAQ |
| Equipment | `/equipment` | Buy outright, rent monthly, plus repair/trade-in service |
| Blog | `/blog`, `/blog/[slug]` | SEO-led patient content, growing |
| Visit | `/visit` | Map, hours, house rules, contact form |
| About | `/about` | Story, mission |
| Partnerships | `/partnerships` | Six partner lanes — clinics, advocacy, industry, hospitality, media, future locations |
| For Police & Venues | `/for-police-and-venues` | NPCC document, official sources, patient summary card |
| CMS | `/admin` | Visual content editor (login required) |

## SEO infrastructure

- **Sitemap** auto-generated at `/sitemap-index.xml` (Google can find every page)
- **robots.txt** allows everything except `/admin/`, points to the sitemap
- **Structured data**: `Organization` + `LocalBusiness` JSON-LD on every page; `Article` schema on every blog post
- **Per-page meta** descriptions and canonical URLs throughout
- **Open Graph + Twitter cards** for clean social sharing
- **Site is positioned for national SEO** — content addresses UK patients broadly, Bournemouth is flagship not focus

## Membership tiers (current)

| Tier | Price | Built for |
| --- | --- | --- |
| Patient Member | Free (one-time verification) | Every verified patient — sanctuary access, peer community, basic perks |
| Patient Plus | £12/month | Active members — priority booking, 10% off equipment, magazine, partner perks |
| Founding Member | £35/month, cap of 250 | Mission supporters — private events, founder access, sanctuary listing |

Payments are not wired yet — currently "register interest" via the contact form (Netlify Forms, free). When ready to launch paid tiers, we'll add Stripe Checkout via a Netlify Function. Stripe charges per-transaction only; no monthly fee.

## Blog

Posts live in `src/content/posts/` as Markdown with frontmatter. The blog index lists them, the `[slug]` route renders them. Four seed posts are already live:

1. How to get a medical cannabis prescription in the UK in 2026
2. Vaping vs smoking medical cannabis — the legal and health difference
3. Stopped by police with a medical cannabis prescription? Here's exactly what to do
4. The best dry-herb vaporisers for UK medical cannabis patients in 2026

To add a new post: log into `/admin`, click Blog → Posts → New, write in markdown, publish. The site rebuilds automatically.

To generate SEO-led drafts faster, ask Claude (or any LLM) for a draft following the format of an existing post, then publish via `/admin`.

---

## Project structure

```
maryjanes/
├── public/
│   ├── logo.png              # Brand logo (transparent PNG)
│   ├── robots.txt
│   ├── admin/                # Decap CMS — visual editor
│   │   ├── index.html
│   │   └── config.yml
│   └── docs/                 # Downloadable PDFs (empty for now)
├── src/
│   ├── content/
│   │   ├── config.ts         # Content collection schemas
│   │   ├── site/settings.json  # All site settings + tiers + partners
│   │   ├── products/         # Equipment products (JSON per item)
│   │   └── posts/            # Blog posts (Markdown)
│   ├── layouts/Base.astro    # HTML shell + SEO + Organization+LocalBusiness schema
│   ├── components/           # Header, Footer, Hours
│   ├── pages/                # One file per URL
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── medical-cannabis.astro
│   │   ├── your-rights.astro
│   │   ├── for-police-and-venues.astro
│   │   ├── membership.astro
│   │   ├── partnerships.astro
│   │   ├── equipment.astro
│   │   ├── visit.astro
│   │   └── blog/
│   │       ├── index.astro
│   │       └── [...slug].astro
│   └── styles/global.css     # Theme: forest green + cream + Mulish
├── astro.config.mjs          # Sitemap integration
├── netlify.toml              # Build + .uk → .co.uk redirect + security headers
├── package.json
└── README.md
```

---

## Local development (optional, for developers)

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # builds to ./dist
```

---

## First-time deployment

### Stage 1 — GitHub
1. Sign up at github.com (free).
2. New repository → name `maryjanesplace` → Private → Create.
3. Drag-and-drop the unzipped project contents into the repo via the web UI. Commit.

### Stage 2 — Netlify
1. In Netlify, link `iridescent-beignet` site → Site configuration → Build & deploy → **Link site to Git** → choose the `maryjanesplace` GitHub repo.
2. Build settings auto-detect from `netlify.toml`. Deploy.
3. Domain management → add **`maryjanesplace.co.uk`** as **primary** domain.
4. At GoDaddy DNS for `maryjanesplace.co.uk`:
   - **A `@`** → `75.2.60.5`
   - **CNAME `www`** → `iridescent-beignet-ee077d.netlify.app`
   - Leave MX, SPF and Microsoft 365 records alone.

### Stage 3 — CMS
1. Netlify → Identity → **Enable Identity**.
2. Identity → Services → **Enable Git Gateway**.
3. Identity → Registration → **Invite only**.
4. Identity → Invite users → enter the editor emails. They get a magic-link login to `/admin`.

After this: site live, CMS ready, no DNS work ever again.

---

## What it costs

| Component | Cost |
| --- | --- |
| Astro / Decap CMS / Mulish font | Free, open-source |
| Netlify (hosting + forms + identity + functions) | Free tier |
| GitHub | Free (private repos included) |
| Domain (.co.uk and .uk) | Annual fee at GoDaddy (existing) |
| **Total recurring software cost** | **£0/month** |

Future Stripe integration (when paid tiers launch) is per-transaction only — no monthly fee.

---

## Contact

Mary Jane's Place · 7 Stafford Rd, Bournemouth BH1 1JH · hello@maryjanesplace.co.uk · 07922 431038
