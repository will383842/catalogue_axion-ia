/* =============================================================
   MAJ-LOGO — installe le logo officiel dans les assets du catalogue.

   Le fichier source (`logo_entièrement détouré.png`) est un carré 1254×1254
   dont près des deux tiers sont de la marge transparente. Posé tel quel à
   `height:15mm`, le logo VISIBLE ne ferait plus que ~5 mm : la hauteur CSS
   s'applique à l'image entière, marge comprise.

   On recadre donc sur la boîte englobante des pixels non transparents, puis
   on écrit l'asset. La version précédente est conservée à côté.

   Usage : node maj-logo.cjs
   ============================================================= */
const fs = require("fs");
const path = require("path");

const RACINES = [
  path.join(__dirname, "node_modules"),
  "C:/Users/willi/Bookforge/packages/fabrication/node_modules",
];
const sharp = (() => {
  for (const r of RACINES) if (fs.existsSync(path.join(r, "sharp"))) return require(path.join(r, "sharp"));
  throw new Error("[maj-logo] sharp introuvable");
})();

const SOURCE = "C:/Users/willi/Documents/Projets/Axion-IA/Images Axion-IA/Logos/logo_entièrement détouré.png";
const DEST = path.join(__dirname, "assets", "axion-ia-logo.png");
const SAUVEGARDE = path.join(__dirname, "assets", "axion-ia-logo.avant-2026-08-17.png");

(async () => {
  if (!fs.existsSync(SOURCE)) throw new Error(`[maj-logo] source introuvable : ${SOURCE}`);

  if (fs.existsSync(DEST) && !fs.existsSync(SAUVEGARDE)) {
    fs.copyFileSync(DEST, SAUVEGARDE);
    console.log(`ancien logo conservé → ${path.basename(SAUVEGARDE)}`);
  }

  const avant = await sharp(SOURCE).metadata();

  // `trim` sur le canal alpha : on retire la marge transparente, rien d'autre.
  const buf = await sharp(SOURCE)
    .ensureAlpha()
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const apres = await sharp(buf).metadata();
  fs.writeFileSync(DEST, buf);

  const ratio = (apres.width / apres.height).toFixed(2);
  console.log(`logo installé : ${avant.width}×${avant.height} → ${apres.width}×${apres.height} (ratio ${ratio})`);
  console.log(`  ${DEST}`);
  // À 300 dpi, un logo de 40 mm de large demande ~473 px.
  const dpi40 = Math.round(apres.width / (40 / 25.4));
  console.log(`  résolution effective à 40 mm de large : ${dpi40} dpi ${dpi40 >= 300 ? "✅" : "🔴 insuffisant pour l'impression"}`);
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
