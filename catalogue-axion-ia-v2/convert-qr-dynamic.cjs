// Convertit les QR statiques du catalogue (appel, formations, linkedin) en
// QR dynamiques /qr/<slug> — destination pilotable en console, sans réimprimer.
// Préserve le style (taille) de chaque emplacement ; ne touche pas aux avis
// (déjà dynamiques). Régénère aussi les assets qr-*.svg racine.
const fs = require("fs");
const path = require("path");
const QRCode = require("C:/Users/willi/Documents/Projets/Axion-IA/axionia-wt-qr/node_modules/qrcode");

const BASE = "https://axion-ia.com/qr/";
// slug -> { url encodée, labels aria à cibler dans le HTML }
const TARGETS = [
  { slug: "formations", labels: ["QR vers axion-ia.com/fr/formations", "QR — toutes nos formations"], newLabel: "QR — toutes nos formations" },
  { slug: "appel", labels: ["QR réserver un appel de cadrage"], newLabel: "QR réserver un appel de cadrage" },
  { slug: "appel", labels: ["QR réserver un appel"], newLabel: "QR réserver un appel" },
  { slug: "linkedin", labels: ["QR page LinkedIn Axion-IA", "QR page LinkedIn"], newLabel: "QR page LinkedIn" },
];

async function innerSvg(url) {
  // margin 2 = zone de silence pour un scan fiable en impression
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
  const vb = svg.match(/viewBox="([^"]+)"/)[1];
  const paths = (svg.match(/<path[^>]*\/>/g) || []).join("");
  return { vb, paths };
}

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

(async () => {
  const file = path.join(__dirname, "index.html");
  let html = fs.readFileSync(file, "utf8");
  let totalReplaced = 0;

  for (const t of TARGETS) {
    const { vb, paths } = await innerSvg(BASE + t.slug);
    for (const label of t.labels) {
      // capture le style (taille) de chaque <svg> ciblé, reconstruit en préservant le style
      const re = new RegExp(
        `<svg role="img" aria-label="${esc(label)}"[^>]*?style="([^"]*)"[^>]*?>[\\s\\S]*?<\\/svg>`,
        "g"
      );
      html = html.replace(re, (m, style) => {
        totalReplaced++;
        return `<svg role="img" aria-label="${t.newLabel}" style="${style}" xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" shape-rendering="crispEdges">${paths}</svg>`;
      });
    }
    // asset autonome
    const assetPath = path.join(__dirname, `qr-${t.slug}.svg`);
    const full = await QRCode.toString(BASE + t.slug, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
    fs.writeFileSync(assetPath, full);
  }

  fs.writeFileSync(file, html);
  console.log(`SVG inline remplacés: ${totalReplaced}`);
  console.log("Assets régénérés: qr-formations.svg, qr-appel.svg, qr-linkedin.svg");
})();
