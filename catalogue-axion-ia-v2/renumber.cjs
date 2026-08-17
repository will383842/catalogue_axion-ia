/* =============================================================
   RENUMBER — recalcule la pagination et le sommaire.

   POURQUOI CE FICHIER EXISTE

   Les numéros de pied de page (« 06 / 24 ») et les renvois du sommaire
   étaient écrits EN DUR dans chaque page. Tant que le catalogue faisait
   24 pages figées, ça tenait. Dès qu'on insère une page — le QR en p.3 —
   tout se décale d'un rang, et un numéro faux ne se voit pas à la
   relecture : il se voit sur le papier livré.

   Ce script dérive la pagination de l'ORDRE RÉEL des sections dans le
   document. Il n'y a plus de numéro à tenir à la main.

   Les pages sans folio (couverture et 4e de couverture) sont sautées :
   elles comptent dans la pagination mais n'affichent rien, conformément à
   l'usage — c'était déjà le cas dans la maquette d'origine.

   Usage : node renumber.cjs
   ============================================================= */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "index.html");
let html = fs.readFileSync(SRC, "utf8");

// ---------------------------------------------------------------------------
// 1. Pieds de page
// ---------------------------------------------------------------------------
const blocs = html.split(/(?=<section class="page")/);
const tete = blocs[0];
const pages = blocs.slice(1);
const total = pages.length;

if (total % 4 !== 0) {
  console.error(
    `🔴 ${total} pages — un livret piqué à cheval exige un multiple de 4.\n` +
      `   Ajouter ou retirer ${4 - (total % 4)} page(s) avant d'imprimer.`,
  );
  process.exit(1);
}

let avecFolio = 0;
const renumerotees = pages.map((p, i) => {
  const num = String(i + 1).padStart(2, "0");
  // La 4e de couverture ne porte pas de folio — pas plus que la 1re. Le bandeau
  // de pied reste (il porte l'appel à l'action), seul le numéro disparaît.
  if (i === pages.length - 1) {
    return p.replace(/(<div class="footer">[\s\S]*?<div class="r">)([^<]*)(<\/div>)/, "$1$3");
  }
  return p.replace(
    /(<div class="footer">[\s\S]*?<div class="r">)([^<]*)(<\/div>)/,
    (m, avant, _ancien, apres) => {
      avecFolio++;
      return `${avant}${num} / ${total}${apres}`;
    },
  );
});

html = tete + renumerotees.join("");

// ---------------------------------------------------------------------------
// 2. Sommaire (page 2)
//
// Les renvois sont déclarés ici, en un seul endroit. Si une page bouge, on
// corrige ce tableau — pas douze fragments de HTML disséminés.
// ---------------------------------------------------------------------------
// 6 entrées par colonne : au-delà, la page 2 déborde (l'édito et le bandeau
// de logos occupent déjà les deux tiers). Vérifié par `check-overflow.cjs` —
// 8 par colonne rognaient 27 mm.
const SOMMAIRE = [
  [
    ["03", "Le catalogue en ligne", "Toutes les offres à jour — un QR, un lien"],
    ["04", "Pourquoi former vos équipes à l'IA", "Temps gagné · conformité AI&nbsp;Act"],
    ["06", "Cinq façons de travailler ensemble", "La carte de toute l'offre, en une page"],
    ["07", "Quelle formation pour vous ?", "Le guide pour choisir en une minute"],
    ["08", "Les offres générales", "4 fiches détaillées — le socle pour toute l'équipe"],
    ["12", "L'IA par métier — 9 formations", "RH · Marketing · Commercial · Finance · Juridique…"],
  ],
  [
    ["15", "L'IA par secteur — 8 formations", "Santé · BTP · Immobilier · Commerce · Industrie…"],
    ["17", "Séminaire IA — toute l'entreprise", "Jusqu'à 50 personnes, en une journée"],
    ["20", "Accompagnement 1-to-1 — 3 formules", "Dirigeant · collaborateur · coaching régulier"],
    ["24", "Audit IA — 4 niveaux", "Méthode en 8 étapes · recommandations chiffrées"],
    ["30", "Implémentation &amp; automatisation", "5 domaines — processus, chatbots, agents, documents"],
    ["37", "Tarifs, financement &amp; témoignages", "Toutes les offres · 6 témoignages à scanner"],
  ],
];

const NOUVEAUTE =
  '<span style="font-size:7pt;font-weight:900;color:#fff;background:var(--terra);padding:1px 6px;border-radius:999px;letter-spacing:.08em;vertical-align:middle">✦ NOUVEAUTÉ</span>';

const tocHtml =
  `<div class="toc2" style="margin-top:2mm">\n` +
  SOMMAIRE.map(
    (col) =>
      `      <div>\n` +
      col
        .map(
          ([pg, t, s]) =>
            `        <div class="e"><span class="pg">${pg}</span><div><div class="t">${
              t.endsWith("✦") ? t.slice(0, -1) + NOUVEAUTE : t
            }</div><div class="s">${s}</div></div></div>`,
        )
        .join("\n") +
      `\n      </div>`,
  ).join("\n") +
  `\n    </div>`;

const avantToc = html;
html = html.replace(/<div class="toc2"[\s\S]*?\n    <\/div>/, tocHtml);
if (html === avantToc) {
  console.error("🔴 sommaire introuvable — la structure de la page 2 a changé.");
  process.exit(1);
}

// Compteur « N pages · … » de l'en-tête du sommaire
html = html.replace(
  /(<span class="mono"[^>]*>)\s*\d+\s*pages[^<]*(<\/span>)/,
  `$1${total} pages · 21 formations + 1 séminaire + 12 prestations$2`,
);

fs.writeFileSync(SRC, html, "utf8");

const entrees = SOMMAIRE.flat().length;
console.log(`Pagination : ${total} pages (${total / 4} feuillets), ${avecFolio} folios écrits`);
console.log(`  sans folio : ${total - avecFolio} (1re et 4e de couverture, page contact)`);
console.log(`Sommaire : ${entrees} entrées régénérées`);

// Garde : tout renvoi du sommaire doit désigner une page qui existe.
const hors = SOMMAIRE.flat().filter(([pg]) => Number(pg) < 1 || Number(pg) > total);
if (hors.length) {
  console.error(`🔴 renvois hors du document : ${hors.map((h) => h[0]).join(", ")}`);
  process.exit(1);
}
