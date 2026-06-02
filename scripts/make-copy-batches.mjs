// Emit copy-rewrite batches for device-tier products (the hero pages where MJP voice
// matters most). Each batch file holds the data an agent needs; no fetching required.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PROD = path.join(ROOT, "src/content/products");

const catalog = JSON.parse(fs.readFileSync(process.env.CATALOG || "C:/Users/surface_owner/Downloads/rn-trade-catalog.json", "utf8"));
const bySku = {}; for (const p of catalog) bySku[String(p.rn_product_id)] = p;

const MOJI = [["вЂ™","’"],["вЂ˜","‘"],["вЂњ","“"],["вЂ","”"],["вЂ”","—"],["вЂ“","–"],["вЂ¦","…"],["Г—","×"],["Гј","ü"],["Г©","é"],["В "," "],["Â",""]];
const fixMoji=(s)=>{s=String(s||"");for(const[a,b]of MOJI)s=s.split(a).join(b);return s;};
const ent=(s)=>s.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n));
const strip=(h)=>ent(fixMoji(String(h||"")).replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim();

const DEVICE = new Set(["portable-vapes","desktop-vapes","pen-vapes","dab-rigs","dab-pens"]);
const files = fs.readdirSync(PROD).filter((f)=>f.endsWith(".json"));
const items = [];
for (const f of files) {
  const p = JSON.parse(fs.readFileSync(path.join(PROD, f), "utf8"));
  if (!DEVICE.has(p.category) && !p.featured) continue;
  const src = bySku[p.rnSku];
  items.push({
    handle: p.slug, name: p.name, brand: p.brand, category: p.category, price: p.price,
    featured: p.featured,
    source: src ? strip(src.description_html).slice(0, 1400) : "",
    specs: p.specs,
  });
}
// stable order: featured first, then by category
items.sort((a,b)=> (b.featured-a.featured) || a.category.localeCompare(b.category));

const BATCH = 18;
const dir = path.join(__dirname, "copy-in");
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
fs.mkdirSync(path.join(__dirname, "copy-out"), { recursive: true });
let n = 0;
for (let i = 0; i < items.length; i += BATCH) {
  n++;
  fs.writeFileSync(path.join(dir, `batch-${n}.json`), JSON.stringify(items.slice(i, i + BATCH), null, 2));
}
console.log("device-tier items:", items.length, "batches:", n);
