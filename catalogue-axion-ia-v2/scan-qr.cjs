/* =============================================================
   SCAN-QR — garde de bout en bout des QR du catalogue A4.

   Un QR imprimé est irrévocable. Cette garde vérifie DEUX choses que
   personne ne peut contrôler à l'œil sur une épreuve :

     1. DÉCODAGE — chaque QR de index.html et chaque asset qr-*.svg est
        rasterisé puis relu, comme le ferait un téléphone. Un QR illisible
        ne doit jamais partir à l'impression.

     2. RÉSOLUTION — chaque slug décodé est interrogé en production
        (https://axion-ia.com/qr/<slug>). Un slug absent de la table QrLink
        rend 404 : le QR part alors MORT sur le papier. C'est le mode de
        panne le plus coûteux, et le seul qu'un contrôle visuel ne voit pas.

   Sort en code 1 à la moindre anomalie, pour être enchaîné avant un build
   d'impression.

   ⚠️ 2026-08-17 — RÉPARÉ. Le script chargeait sharp depuis
   `Axion-IA/axionia-wt-qr/node_modules`, un worktree git supprimé : il
   plantait au require, donc LA GARDE NE TOURNAIT PLUS DU TOUT. Les
   dépendances passent désormais par `lib-qr.cjs`, qui les cherche à
   plusieurs endroits connus et échoue avec un message explicite.
   La liste des URLs attendues n'est plus tenue à la main non plus (elle
   dérivait dès qu'on ajoutait un QR) : elle se DÉDUIT du HTML, et tout QR
   qui n'encode pas une URL /qr/<slug> est signalé comme non pilotable.
   ============================================================= */
const fs = require("fs");
const path = require("path");
const { decoder, resoudre, qrDuHtml } = require("./lib-qr.cjs");

const DIR = __dirname;

/** Un QR du catalogue doit encoder /qr/<slug> — jamais une URL finale en dur. */
function slugDe(url) {
  const m = (url || "").match(/^https:\/\/axion-ia\.com\/qr\/([a-z0-9-]+)$/i);
  return m ? m[1] : null;
}

(async () => {
  const sources = [];

  const html = fs.readFileSync(path.join(DIR, "index.html"), "utf8");
  for (const qr of qrDuHtml(html)) sources.push({ origine: "index.html", ...qr });

  for (const f of fs.readdirSync(DIR).filter((f) => /^qr-.*\.svg$/.test(f))) {
    const svg = fs.readFileSync(path.join(DIR, f), "utf8");
    sources.push({
      origine: f,
      label: f,
      viewBox: (svg.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 29 29",
      paths: (svg.match(/<path[^>]*\/>/g) || []).join(""),
    });
  }

  if (sources.length === 0) {
    console.error("❌ aucun QR trouvé — la garde n'a rien vérifié. C'est une anomalie en soi.");
    process.exit(1);
  }

  let anomalies = 0;

  console.log("=== 1. DÉCODAGE (rasterisé 700 px, relu comme un téléphone) ===\n");
  const slugs = new Set();
  for (const s of sources) {
    const url = await decoder(s.viewBox, s.paths);
    const slug = slugDe(url);
    if (!url) {
      console.log(`❌ ${s.origine.padEnd(26)} ${s.label.slice(0, 40).padEnd(42)} ÉCHEC DE DÉCODAGE`);
      anomalies++;
    } else if (!slug) {
      console.log(`⚠️  ${s.origine.padEnd(26)} ${s.label.slice(0, 40).padEnd(42)} ${url}`);
      console.log(`     └─ URL en dur : plus modifiable une fois imprimée.`);
      anomalies++;
    } else {
      console.log(`✅ ${s.origine.padEnd(26)} ${s.label.slice(0, 40).padEnd(42)} ${url}`);
      slugs.add(slug);
    }
  }

  console.log(`\n=== 2. RÉSOLUTION EN PRODUCTION (${slugs.size} slugs distincts) ===\n`);
  for (const slug of [...slugs].sort()) {
    const r = await resoudre(slug);
    if (r.status === 302 || r.status === 301) {
      console.log(`✅ ${slug.padEnd(22)} HTTP ${r.status} → ${r.destination}`);
    } else {
      console.log(`🔴 ${slug.padEnd(22)} HTTP ${r.status} ${r.destination}`);
      console.log(`     └─ slug absent ou inactif : ce QR serait imprimé MORT.`);
      console.log(`        À créer dans la console admin → QR codes & liens.`);
      anomalies++;
    }
  }

  console.log(
    anomalies === 0
      ? `\n=== ✅ ${sources.length} QR décodés · ${slugs.size} slugs vivants · 0 anomalie ===`
      : `\n=== 🔴 ${anomalies} anomalie(s) — NE PAS ENVOYER À L'IMPRESSION ===`,
  );
  process.exit(anomalies === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
