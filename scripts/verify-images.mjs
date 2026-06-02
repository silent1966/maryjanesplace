import fs from "node:fs";
import path from "node:path";
const dir = "src/content/products";
let all = [], empty = 0, bad = [];
for (const f of fs.readdirSync(dir)) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  for (const u of [p.image, ...(p.gallery || [])]) {
    if (!u) { empty++; continue; }
    if (!/^https:\/\//.test(u)) bad.push(`${f}:${u}`);
    all.push(u);
  }
}
console.log(`total img refs: ${all.length}  empty: ${empty}  badScheme: ${bad.length}`);
if (bad.length) console.log("BAD:", bad.slice(0, 10));

// sample HEAD-check across the list
const step = Math.max(1, Math.floor(all.length / 16));
const sample = [];
for (let i = 0; i < all.length; i += step) sample.push(all[i]);
let ok = 0, fail = 0;
await Promise.all(sample.map(async (u) => {
  try {
    const r = await fetch(u, { method: "HEAD", signal: AbortSignal.timeout(20000) });
    if (r.ok) ok++; else { fail++; console.log("STATUS", r.status, u); }
  } catch (e) { fail++; console.log("FAIL", u, e.message); }
}));
console.log(`HEAD sample: ok=${ok} fail=${fail} of ${sample.length}`);
