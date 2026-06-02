// Generates src/content/products/*.json from the RN trade catalog.
// Pure dropship pricing, MJP voice copy, category mapping, featured/order.
// Re-runnable. Reads optional scripts/competitor-prices.json for real ceilings.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CATALOG = process.env.CATALOG || "C:/Users/surface_owner/Downloads/rn-trade-catalog.json";
const OUT_DIR = path.join(ROOT, "src/content/products");
const COMP_FILE = path.join(__dirname, "competitor-prices.json");
const MANIFEST = path.join(__dirname, "image-manifest.json");
const STATS = path.join(__dirname, "gen-stats.json");

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const competitor = fs.existsSync(COMP_FILE) ? JSON.parse(fs.readFileSync(COMP_FILE, "utf8")) : {};

// MJP-voice copy overrides written by the batch copy agents (scripts/copy-out/*.json).
// These take precedence over deterministic copy for the device-tier / featured products.
const COPY_OVERRIDES = {};
const copyOutDir = path.join(__dirname, "copy-out");
if (fs.existsSync(copyOutDir)) {
  for (const f of fs.readdirSync(copyOutDir).filter((x) => x.endsWith(".json"))) {
    try {
      const obj = JSON.parse(fs.readFileSync(path.join(copyOutDir, f), "utf8"));
      for (const [h, v] of Object.entries(obj)) if (v && v.summary && v.description) COPY_OVERRIDES[h] = v;
    } catch (e) { console.warn("bad copy-out file", f, e.message); }
  }
}

// ---------- text cleaning ----------
const MOJI = [
  ["вЂ™", "’"], ["вЂ˜", "‘"], ["вЂњ", "“"], ["вЂ", "”"],
  ["вЂ”", "—"], ["вЂ“", "–"], ["вЂ¦", "…"], ["вЂў", "•"],
  ["вЂ", "—"], ["Г—", "×"], ["Гј", "ü"], ["Г¶", "ö"],
  ["Г¤", "ä"], ["Г©", "é"], ["Г¨", "è"], ["ГŸ", "ß"],
  ["Гў", "â"], ["Г ", "à"], ["Г§", "ç"], ["Г±", "ñ"],
  ["В°", "°"], ["В·", "·"], ["В®", "®"], ["в„ў", "™"],
  ["вЂ‘", "-"], ["Вј", "¼"], ["ВЅ", "½"], ["В ", " "], ["Â", ""],
];
function fixMoji(s) {
  if (!s) return "";
  for (const [a, b] of MOJI) s = s.split(a).join(b);
  return s;
}
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&rsquo;/g, "’").replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“").replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—").replace(/&ndash;/g, "–")
    .replace(/&deg;/g, "°").replace(/&times;/g, "×")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
// US -> UK English (curated, word-boundaried, case-preserving where simple)
const UKMAP = [
  [/vaporizer/gi, "vaporiser"], [/vaporize/gi, "vaporise"], [/vaporized/gi, "vaporised"],
  [/vaporizing/gi, "vaporising"], [/vaporization/gi, "vaporisation"], [/\bvapor\b/gi, "vapour"],
  [/\bcolor\b/gi, "colour"], [/\bcolors\b/gi, "colours"], [/\bcolored\b/gi, "coloured"],
  [/\bflavor\b/gi, "flavour"], [/\bflavors\b/gi, "flavours"], [/\bflavored\b/gi, "flavoured"],
  [/\bodor\b/gi, "odour"], [/\bodors\b/gi, "odours"],
  [/customizable/gi, "customisable"], [/customize/gi, "customise"], [/customized/gi, "customised"],
  [/optimize/gi, "optimise"], [/optimized/gi, "optimised"], [/organize/gi, "organise"],
  [/\bfiber\b/gi, "fibre"], [/\bfibers\b/gi, "fibres"], [/\bgray\b/gi, "grey"],
  [/aluminum/gi, "aluminium"], [/\bmold\b/gi, "mould"], [/\bmolded\b/gi, "moulded"],
  [/traveling/gi, "travelling"], [/traveled/gi, "travelled"], [/\bcenter\b/gi, "centre"],
  [/\bdefense\b/gi, "defence"], [/maximize/gi, "maximise"], [/minimize/gi, "minimise"],
  [/optimizing/gi, "optimising"], [/customizing/gi, "customising"], [/organizing/gi, "organising"],
  [/customization/gi, "customisation"], [/organization/gi, "organisation"], [/organized/gi, "organised"],
  [/maximizing/gi, "maximising"], [/minimizing/gi, "minimising"], [/categorize/gi, "categorise"],
];
function ukEnglish(s) { for (const [re, to] of UKMAP) s = s.replace(re, (m) => matchCase(m, to)); return s; }
function matchCase(src, repl) {
  if (src === src.toUpperCase()) return repl.toUpperCase();
  if (src[0] === src[0].toUpperCase()) return repl[0].toUpperCase() + repl.slice(1);
  return repl;
}
function clean(s) { return decodeEntities(fixMoji(String(s || ""))).replace(/\s+/g, " ").trim(); }
function stripTags(html) { return clean(String(html || "").replace(/<[^>]+>/g, " ")); }

