// Merge round-2 hero competitor research into competitor-prices.json.
// Keeps existing entries; on conflict keeps the LOWER min. New entries carry sources[].
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const F = path.join(__dirname, "competitor-prices.json");

const HERO = {
  // Storz & Bickel
  "volcano-medic-2": { min: 350, sources: [{ retailer: "cannabisdispensary.uk", price: 350 }, { retailer: "montu.uk", price: 379 }, { retailer: "vapedispensary.co.uk", price: 389 }] },
  "volcano-hybrid": { min: 385, sources: [{ retailer: "magicvaporizers.co.uk", price: 385 }, { retailer: "vapefiend.co.uk", price: 385 }, { retailer: "herbalizestore.co.uk", price: 385 }] },
  "venty-vaporizer": { min: 289, sources: [{ retailer: "magicvaporizers.co.uk", price: 289 }, { retailer: "vapefiend.co.uk", price: 299 }, { retailer: "herbalizestore.co.uk", price: 299 }] },
  "mighty-medic": { min: 259, sources: [{ retailer: "montu.uk", price: 259 }, { retailer: "vapedispensary.co.uk", price: 274.8 }] },
  "storz-bickel-mighty-plus-vaporizer": { min: 249, sources: [{ retailer: "herbalizestore.co.uk", price: 249 }, { retailer: "magicvaporizers.co.uk", price: 259 }, { retailer: "vapefiend.co.uk", price: 259 }] },
  "volcano-vaporizer-classic": { min: 266.99, sources: [{ retailer: "herbvape.co.uk", price: 266.99 }, { retailer: "magicvaporizers.co.uk", price: 285 }, { retailer: "vapefiend.co.uk", price: 289 }] },
  "crafty-plus-storz-bickel": { min: 186.99, sources: [{ retailer: "herbvape.co.uk", price: 186.99 }, { retailer: "dopevapes.co.uk", price: 195 }, { retailer: "magicvaporizers.co.uk", price: 199 }] },
  "veazy-vaporizer": { min: 189, sources: [{ retailer: "magicvaporizers.co.uk", price: 189 }, { retailer: "herbalizestore.co.uk", price: 189 }, { retailer: "tvape.co.uk", price: 189 }] },
  "plenty-vaporizer": { min: 159, sources: [{ retailer: "herbalizestore.co.uk", price: 159 }, { retailer: "vapefiend.co.uk", price: 159 }, { retailer: "magicvaporizers.co.uk", price: 199 }] },
  "volcano-hybrid-starter-kit": { min: 111, sources: [{ retailer: "magicvaporizers.co.uk", price: 111 }, { retailer: "vapefiend.co.uk", price: 111 }, { retailer: "alibongo.co.uk", price: 119.99 }] },
  "volcano-solid-valve-set": { min: 89, sources: [{ retailer: "vapefiend.co.uk", price: 89 }, { retailer: "herbalizestore.co.uk", price: 99 }] },
  "easy-valve-starter-set": { min: 94, sources: [{ retailer: "herbalizestore.co.uk", price: 94 }, { retailer: "vapefiend.co.uk", price: 94 }, { retailer: "magicvaporizers.co.uk", price: 94 }] },
  "mighty-ftv-stainless-steel-cooling-unit-v-2": { min: 64.95, sources: [{ retailer: "vaporizerhut.co.uk", price: 64.95 }, { retailer: "herbalizestore.co.uk", price: 76 }] },
  // Puffco
  "puffco-peak-pro": { min: 289, sources: [{ retailer: "magicvaporizers.co.uk", price: 289 }, { retailer: "herbalizestore.co.uk", price: 289 }, { retailer: "tvape.co.uk", price: 298 }] },
  "puffco-new-peak": { min: 179, sources: [{ retailer: "magicvaporizers.co.uk", price: 179 }, { retailer: "herbalizestore.co.uk", price: 179 }, { retailer: "vapefiend.co.uk", price: 199 }] },
  "puffco-new-proxy": { min: 224, sources: [{ retailer: "magicvaporizers.co.uk", price: 224 }, { retailer: "herbalizestore.co.uk", price: 224.1 }, { retailer: "vapefiend.co.uk", price: 224 }] },
  "puffco-proxy": { min: 194.35, sources: [{ retailer: "herbalizestore.co.uk", price: 194.35 }, { retailer: "magicvaporizers.co.uk", price: 224 }] },
  "puffco-proxy-core-kit": { min: 192, sources: [{ retailer: "magicvaporizers.co.uk", price: 192 }, { retailer: "tvape.co.uk", price: 192 }, { retailer: "herbalizestore.co.uk", price: 229 }] },
  "puffco-peak-pro-link": { min: 131, sources: [{ retailer: "magicvaporizers.co.uk", price: 131 }, { retailer: "vapefiend.co.uk", price: 131.99 }] },
  "puffco-pivot": { min: 109, sources: [{ retailer: "magicvaporizers.co.uk", price: 109 }, { retailer: "vapefiend.co.uk", price: 119 }, { retailer: "herbalizestore.co.uk", price: 119 }] },
  "puffco-peak-pro-3d-xl-chamber": { min: 99, sources: [{ retailer: "vapefiend.co.uk", price: 99 }, { retailer: "magicvaporizers.co.uk", price: 108 }, { retailer: "herbalizestore.co.uk", price: 118 }] },
  "proxy-wizard-pipe": { min: 98, sources: [{ retailer: "herbalizestore.co.uk", price: 98 }, { retailer: "magicvaporizers.co.uk", price: 108 }, { retailer: "vapefiend.co.uk", price: 107.7 }] },
  "puffco-peak-pro-3d-chamber": { min: 86, sources: [{ retailer: "magicvaporizers.co.uk", price: 86 }, { retailer: "vapefiend.co.uk", price: 89 }, { retailer: "herbalizestore.co.uk", price: 89.99 }] },
  "puffco-proxy-core-accessory": { min: 59, sources: [{ retailer: "magicvaporizers.co.uk", price: 59 }, { retailer: "vapefiend.co.uk", price: 59 }, { retailer: "herbalizestore.co.uk", price: 59 }] },
  "puffco-peak-journey-bag": { min: 89, sources: [{ retailer: "herbalizestore.co.uk", price: 89 }] },
  "pivot-glass-adapter": { min: 64.99, sources: [{ retailer: "vapefiend.co.uk", price: 64.99 }, { retailer: "herbalizestore.co.uk", price: 69.45 }, { retailer: "magicvaporizers.co.uk", price: 73 }] },
  "puffco-peak-pro-replacement-chamber": { min: 86, sources: [{ retailer: "magicvaporizers.co.uk", price: 86 }, { retailer: "vapefiend.co.uk", price: 89 }] },
  "proxy-travel-bag": { min: 79, sources: [{ retailer: "herbalizestore.co.uk", price: 79 }, { retailer: "vapefiend.co.uk", price: 79 }] },
  // Arizer
  "arizer-solo-3": { min: 217.99, sources: [{ retailer: "herbvape.co.uk", price: 217.99 }, { retailer: "magicvaporizers.co.uk", price: 232 }, { retailer: "herbalizestore.co.uk", price: 232 }] },
  "arizer-solo-2-max": { min: 139, sources: [{ retailer: "magicvaporizers.co.uk", price: 139 }, { retailer: "herbalizestore.co.uk", price: 139 }, { retailer: "vapefiend.co.uk", price: 139 }] },
  "arizer-air-max": { min: 129, sources: [{ retailer: "magicvaporizers.co.uk", price: 129 }, { retailer: "herbalizestore.co.uk", price: 129 }, { retailer: "vaporizerhut.co.uk", price: 130 }] },
  "arizer-air-se-vaporizer": { min: 69, sources: [{ retailer: "herbalizestore.co.uk", price: 69 }, { retailer: "vapefiend.co.uk", price: 69 }, { retailer: "dopevapes.co.uk", price: 69.99 }] },
  "arizer-extreme-q-vaporizer": { min: 99, sources: [{ retailer: "magicvaporizers.co.uk", price: 99 }, { retailer: "herbalizestore.co.uk", price: 99 }, { retailer: "vapefiend.co.uk", price: 129 }] },
  "arizer-xq2": { min: 139, sources: [{ retailer: "magicvaporizers.co.uk", price: 139 }, { retailer: "herbalizestore.co.uk", price: 139 }, { retailer: "vapefiend.co.uk", price: 149 }] },
  "arizer-go-srt": { min: 249, sources: [{ retailer: "herbalizestore.co.uk", price: 249 }, { retailer: "magicvaporizers.co.uk", price: 249 }, { retailer: "vaporizerhut.co.uk", price: 249 }] },
  "arizer-go-argo": { min: 119, sources: [{ retailer: "herbalizestore.co.uk", price: 119 }, { retailer: "magicvaporizers.co.uk", price: 119 }, { retailer: "herbvape.co.uk", price: 123.99 }] },
  "arizer-v-tower-vaporizer": { min: 98, sources: [{ retailer: "magicvaporizers.co.uk", price: 98 }, { retailer: "herbalizestore.co.uk", price: 98 }] },
  // DynaVap
  "dynavap-the-hyperdyn": { min: 199, sources: [{ retailer: "herbalizestore.co.uk", price: 199 }, { retailer: "magicvaporizers.co.uk", price: 199 }, { retailer: "puffpuffpalace.co.uk", price: 206.6 }] },
  "dynavap-the-vong-starter-kit": { min: 147, sources: [{ retailer: "merryjayne.co.uk", price: 147 }, { retailer: "herbalizestore.co.uk", price: 149 }, { retailer: "puffpuffpalace.co.uk", price: 177.68 }] },
  "yll-3-0-induction-heater": { min: 95, sources: [{ retailer: "recommendedvapesupplies.co.uk", price: 95 }, { retailer: "herbalizestore.co.uk", price: 99 }, { retailer: "magicvaporizers.co.uk", price: 100 }] },
  "dynavap-the-vong": { min: 132.5, sources: [{ retailer: "grasscity.co.uk", price: 132.5 }, { retailer: "magicvaporizers.co.uk", price: 139 }, { retailer: "herbalizestore.co.uk", price: 149 }] },
  "dynavap-the-woodwynd": { min: 129, sources: [{ retailer: "herbalizestore.co.uk", price: 129 }, { retailer: "vapefiend.co.uk", price: 129 }] },
  "dynavap-the-unidyn-ball-vape": { min: 99, sources: [{ retailer: "vapefiend.co.uk", price: 99 }, { retailer: "magicvaporizers.co.uk", price: 105 }, { retailer: "herbalizestore.co.uk", price: 115 }] },
  "dynavap-the-vong-x": { min: 115, sources: [{ retailer: "vapefiend.co.uk", price: 115 }, { retailer: "herbalizestore.co.uk", price: 115 }, { retailer: "vaporizerhut.co.uk", price: 139.95 }] },
  "dynavap-titanium-fall-colors": { min: 99, sources: [{ retailer: "herbalizestore.co.uk", price: 99 }, { retailer: "puffpuffpalace.co.uk", price: 99.17 }, { retailer: "vapsonvaps.com", price: 100 }] },
  // PAX + others
  "pax-flow": { min: 259.99, sources: [{ retailer: "herbvape.co.uk", price: 259.99 }, { retailer: "herbalizestore.co.uk", price: 314 }, { retailer: "vapefiend.co.uk", price: 314 }] },
  "stundenglass-x-modul-dok-deluxe-travel-set": { min: 416.11, sources: [{ retailer: "vapospy.co.uk", price: 416.11 }, { retailer: "herbalizestore.co.uk", price: 435 }] },
  "boundless-dv8-from-bmic": { min: 115, sources: [{ retailer: "dopevapes.co.uk", price: 115 }, { retailer: "herbalizestore.co.uk", price: 199 }] },
  "wolkenkraft-aris-ultra-gun-metal": { min: 149, sources: [{ retailer: "herbalizestore.co.uk", price: 149 }, { retailer: "vapejunkie.co.uk", price: 149.99 }] },
  "pax-four": { min: 189, sources: [{ retailer: "vapefiend.co.uk", price: 189 }, { retailer: "magicvaporizers.co.uk", price: 199 }, { retailer: "tvape.co.uk", price: 199.99 }] },
  "pax-mini": { min: 134.99, sources: [{ retailer: "vapefiend.co.uk", price: 134.99 }, { retailer: "herbalizestore.co.uk", price: 135 }] },
  "vapman-lotus": { min: 129, sources: [{ retailer: "herbalizestore.co.uk", price: 129 }, { retailer: "vaporizerhut.co.uk", price: 130 }] },
  "fenix-2-0-vaporizer": { min: 119, sources: [{ retailer: "maryjanevapes.co.uk", price: 119 }] },
};

const existing = JSON.parse(fs.readFileSync(F, "utf8"));
let added = 0, lowered = 0;
for (const [h, v] of Object.entries(HERO)) {
  if (!existing[h]) { existing[h] = v; added++; }
  else if (v.min < (existing[h].min ?? Infinity)) { existing[h] = v; lowered++; }
}
fs.writeFileSync(F, JSON.stringify(existing, null, 2));
console.log("merged hero prices. added:", added, "lowered:", lowered, "total entries now:", Object.keys(existing).length);
