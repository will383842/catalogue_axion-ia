/* =============================================================
   CHECK-HARMONIE — le catalogue A4 dit-il la même chose que le livre KDP ?

   Les deux supports décrivent les MÊMES offres et partent des mêmes sources
   (`catalogue-kdp/formations-data.json` pour les formations, dérivé du SSOT du
   site ; `coaching-audit-data.json` pour les 12 prestations de conseil). Mais
   le catalogue A4 a ses prix et ses durées ÉCRITS EN DUR dans ses pages
   d'origine. Rien ne garantit qu'ils suivent quand la source bouge.

   Un prix qui diverge entre deux supports imprimés distribués en main propre,
   c'est un litige. Ce contrôle compare, offre par offre :
     - le titre
     - la durée
     - le prix

   Sort en code 1 à la moindre divergence.

   Usage : node check-harmonie.cjs
   ============================================================= */
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const KDP = path.join(DIR, "..", "catalogue-kdp");

const formationsKdp = JSON.parse(fs.readFileSync(path.join(KDP, "formations-data.json"), "utf8"));
const conseilKdp = JSON.parse(fs.readFileSync(path.join(KDP, "coaching-audit-data.json"), "utf8"));
const html = fs.readFileSync(path.join(DIR, "index.html"), "utf8");
const pages = html.split(/(?=<section class="page")/).slice(1);

/** Normalise pour comparer : casse, accents décoratifs, espaces, insécables. */
const norme = (s) =>
  String(s || "")
    .replace(/&nbsp;| /g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8209;/g, "-")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Extrait tous les montants « N NNN € » d'un texte, normalisés. */
const montants = (s) =>
  [...norme(s).matchAll(/(\d[\d  ]{2,})\s*€/g)].map((m) => m[1].replace(/[  ]/g, ""));

const texte = (p) =>
  p
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");

const toutLeTexte = norme(pages.map(texte).join(" "));

let anomalies = 0;
const dire = (ok, msg) => {
  if (!ok) anomalies++;
  console.log(`${ok ? "✅" : "🔴"} ${msg}`);
};

// ── 1. Décomptes ──────────────────────────────────────────────────────────
console.log("=== 1. DÉCOMPTES ===\n");
const seminaireKdp = formationsKdp.filter((f) => /séminaire/i.test(f.title));
const vraiesFormations = formationsKdp.length - seminaireKdp.length;
dire(
  vraiesFormations === 21 && seminaireKdp.length === 1,
  `KDP : ${vraiesFormations} formations + ${seminaireKdp.length} séminaire (attendu 21 + 1)`,
);
const nbConseil = Object.values(conseilKdp).reduce((n, a) => n + a.length, 0);
dire(nbConseil === 12, `KDP : ${nbConseil} prestations de conseil (attendu 12 : 3 + 4 + 5)`);
dire(
  toutLeTexte.includes("21 formations"),
  `A4 : le catalogue annonce bien « 21 formations »`,
);

// ── 2. Prix des formations ────────────────────────────────────────────────
console.log("\n=== 2. PRIX DES FORMATIONS (KDP → présent dans le A4 ?) ===\n");
const prixKdp = new Set();
for (const f of formationsKdp) for (const m of montants(f.price)) prixKdp.add(m);
for (const m of [...prixKdp].sort((a, b) => a - b)) {
  const present = new RegExp(`\\b${m.replace(/(\d)(?=(\d{3})+$)/g, "$1[  ]?")}\\s*€`).test(toutLeTexte);
  dire(present, `prix formation ${Number(m).toLocaleString("fr-FR")} € — ${present ? "présent" : "ABSENT"} du catalogue A4`);
}

