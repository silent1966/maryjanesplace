// Generates netlify/functions/_prices.json — the canonical slug -> {name, price, image}
// map the Stripe checkout function uses to validate prices server-side (never trust the
// price sent by the browser). Run: node scripts/gen-prices.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "src", "content", "products");
const out = join(root, "netlify", "functions", "_prices.json");

const map = {};
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".json")) continue;
  const p = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const slug = p.slug || f.replace(/\.json$/, "");
  if (typeof p.price !== "number") continue;
  map[slug] = { name: p.name, price: p.price, image: p.image || "", inStock: p.inStock !== false };
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(map));
console.log(`Wrote ${Object.keys(map).length} prices to ${out}`);
