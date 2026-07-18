// "Scanne" les QR du catalogue : extrait chaque <svg> QR inline de index.html,
// le rasterise (sharp) et le décode (jsqr) — comme le ferait un téléphone.
const fs = require("fs");
const sharp = require("C:/Users/willi/Documents/Projets/Axion-IA/axionia-wt-qr/node_modules/sharp");
const jsQR = require("./node_modules/jsqr").default || require("./node_modules/jsqr");

const html = fs.readFileSync("index.html", "utf8");

// Attendus (slug -> URL encodée théorique)
const EXPECTED = {
  "QR — toutes nos formations": "https://axion-ia.com/qr/formations",
  "QR réserver un appel de cadrage": "https://axion-ia.com/qr/appel",
  "QR réserver un appel": "https://axion-ia.com/qr/appel",
  "QR page LinkedIn": "https://axion-ia.com/qr/linkedin",
  "QR interview vidéo (avis-catalogue-1)": "https://axion-ia.com/qr/avis-catalogue-1",
  "QR interview vidéo (avis-catalogue-2)": "https://axion-ia.com/qr/avis-catalogue-2",
};

// extrait tous les <svg role="img" ...>...</svg>
const svgs = html.match(/<svg role="img"[\s\S]*?<\/svg>/g) || [];

(async () => {
  let idx = 0, ok = 0, fail = 0;
  for (const svg of svgs) {
    idx++;
    const label = (svg.match(/aria-label="([^"]*)"/) || [])[1] || "(sans label)";
    const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 29 29";
    const paths = (svg.match(/<path[^>]*\/>/g) || []).join("");
    // SVG propre à taille fixe, fond blanc
    const clean = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700" viewBox="${vb}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/>${paths}</svg>`;
    const { data, info } = await sharp(Buffer.from(clean)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const res = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    const decoded = res ? res.data : null;
    const exp = EXPECTED[label];
    const match = decoded && exp && decoded === exp;
    if (match) ok++; else fail++;
    console.log(`${match ? "✅" : (decoded ? "⚠️ " : "❌")} [${label}]`);
    console.log(`     décodé : ${decoded || "ÉCHEC DE DÉCODAGE"}`);
    console.log(`     attendu: ${exp || "(inconnu)"}`);
  }
  console.log(`\n=== ${ok}/${svgs.length} QR décodés et conformes · ${fail} anomalie(s) ===`);
})();
