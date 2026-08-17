/* =============================================================
   LIB-QR — socle commun des outils QR du catalogue A4.

   POURQUOI CE FICHIER EXISTE (2026-08-17)

   `scan-qr.cjs` et `convert-qr-dynamic.cjs` chargeaient sharp / qrcode par
   un chemin absolu vers `Axion-IA/axionia-wt-qr/node_modules` — un worktree
   git supprimé depuis. Les deux scripts plantaient au require, donc :
     - le convertisseur ne pouvait plus régénérer un QR ;
     - et surtout LA GARDE NE TOURNAIT PLUS. Le contrôle censé relire chaque
       QR comme le ferait un téléphone échouait avant d'avoir rien vérifié.

   Un QR imprimé est irrévocable. Une garde qui ne s'exécute pas est pire
   qu'une absence de garde : elle laisse croire que le contrôle a eu lieu.

   D'où ce socle : il cherche les dépendances à plusieurs endroits connus et
   ÉCHOUE BRUYAMMENT si aucun ne répond, au lieu de laisser un require nu
   casser avec une trace illisible.
   ============================================================= */
const fs = require("fs");
const path = require("path");

// Emplacements connus, du plus proche au plus lointain.
const RACINES = [
  path.join(__dirname, "node_modules"),
  "C:/Users/willi/Bookforge/packages/fabrication/node_modules",
  "C:/Users/willi/Documents/Projets/Axion-IA/axionia/node_modules",
];

function charger(nom) {
  const essais = [];
  for (const racine of RACINES) {
    const p = path.join(racine, nom);
    essais.push(p);
    if (fs.existsSync(p)) {
      const m = require(p);
      return m.default || m;
    }
  }
  throw new Error(
    [
      `[lib-qr] dépendance « ${nom} » introuvable.`,
      `  Cherchée dans :`,
      ...essais.map((p) => `    - ${p}`),
      ``,
      `  Les QR ne peuvent être ni générés ni vérifiés sans elle.`,
      `  Installer : npm i ${nom}  (depuis ${__dirname})`,
    ].join("\n"),
  );
}

const QRCode = charger("qrcode");
const sharp = charger("sharp");
const jsQR = charger("jsqr");

const BASE = "https://axion-ia.com/qr/";

/** Génère le SVG d'un QR dynamique — mêmes réglages que le livre KDP. */
async function svgPour(slug) {
  const svg = await QRCode.toString(BASE + slug, {
    type: "svg",
    margin: 2, // zone de silence : indispensable au scan sur papier
    errorCorrectionLevel: "M",
  });
  return {
    complet: svg,
    viewBox: svg.match(/viewBox="([^"]+)"/)[1],
    paths: (svg.match(/<path[^>]*\/>/g) || []).join(""),
  };
}

/** Relit un QR comme le ferait un téléphone : rasterisation + décodage. */
async function decoder(viewBox, paths, taille = 700) {
  const propre =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" ` +
    `viewBox="${viewBox}" shape-rendering="crispEdges">` +
    `<rect width="100%" height="100%" fill="#fff"/>${paths}</svg>`;
  const { data, info } = await sharp(Buffer.from(propre))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const res = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  return res ? res.data : null;
}

/** Génère ET vérifie : un QR non relu ne sort jamais d'ici. */
async function svgVerifie(slug) {
  const { complet, viewBox, paths } = await svgPour(slug);
  const relu = await decoder(viewBox, paths);
  if (relu !== BASE + slug) {
    throw new Error(`[lib-qr] QR « ${slug} » illisible ou incorrect au décodage : ${relu || "échec"}`);
  }
  return { complet, viewBox, paths };
}

/** Interroge la prod : le slug est-il vivant, et vers où redirige-t-il ? */
async function resoudre(slug) {
  try {
    const r = await fetch(BASE + slug, { redirect: "manual" });
    return { status: r.status, destination: r.headers.get("location") || "" };
  } catch (e) {
    return { status: "ERR", destination: String(e.message || e).slice(0, 90) };
  }
}

/** Extrait tous les QR inline d'un HTML : [{ label, viewBox, paths }]. */
function qrDuHtml(html) {
  return (html.match(/<svg role="img"[\s\S]*?<\/svg>/g) || []).map((svg) => ({
    label: (svg.match(/aria-label="([^"]*)"/) || [])[1] || "(sans label)",
    viewBox: (svg.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 29 29",
    paths: (svg.match(/<path[^>]*\/>/g) || []).join(""),
  }));
}

module.exports = { BASE, QRCode, svgPour, svgVerifie, decoder, resoudre, qrDuHtml };