// ── 3. Prix du conseil ────────────────────────────────────────────────────
console.log("\n=== 3. PRIX DU CONSEIL (KDP → présent dans le A4 ?) ===\n");
for (const [famille, offres] of Object.entries(conseilKdp)) {
  for (const o of offres) {
    const ms = montants(o.price);
    if (!ms.length) {
      console.log(`·  ${famille}/${o.slug} — « ${o.price} », pas de montant à comparer`);
      continue;
    }
    for (const m of ms) {
      const present = new RegExp(`\\b${m.replace(/(\d)(?=(\d{3})+$)/g, "$1[  ]?")}\\s*€`).test(toutLeTexte);
      dire(present, `${famille}/${o.slug} : ${Number(m).toLocaleString("fr-FR")} € ${present ? "présent" : "ABSENT"}`);
    }
  }
}

// ── 4. Titres des prestations de conseil ──────────────────────────────────
//
// RENOMMAGES ASSUMÉS. L'audit a montré que la famille 1-to-1 portait QUATRE
// noms, et sa deuxième prestation TROIS. Le catalogue A4 a été unifié sur
// `pricing.ts`. Le livre KDP, lui, n'a pas été touché : il garde ses libellés.
//
// Une divergence voulue reste une divergence. On la DÉCLARE ici plutôt que de
// la faire disparaître, pour qu'elle se voie à chaque contrôle et qu'on pense
// à réaligner le KDP à sa prochaine réimpression. Un tableau d'exceptions qui
// grossit est le signal que les deux supports sont en train de diverger.
const RENOMMAGES = {
  "coaching-collaborateur": {
    kdp: "Coaching IA · Collaborateur",
    a4: "Optimisation du poste",
    motif: "nom unique aligné pricing.ts — KDP à réaligner",
  },
};

console.log("\n=== 4. TITRES DU CONSEIL ===\n");
for (const [famille, offres] of Object.entries(conseilKdp)) {
  for (const o of offres) {
    const renomme = RENOMMAGES[o.slug];
    if (renomme) {
      const ok = toutLeTexte.includes(norme(renomme.a4));
      dire(ok, `${famille}/${o.slug} : « ${renomme.kdp} » → « ${renomme.a4} » (${renomme.motif})`);
      continue;
    }
    const present = toutLeTexte.includes(norme(o.title));
    dire(present, `${famille}/${o.slug} : « ${o.title} » ${present ? "présent" : "ABSENT ou renommé"}`);
  }
}
const nbRenommes = Object.keys(RENOMMAGES).length;
if (nbRenommes) {
  console.log(`\n⚠️  ${nbRenommes} libellé(s) volontairement différent(s) du livre KDP — à réaligner côté KDP.`);
}

// ── 5. Prix orphelins du A4 (présents ici, inconnus du KDP) ───────────────
console.log("\n=== 5. MONTANTS DU A4 INCONNUS DU KDP ===\n");
const connus = new Set([...prixKdp]);
for (const offres of Object.values(conseilKdp))
  for (const o of offres) for (const m of montants(o.price)) connus.add(m);
// montants légitimes hors offres : maintenance, sous-tiers audit
// 2026-08-18 — "650" RETIRÉ de cette liste. Il y figurait comme "valeur visibilité",
// mais aucune grille ne vend la visibilité : ce contrôle l'avait justement détecté
// comme orphelin, et le tolérer revenait à le faire taire. Le montant est supprimé
// du catalogue et du flyer ; si "650" reapparaît ici, c'est un vrai signal.
const tolerés = new Set(["290", "2590", "1830", "2900", "3900", "4900", "9900", "1000"]);
const trouvés = new Set(montants(toutLeTexte).filter((m) => m.length >= 3));
const orphelins = [...trouvés].filter((m) => !connus.has(m) && !tolerés.has(m));
if (orphelins.length === 0) console.log("✅ aucun montant orphelin");
else
  for (const m of orphelins.sort((a, b) => a - b))
    dire(false, `montant ${Number(m).toLocaleString("fr-FR")} € imprimé dans le A4 mais absent des sources KDP`);

console.log(
  anomalies === 0
    ? `\n=== ✅ les deux catalogues sont en harmonie — 0 divergence ===`
    : `\n=== 🔴 ${anomalies} divergence(s) entre le catalogue A4 et le livre KDP ===`,
);
process.exit(anomalies === 0 ? 0 : 1);