// pull plain-text paragraphs and list items in order
function htmlBlocks(html) {
  html = fixMoji(String(html || ""));
  const blocks = [];
  const re = /<(p|li|h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase();
    const txt = clean(decodeEntities(m[2].replace(/<[^>]+>/g, " ")));
    if (txt) blocks.push({ tag, txt });
  }
  return blocks;
}

// ---------- spec extraction ----------
// Canonical spec labels we trust. Maps many source label variants to a clean label.
const SPEC_LABELS = [
  [/^(type|device type|product type)$/i, "Type"],
  [/^(heating|heating (method|system|type)|heat(ing)? technology)$/i, "Heating"],
  [/^(heat[- ]?up( time)?|warm[- ]?up( time)?|ready time)$/i, "Heat-up time"],
  [/^(battery|battery type|cell|power)$/i, "Battery"],
  [/^(battery life|usage time|session(s)? per charge|run time|runtime)$/i, "Battery life"],
  [/^(temp(erature)?( range)?|temperature settings?|temp settings?)$/i, "Temperature range"],
  [/^(charging|charge time|charging time|charger|usb)$/i, "Charging"],
  [/^(material|materials|housing|body material)$/i, "Material"],
  [/^(chamber|oven|bowl|chamber material|oven capacity|capacity|bowl capacity)$/i, "Chamber"],
  [/^(warranty|guarantee)$/i, "Warranty"],
  [/^(made in|country of origin|origin|manufactured in)$/i, "Made in"],
  [/^(dimensions?|size|measurements)$/i, "Dimensions"],
  [/^(weight)$/i, "Weight"],
  [/^(compatible|compatibility|compatible with|fits|works with)$/i, "Compatibility"],
  [/^(airflow|air path|vapor(?:our)? path)$/i, "Vapour path"],
  [/^(display|screen)$/i, "Display"],
  [/^(humidity|humidity level|rh)$/i, "Humidity level"],
  [/^(contents|in the box|what'?s included|includes|included)$/i, "In the box"],
  [/^(quantity|count|pack|pack size|pieces|pcs)$/i, "Quantity"],
  [/^(diameter|thread|connection)$/i, "Fitting"],
];
function canonLabel(label) {
  const l = clean(label).replace(/:$/, "").trim();
  for (const [re, canon] of SPEC_LABELS) if (re.test(l)) return canon;
  return null;
}
function extractSpecs(html, p, category) {
  const specs = [];
  const seen = new Set();
  const add = (rawLabel, value) => {
    const label = canonLabel(rawLabel);
    if (!label) return; // only trusted labels
    value = ukEnglish(clean(decodeEntities(value))).replace(/^[:\-–—\s]+/, "");
    if (!value || value.length < 2 || value.length > 70) return;
    // reject run-on "included list" style values masquerading as a single attribute
    if (label !== "In the box" && /(?:,|\band\b).*(?:,|\band\b).*(?:,|\band\b)/i.test(value)) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    specs.push({ label, value });
  };
  html = fixMoji(String(html || ""));
  // table rows: <td>label</td><td>value</td>
  const rowRe = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let r;
  while ((r = rowRe.exec(html))) add(r[1].replace(/<[^>]+>/g, " "), r[2].replace(/<[^>]+>/g, " "));
  // "Label: value" list items / paragraphs
  for (const b of htmlBlocks(html)) {
    if (b.tag !== "li" && b.tag !== "p") continue;
    const mm = b.txt.match(/^([A-Za-z][A-Za-z0-9 /+\-()]{1,28}):\s+(.{2,70})$/);
    if (mm) add(mm[1], mm[2]);
  }
  // regex-derived specs from full plain text
  const txt = stripTags(html);
  const grab = (re, label, fmt = (m) => m[1]) => {
    if (seen.has(label.toLowerCase())) return;
    const m = txt.match(re);
    if (m) add(label, fmt(m));
  };
  grab(/made in ([A-Z][a-zA-Z]+)/, "Made in");
  grab(/(\d+)[- ]?year(?:s)? warranty/i, "Warranty", (m) => `${m[1]} years`);
  grab(/heats? up in (?:just |around |approx\.? )?(~?\s?\d+[\d\s\-tosec.]*?(?:seconds|secs?|minutes|mins?))/i, "Heat-up time", (m) => clean(m[1]));
  grab(/(\d{2,3}\s?[°º]?\s?[-–to]+\s?\d{2,3}\s?[°º]?\s?[CF])/i, "Temperature range", (m) => clean(m[1]).replace(/º/g, "°"));
  return specs;
}

// ---------- category mapping ----------
const EXCLUDE_TYPES = new Set(["pipes", "bong", "mws_fee_generated"]);
function resolveCategory(p) {
  const t = clean(p.product_type).toLowerCase();
  const n = clean(p.name).toLowerCase();
  const vendor = clean(p.vendor).toLowerCase();
  const tags = (p.tags || []).map((x) => clean(x).toLowerCase()).join(" ");
  const hay = n + " " + tags;
  const has = (...ks) => ks.some((k) => hay.includes(k));

  // DynaVap-style manual/thermal pens — RN types these "Portable", but the brand
  // mapping says DynaVap-style no-battery pens => pen-vapes.
  const ACC_DYNA = /\b(cap|condenser|o-?ring|mouthpiece|tip|screen|coil|adaptor|adapter|stash|grynd|bank|mag|torch|armor|armour|station|wand|spinner|dynacoil|ccd|dynakit|restore kit)\b/i;
  if (/dynavap/.test(vendor)) {
    if (/grynd/.test(n)) return "grinders";
    if (/stash|slingstash/.test(n)) return "storage";
    if (/induction heater|\bheater\b/.test(n)) return "accessories";
    const isDevice = /\b(m\s?7|m\s?plus|m\+|the m\b|the b\b|b2\b|\bg3\b|vong|unidyn|hyperdyn|woodwynd|omni|fall colors)\b/i.test(n) && !ACC_DYNA.test(n);
    if (isDevice || /starter (kit|pack)/i.test(n)) return "pen-vapes";
    return "accessories";
  }
  // Lotus / Vapman flame-heated manual vaporisers (no battery, DynaVap-style)
  if (/^lotus vaporizer kit$|^vapman click$/i.test(n)) return "pen-vapes";

  // hard accessory/consumable signals first (the 547 "Accessories" bucket lives here)
  if (has("grinder") && !has("grinder card")) return "grinders";
  if (/\b510\b/.test(hay) || has("cartridge", "carto", " pod ", "pod cartridge", "pods")) {
    if (has("battery", "510 battery", "vape pen battery")) return "cartridge-batteries";
    if (has("cartridge", "pod")) return "cartridge-batteries";
  }
  if (t === "510 battery") return "cartridge-batteries";
  if (has("isopropyl", "iso ", "cleaning", "alcohol wipe", "cleaning brush", "cleaning kit", "pipe cleaner", "cleansing", "cotton swab", "q-tip", "resgone", "res gone", "res caps")) return "cleaning";
  if (has("boveda", "integra", "humidity", "humidor", "stash jar", "storage jar", "smell proof", "smell-proof", "airtight", "stash", "storage tin", "glass jar")) return "storage";
  if (has("travel case", "carry case", "hard case", "carrying case", " bag", "backpack", "pouch", "sleeve", "travel tube", "vape case")) return "cases";
  if (has("charger", "charging dock", "charging cable", "usb-c cable", "power adapter", "wall adapter") && !has("battery pack")) return "batteries";
  if ((has("battery") && !has("510")) && (t === "vape parts" || t === "accessories") && has("18650", "external battery", "spare battery", "replacement battery", "battery box", "battery pack")) return "batteries";

  // device types
  if (t === "desktop") return "desktop-vapes";
  if (t.startsWith("portable")) return "portable-vapes";
  if (t === "dab pen") return "dab-pens";
  if (t === "dabbing") {
    if (has("case", "adapter", "tool", "chamber", "carb cap", "atomizer", "atomiser", "coil", "hot knife", "ball")) return "accessories";
    return "dab-rigs";
  }
  if (t === "pens" || t === "pen") {
    if (has("dab", "wax", "concentrate", "terp", "shatter", "extract", "dabber")) return "dab-pens";
    return "pen-vapes";
  }
  if (t === "part" || t === "vape parts") return "accessories";

  // accessories bucket — refine concentrate vs herb where it's clearly a device
  if (has("vaporizer", "vaporiser") && has("dry herb", "portable") && !has("part", "mouthpiece", "screen", "o-ring")) return "portable-vapes";

  return "accessories";
}

// brand-name normalisation
const BRAND_FIX = {
  "PAX Labs": "PAX", "Grenco Science": "Grenco Science", "Ccell": "CCELL",
  "Topgreen": "Topgreen", "Vessel Brand": "Vessel",
};
function brandOf(p) {
  let b = clean(p.vendor) || "Generic";
  b = fixMoji(b);
  if (b === "StГјndenglass" || /st.?ndenglass/i.test(b)) b = "Stündenglass";
  return BRAND_FIX[b] || b;
}

// ---------- filtering ----------
const BANNED = /\b(revolutionary|game[- ]?changer|unleash|elevate|premium experience|ultimate|cutting[- ]edge|sanctuary)\b/gi;
function deBan(s) { return s.replace(BANNED, "").replace(/\s{2,}/g, " ").replace(/\s+([.,])/g, "$1").trim(); }

const B2B_RE = /retailer|wholesale|wholesal|resell|re-sell|upsell|repeat sales|repeat business|repeat purchase|margin|stock the|stocking|for retailers|adds value for customers|supporting repeat|key accessory that adds|trade price|msrp|rrp\b|display unit|case of |box of |bulk/i;

function isWholesalePack(name) {
  return /\bBigBox\b|\bDisplay\b|Display Ready|Box of \d+|\bx\s?\d{2,}\b|\d{2,}\s?pack\b|\d{2,}-pack/i.test(name);
}
function isCombustion(name, tags) {
  const h = (name + " " + tags).toLowerCase();
  return /rolling paper|\bcones?\b|blunt wrap|hemp wrap|\bpapers?\b|raw paper|\bshine\b|filter tips?/.test(h);
}
function isNonProduct(p) {
  const n = clean(p.name).toLowerCase();
  return /payment method|tree to be planted|gift card|mws_fee|\bfee\b/.test(n) || /one tree planted|retail north/i.test(clean(p.vendor));
}
// vaporiser-only brand rule: exclude bongs / water pipes / gravity infusers / hookahs,
// even when the catalogue product_type didn't flag them. Stündenglass "Modül" is their
// actual vaporiser line, so it is kept; the gravity-bong system + its glassware is not.
function isWaterPipe(name, brand) {
  const n = name.toLowerCase();
  const b = brand.toLowerCase();
  if (/\bbong\b|hookah|gravity infuser|gravity hookah|\bwater ?pipe\b|\bwaterpipe\b/.test(n)) return true;
  if (/st.?ndenglass|stunden/.test(b) && !/mod[üu]l/.test(n)) return true; // gravity-bong glassware
  return false;
}

// Obsolete / superseded devices to drop from the shop (kept out, won't regenerate).
// Genuinely legacy tech where a current successor exists in the catalogue, or dead designs.
// Only genuinely dead/junk tech — NOT models that simply have a newer version.
// (Arizer V Tower / Extreme Q are old designs but still sold new and viable, so kept.)
const OBSOLETE = new Set([
  "flowermate-v5-0s-pro-mini",              // old budget conduction portable, effectively dead tech
  "focus-vape-pro-vaporizer",               // dated conduction portable, discontinued-era
  "xvape-mambo-cheech-and-chong-vaporizer", // old novelty conduction pen
]);

// ---------- pricing ----------
// MAP (Minimum Advertised Price) brands — UK retailers all priced identically by
// manufacturer mandate, so no per-product scan needed.
const MAP_BRANDS = ["storz & bickel", "pax", "puffco", "arizer", "dynavap", "tinymight", "volcano"];
function isMapBrand(brand) {
  const b = brand.toLowerCase();
  return MAP_BRANDS.some((m) => b.includes(m));
}
// round DOWN to the nearest .95 ending (used when TARGET wins)
function roundDown95(x) { return +(Math.floor(x - 0.95 + 1e-9) + 0.95).toFixed(2); }
// round UP to the nearest .95 ending (used when FLOOR wins)
function roundUp95(x) { return +(Math.ceil(x - 0.95 - 1e-9) + 0.95).toFixed(2); }

// TWO RULES, nothing else.
//  RULE 1 — never lose money: FLOOR = (T + 8.19) / 0.8183
//    8.19 = RN ship £7.99 + Stripe fixed £0.20 ; 0.8183 = 1 - VAT 16.67% - Stripe 1.5%
//  RULE 2 — beat every UK competitor by £1: TARGET = competitor_min - 1.00
//  FINAL = max(FLOOR, TARGET).  No T×2.2 cap, no margin buffer.
//  Fallback (no competitor data): MAP -> compare_at - 1 ; non-MAP -> T × 1.85.
function computePrice(T, handle, brand, compareAt) {
  const floor = (T + 8.19) / 0.8183;
  const comp = competitor[handle];
  let target, source;
  if (comp && comp.min > 0) { target = comp.min - 1.0; source = "competitor"; }
  else if (isMapBrand(brand) && compareAt > 0) { target = compareAt - 1.0; source = "map-compare"; }
  else { target = T * 1.85; source = "fallback"; }

  const targetWins = target >= floor;
  const price = targetWins ? roundDown95(target) : roundUp95(floor);
  return {
    price,
    floor: +floor.toFixed(2),
    target: +target.toFixed(2),
    source,
    basis: targetWins ? "target" : "floor",
    atFloor: !targetWins,
  };
}

// ---------- featured best-sellers ----------
const FEATURED = [
  ["Storz & Bickel", /mighty\s*\+|mighty plus/i],
  ["Storz & Bickel", /volcano hybrid/i],
  ["Storz & Bickel", /volcano medic 2/i],
  ["Storz & Bickel", /crafty\s*\+|crafty plus/i],
  ["Storz & Bickel", /\bventy\b/i],
  ["Arizer", /solo 3/i],
  ["Arizer", /solo 2 max/i],
  ["Arizer", /air max/i],
  ["Arizer", /go srt|argo srt|\bgo\b.*srt/i],
  ["Arizer", /\bxq2\b/i],
  ["DynaVap", /m\s*plus|\bm\+/i],
  ["DynaVap", /\bm7\b/i],
  ["DynaVap", /\bvong\b/i],
  ["PAX", /pax four|\bfour\b/i],
  ["PAX", /pax plus|\bplus\b/i],
  ["Puffco", /peak pro/i],
  ["Puffco", /proxy core/i],
  ["Puffco", /new proxy|proxy\b(?!.*core)/i],
  ["Tinymight", /tinymight 2|tinymight\b/i],
];
const DEVICE_CATS = new Set(["portable-vapes", "desktop-vapes", "pen-vapes", "dab-rigs", "dab-pens"]);
function featuredRank(brand, name, category) {
  if (!DEVICE_CATS.has(category)) return -1; // never feature accessories/cables/cooling units
  for (let i = 0; i < FEATURED.length; i++) {
    const [b, re] = FEATURED[i];
    if (brand.toLowerCase().includes(b.toLowerCase().split(" ")[0]) && re.test(name)) return i;
  }
  return -1;
}

// ---------- copy generation ----------
const CAT_NOUN = {
  "portable-vapes": "portable dry-herb vaporiser",
  "desktop-vapes": "desktop vaporiser",
  "pen-vapes": "vaporiser pen",
  "dab-pens": "concentrate pen",
  "cartridge-batteries": "510 cartridge battery",
  "dab-rigs": "concentrate vaporiser",
  "grinders": "grinder",
  "storage": "storage accessory",
  "cleaning": "cleaning accessory",
  "accessories": "accessory",
  "batteries": "battery accessory",
  "cases": "carry case",
};
const CAT_WHO = {
  "portable-vapes": "patients who medicate on the move",
  "desktop-vapes": "patients medicating at home who want consistent, efficient dosing",
  "pen-vapes": "patients who want simple, discreet sessions",
  "dab-pens": "patients prescribed cannabis extracts",
  "cartridge-batteries": "patients using 510 cartridges",
  "dab-rigs": "patients prescribed concentrates who want full flavour and control",
  "grinders": "any patient preparing dried flower",
  "storage": "patients keeping prescribed flower fresh",
  "cleaning": "keeping your device clean for purer vapour",
  "accessories": "keeping your kit running",
  "batteries": "keeping your device powered",
  "cases": "carrying your kit safely",
};

// marketing fluff — sentences/openers that don't match MJP's direct, honest voice
const FLUFF_RE = /more than meets the eye|touch of personality|turns heads|sets (it|the \w+) apart|at first glance|first impression|look no further|game[- ]?changer|next level|whole new|rarely seen|like never before|elevate your|unmatched|state[- ]of[- ]the[- ]art|second to none|best[- ]in[- ]class|must[- ]have/i;
const OPENER_RE = /^(at first glance|however|once powered on|but|moreover|furthermore|in addition|that said|what'?s more|indeed|notably)[,:]?\s+/i;
function tidySentence(s) {
  s = ukEnglish(clean(s));
  s = s.replace(OPENER_RE, "");
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return s.trim();
}

function buildCopy(p, category, brand) {
  const name = clean(p.name);
  const blocks = htmlBlocks(p.description_html);
  // collect usable sentences from <p> paragraphs, drop B2B + fluff + "what's included"
  let sentences = [];
  for (const b of blocks) {
    if (b.tag !== "p") continue;
    for (let s of b.txt.split(/(?<=[.!?])\s+/)) {
      s = clean(s);
      if (s.length < 25 || s.length > 240) continue;
      if (B2B_RE.test(s)) continue;
      if (FLUFF_RE.test(s)) continue;
      if (/information sourced|for legal use only|^this is the official/i.test(s)) continue;
      sentences.push(tidySentence(s));
    }
  }
  sentences = sentences.map(deBan).filter(Boolean);

  const noun = CAT_NOUN[category] || "accessory";
  const who = CAT_WHO[category] || "patients";

  // summary: first solid source sentence (what it is), else a what+who template
  let summary = sentences[0] || "";
  if (!summary || summary.length > 150 || /^the\s+\w+\s+(wear|tear)/i.test(summary) || FLUFF_RE.test(summary)) {
    summary = `${name} — a ${noun} for ${who}.`;
  }
  summary = deBan(ukEnglish(clean(summary)));
  if (summary.length > 180) summary = summary.slice(0, 177).replace(/[ ,;:]+\S*$/, "") + "…";

  // description: 3-5 cleaned sentences, then a patient-first close
  let desc = sentences.slice(0, 4);
  if (desc.length === 0) {
    desc = [`The ${name} is a ${noun} from ${brand}.`];
  }
  // patient-first closing line, category-aware, no banned words
  const closers = {
    "portable-vapes": "A solid choice for patients who medicate away from home.",
    "desktop-vapes": "Suited to home use where consistency matters more than portability.",
    "pen-vapes": "Simple and discreet for everyday medicating.",
    "dab-pens": "For patients prescribed extracts who want a compact option.",
    "cartridge-batteries": "Pairs with standard 510 cartridges.",
    "dab-rigs": "For patients who want full flavour and dose control from concentrates.",
    "grinders": "A small upgrade that makes every session more even.",
    "storage": "Keeps prescribed flower at its best for longer.",
    "cleaning": "A clean device gives cleaner vapour and a more reliable dose.",
    "accessories": "A practical part to keep your device working as it should.",
    "batteries": "Keeps your device charged and ready.",
    "cases": "Keeps your kit protected and discreet in transit.",
  };
  let descText = desc.join(" ");
  const closer = closers[category];
  if (closer && !descText.toLowerCase().includes(closer.toLowerCase().slice(0, 20))) descText += " " + closer;
  descText = deBan(ukEnglish(clean(descText)));
  if (descText.length > 700) descText = descText.slice(0, 697).replace(/[ ,;:]+\S*$/, "") + "…";

  return { summary, description: descText };
}

// ---------- tags ----------
function buildTags(p, category, brand) {
  const out = new Set();
  const map = {
    "portable-vapes": "portable", "desktop-vapes": "desktop", "pen-vapes": "pen",
    "dab-pens": "concentrate", "cartridge-batteries": "510", "dab-rigs": "concentrate",
    "grinders": "grinder", "storage": "storage", "cleaning": "cleaning",
    "accessories": "accessory", "batteries": "battery", "cases": "case",
  };
  if (map[category]) out.add(map[category]);
  const h = (clean(p.name) + " " + (p.tags || []).join(" ")).toLowerCase();
  if (/convection/.test(h)) out.add("convection");
  if (/dry herb|dry-herb/.test(h)) out.add("dry-herb");
  if (/no.?battery|butane|manual/.test(h) && category === "pen-vapes") out.add("no-battery");
  if (/replacement|spare|consumable|o-ring|sieve|screen/.test(h)) out.add("consumable");
  if (/german|germany/.test(h)) out.add("german-engineered");
  out.add(brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  return [...out].slice(0, 4);
}

// ---------- ext from url ----------
function extOf(url) {
  const m = String(url || "").split("?")[0].match(/\.(jpg|jpeg|png|webp|gif|avif)$/i);
  return m ? m[1].toLowerCase() : "jpg";
}

// ================= main =================
const kept = [];
const excluded = [];
const skippedUnprofitable = [];

for (const p of catalog) {
  const name = clean(p.name);
  const t = clean(p.product_type).toLowerCase();
  const tags = (p.tags || []).join(" ");
  const variants = p.variants || [];

  // exclusions
  if (isNonProduct(p)) { excluded.push([name, "non-product/fee"]); continue; }
  if (EXCLUDE_TYPES.has(t)) { excluded.push([name, "bong/pipe/water-pipe"]); continue; }
  if (isWaterPipe(name, brandOf(p))) { excluded.push([name, "bong/pipe/water-pipe"]); continue; }
  if (variants.length && variants.every((v) => v.available === false)) { excluded.push([name, "all variants unavailable"]); continue; }
  if (isCombustion(name, tags)) { excluded.push([name, "combustion-only (papers/cones)"]); continue; }
  if (isWholesalePack(name)) { excluded.push([name, "wholesale/display bulk unit"]); continue; }

  const T = parseFloat((variants[0] && variants[0].price) || p.trade_price_gbp);
  if (!(T > 0)) { excluded.push([name, "no valid trade price"]); continue; }

  const category = resolveCategory(p);
  const brand = brandOf(p);
  const handle = clean(p.handle) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  if (OBSOLETE.has(handle)) { excluded.push([name, "obsolete/legacy tech"]); continue; }

  const compareAt = parseFloat(p.compare_at_price_gbp);
  const pr = computePrice(T, handle, brand, compareAt > 0 ? compareAt : 0);
  // FINAL = max(FLOOR, TARGET) is always >= floor, so we never sell at a loss.

  // "price-review": RN trade is at/above the cheapest UK price, so the floor forces a
  // price ABOVE the market. We do NOT list these at a silly price — mark them
  // out-of-stock / enquire and tag them so they're easy to find and fix in /admin.
  const compEntry = competitor[handle];
  const priceReview = !!(compEntry && compEntry.min > 0 && pr.price > compEntry.min + 0.001);

  const { summary, description } = buildCopy(p, category, brand);
  const specs = extractSpecs(p.description_html, p, category).slice(0, 10);
  const tagsOut = buildTags(p, category, brand);
  if (priceReview && !tagsOut.includes("price-review")) tagsOut.push("price-review");

  // images: reference RN's Shopify CDN directly (real photos, no download)
  const primaryUrl = clean(p.image_url) || (p.gallery || [])[0] || "";
  const galleryUrls = [...new Set((p.gallery || []).map((g) => clean(g)).filter(Boolean))].filter((g) => g !== primaryUrl).slice(0, 4);

  kept.push({
    p, handle, name, brand, category, T, priceReview,
    price: pr.price, floor: pr.floor, target: pr.target, ceilingSource: pr.source, basis: pr.basis, atFloor: pr.atFloor,
    summary, description, specs, tags: tagsOut,
    rnSku: String(p.rn_product_id),
    primaryUrl, galleryUrls,
    frank: featuredRank(brand, name, category),
  });
}

// dedupe handles
const byHandle = new Map();
for (const k of kept) {
  let h = k.handle;
  let i = 2;
  while (byHandle.has(h)) { h = `${k.handle}-${i++}`; }
  k.handle = h;
  byHandle.set(h, k);
}

// featured: keep best (lowest frank) per featured slot, max 20
const featuredPick = new Map();
for (const k of kept) {
  if (k.frank < 0) continue;
  if (k.priceReview) continue; // don't feature a product we can't sell at a competitive price
  const cur = featuredPick.get(k.frank);
  if (!cur || k.T > cur.T) featuredPick.set(k.frank, k); // prefer the real device (higher trade cost) over an accessory match
}
const featuredList = [...featuredPick.entries()].sort((a, b) => a[0] - b[0]).map(([, k]) => k).slice(0, 20);
const featuredSet = new Set(featuredList);
featuredList.forEach((k, i) => { k.featured = true; k.order = i + 1; });

// non-featured: group by category, ascending price; assign order continuing from featured count
const CAT_ORDER = ["portable-vapes","desktop-vapes","pen-vapes","dab-pens","dab-rigs","cartridge-batteries","grinders","storage","cleaning","accessories","batteries","cases"];
const rest = kept.filter((k) => !featuredSet.has(k)).sort((a, b) => {
  const ca = CAT_ORDER.indexOf(a.category), cb = CAT_ORDER.indexOf(b.category);
  if (ca !== cb) return ca - cb;
  return a.price - b.price;
});
let ord = featuredList.length + 1;
for (const k of rest) { k.featured = false; k.order = ord++; }

// write files — images reference RN's Shopify CDN directly (no download)
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
const manifest = [];
let noImage = 0;
let overridden = 0;
for (const k of kept) {
  if (!k.primaryUrl) noImage++;
  const ov = COPY_OVERRIDES[k.handle];
  if (ov) overridden++;
  const summary = deBan(ukEnglish(clean(ov ? ov.summary : k.summary)));
  const description = deBan(ukEnglish(clean(ov ? ov.description : k.description)));
  const obj = {
    slug: k.handle,
    name: k.name,
    brand: k.brand,
    category: k.category,
    price: k.price,
    image: k.primaryUrl,
    gallery: k.galleryUrls,
    summary,
    description,
    specs: k.specs,
    inStock: !k.priceReview,
    featured: !!k.featured,
    tags: k.tags,
    stripeLink: "",
    rnSku: k.rnSku,
    order: k.order,
  };
  fs.writeFileSync(path.join(OUT_DIR, `${k.handle}.json`), JSON.stringify(obj, null, 2) + "\n");
  manifest.push({ handle: k.handle, image: k.primaryUrl, gallery: k.galleryUrls });
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

// stats
const catCounts = {};
for (const k of kept) catCounts[k.category] = (catCounts[k.category] || 0) + 1;
const exclReasons = {};
for (const [, why] of excluded) exclReasons[why] = (exclReasons[why] || 0) + 1;
const markups = kept.map((k) => k.price / k.T);
const meanMarkup = markups.reduce((a, b) => a + b, 0) / markups.length;
const srcCounts = {};
for (const k of kept) srcCounts[k.ceilingSource] = (srcCounts[k.ceilingSource] || 0) + 1;
const atFloor = kept.filter((k) => k.basis === "floor").length;
const atTarget = kept.filter((k) => k.basis === "target").length;
const competitorPriced = kept.filter((k) => k.ceilingSource === "competitor").length;
const noCompetitor = kept.length - competitorPriced;
const stats = {
  total: catalog.length, kept: kept.length, excluded: excluded.length,
  skippedUnprofitable: skippedUnprofitable.length,
  noImage,
  catCounts, exclReasons,
  meanMarkup: +meanMarkup.toFixed(3),
  pricingSource: srcCounts,
  atFloor, atTarget,
  competitorPriced, noCompetitor,
  featured: featuredList.map((k) => `${k.brand} ${k.name}`),
  skippedDetail: skippedUnprofitable,
};
fs.writeFileSync(STATS, JSON.stringify(stats, null, 2));

console.log("KEPT:", kept.length, "EXCLUDED:", excluded.length, "UNPROFITABLE:", skippedUnprofitable.length, "noImage:", noImage, "copyOverrides:", overridden);
console.log("CATEGORIES:", JSON.stringify(catCounts));
console.log("EXCLUDE REASONS:", JSON.stringify(exclReasons));
console.log("PRICING SOURCE:", JSON.stringify(srcCounts));
console.log("FEATURED (", featuredList.length, "):", featuredList.map((k) => k.brand + " " + k.name).join(" | "));
console.log("meanMarkup:", meanMarkup.toFixed(3), "atTarget(beat-by-£1):", atTarget, "atFloor:", atFloor, "competitorPriced:", competitorPriced);
