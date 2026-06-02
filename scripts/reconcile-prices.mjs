// Reconcile the 3 research agents' price data (their handles differ) to our actual
// handles in research-targets.json, by token similarity. Writes competitor-prices.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const targets = JSON.parse(fs.readFileSync(path.join(__dirname, "research-targets.json"), "utf8"));

const RAW = {
  // group A
  "smono-4-pro": 85.0, "smono-4-vaporizer": 57.99, "smono-5-vaporizer": 114.45,
  "smono-70s-vaporizer": 78.0, "smono-baloo": 79.0, "smono-lunari": 119.45,
  "smono-no-3-vaporizer": 75.0, "smono-sunshine": 78.5,
  "wolkenkraft-aris-ultra": 139.0, "wolkenkraft-aris": 126.0, "wolkenkraft-fx-mini-ultra": 109.0,
  "wolkenkraft-fx-mini": 119.0, "wolkenkraft-live": 379.0, "wolkenkraft-vita": 78.3,
  "dr-dabber-ghost-2": 129.0, "dr-dabber-switch-2": 419.45, "dr-dabber-switch-aln-induction-cup": 99.0,
  "dr-dabber-switch-sapphire-induction-cup": 80.0, "dr-dabber-switch-sic-induction-cup": 80.0,
  "xmax-starry-v4": 79.0, "xmax-v3-pro": 99.0, "xmax-v4-pro": 99.0, "xvape-aria": 79.0, "xvape-fog-pro": 99.0,
  "davinci-artiq": 49.0, "davinci-iq3": 189.0, "davinci-iqc": 159.0, "davinci-miqro-c": 99.0,
  // group B
  "airvape-legacy-pro-2": 179.0, "airvape-legacy-pro": 179.0, "airvape-x": 99.0,
  "auxo-calent": 78.0, "auxo-celsius": 98.0, "auxo-cenote": 148.0,
  "boundless-cfx": 119.0,
  "herb-ripper-3-piece": 129.0, "herb-ripper-4-piece-standard": 98.0, "herb-ripper-xl-4-piece": 169.0,
  "lotus-cap": 99.0, "vapman-click": 69.0, "vapman-heating-station": 329.0, "lotus-vaporizer-kit": 129.0,
  "norddampf-hammah": 76.5, "norddampf-relict": 107.1, "norddampf-voity": 69.0,
  "fenix-2-max": 149.0, "fenix-neo": 139.0,
  "zenco-duo": 220.0, "zenco-flow": 220.0,
  // group C
  "aromed-4-0": 399.0, "aveo-filling-capping-jig": 299.0, "eyce-pv1": 69.0,
  "flowermate-v5-0s-pro-mini": 79.0, "focus-vape-pro-s": 78.0, "g-pen-hyer": 187.45,
  "ispire-the-wand": 120.0, "limelight-frolic": 299.0,
  "stundenglass-modul-vaporizer": 239.0, "stundenglass-modul-dok-deluxe": 348.0, "vessel-ash": 139.0,
};

// only strip truly generic words — KEEP model identifiers (numbers, pro, ultra, mini, max, neo, etc.)
const STOP = new Set(["the", "vaporizer", "vaporiser", "vape", "from", "bmic", "copy", "gun", "metal", "induction", "6000mah", "stainless", "steel", "standard"]);
const toks = (s) => [...new Set(s.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w && !STOP.has(w)))];
function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

const out = {};
const claimed = {}; // target handle -> {raw, score}
const report = [];
// rank all (raw,target) candidate pairs, assign greedily best-first, 1:1
const pairs = [];
for (const [rawHandle, price] of Object.entries(RAW)) {
  const rTok = toks(rawHandle);
  for (const t of targets) {
    const sc = jaccard(rTok, toks(t.handle));
    if (sc > 0) pairs.push({ rawHandle, price, target: t, sc });
  }
}
pairs.sort((a, b) => b.sc - a.sc);
const rawDone = new Set();
for (const p of pairs) {
  if (rawDone.has(p.rawHandle)) continue;
  if (claimed[p.target.handle]) continue;
  if (p.sc < 0.6) continue;
  claimed[p.target.handle] = { raw: p.rawHandle, sc: p.sc };
  out[p.target.handle] = { min: p.price, source: p.rawHandle };
  rawDone.add(p.rawHandle);
  report.push(`OK  ${p.rawHandle} -> ${p.target.handle} (£${p.price}, j=${p.sc.toFixed(2)})`);
}
for (const rawHandle of Object.keys(RAW)) {
  if (!rawDone.has(rawHandle)) report.push(`??  ${rawHandle} [UNMATCHED]`);
}
fs.writeFileSync(path.join(__dirname, "competitor-prices.json"), JSON.stringify(out, null, 2));
console.log(report.sort().join("\n"));
console.log("\nMatched:", Object.keys(out).length, "of", Object.keys(RAW).length, "raw entries; targets:", targets.length);
