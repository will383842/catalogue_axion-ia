/* =============================================================
   CHECK-ORDRE — les 48 pages sont-elles dans le bon ordre, partout ?

   Trois supports doivent raconter la même séquence : l'HTML source, les images
   du feuilletoir, et le folio imprimé sur chaque page. Un décalage d'un seul
   rang entre eux — un fichier mal nommé, une page insérée, un manifeste pas
   régénéré — ne se voit qu'en feuilletant, et pas toujours.

   Ce contrôle vérifie, page par page :
     · le FOLIO imprimé correspond au rang réel de la page
     · le manifeste du feuilletoir liste les mêmes 48 pages, dans l'ordre
     · l'APPARIEMENT tombe juste : [1] (2|3) … (46|47) [48]
     · les BANDES de section sont sur la tranche EXTÉRIEURE
     · la séquence éditoriale suit l'ordre voulu : formations → séminaire →
       coaching → audit → implémentation → tarifs, visibilité en dernier

   Usage : node check-ordre.cjs
   ============================================================= */
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const html = fs.readFileSync(path.join(DIR, "index.html"), "utf8");
const pages = html.split(/(?=<section class="page")/).slice(1);

let ko = 0;
const dire = (ok, msg) => {
  if (!ok) ko++;
  console.log(`${ok ? "✅" : "🔴"} ${msg}`);
};

const texte = (p) =>
  p
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#8209;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const total = pages.length;

// ── 1. Folios ─────────────────────────────────────────────────────────────
console.log("=== 1. FOLIOS ===\n");
let ecarts = [];
// La 1re et la 4e de couverture ne portent JAMAIS de folio, et la page contact
// n'a pas de bandeau de pied : ce sont des choix de maquette, pas des oublis.
const SANS_FOLIO = new Set([1, total - 1, total]);
pages.forEach((p, i) => {
  const m = p.match(/<div class="footer">[\s\S]*?<div class="r">([^<]*)<\/div>/);
  if (!m) return; // pas de bandeau de pied du tout
  const n = i + 1;
  if (SANS_FOLIO.has(n)) {
    if (m[1].trim() !== "") ecarts.push(`p.${n} porte un folio « ${m[1].trim()} » alors qu'elle ne doit pas en avoir`);
    return;
  }
  const attendu = `${String(n).padStart(2, "0")} / ${total}`;
  if (m[1].trim() !== attendu) ecarts.push(`p.${n} affiche « ${m[1].trim() || "vide"} », attendu « ${attendu} »`);
});
dire(ecarts.length === 0, ecarts.length ? `${ecarts.length} folio(s) faux :\n     ${ecarts.join("\n     ")}` : `les ${total} folios suivent le rang réel`);

// ── 2. Manifeste du feuilletoir ───────────────────────────────────────────
console.log("\n=== 2. MANIFESTE DU FEUILLETOIR ===\n");
const chemManifeste = path.join(DIR, "pages-web", "manifest.json");
if (!fs.existsSync(chemManifeste)) {
  dire(false, "pages-web/manifest.json absent — lancer render-pages-web.cjs");
} else {
  const man = JSON.parse(fs.readFileSync(chemManifeste, "utf8")).pages;
  dire(man.length === total, `${man.length} images pour ${total} pages`);

  const mauvais = man.filter((p, i) => p.fichier !== `p${String(i + 1).padStart(2, "0")}.jpg`);
  dire(mauvais.length === 0, mauvais.length ? `fichiers hors séquence : ${mauvais.map((m) => m.fichier).join(", ")}` : "les fichiers se suivent p01 → p" + total);

  const seules = man.filter((p) => p.seule);
  dire(
    seules.length === 2 && man[0].seule && man[total - 1].seule,
    seules.length === 2 && man[0].seule && man[total - 1].seule
      ? "exactement 2 pages seules : la 1re et la 4e de couverture"
      : `pages seules : ${seules.map((s) => s.fichier).join(", ") || "aucune"} — attendu p01 et p${total}`,
  );

  const cotes = man.filter((p, i) => {
    if (i === 0 || i === total - 1) return false;
    const attendu = (i + 1) % 2 === 0 ? "gauche" : "droite";
    return p.cote !== attendu;
  });
  dire(cotes.length === 0, cotes.length ? `${cotes.length} page(s) du mauvais côté` : "les paires à gauche, les impaires à droite");

  // le folio du manifeste doit valoir le rang
  const folios = man.filter((p, i) => {
    if (i === 0 || i === total - 1) return p.numero !== "";
    return p.numero !== String(i + 1).padStart(2, "0");
  });
  dire(folios.length === 0, folios.length ? `${folios.length} folio(s) de manifeste faux` : "les folios du manifeste suivent le rang");
}

// ── 3. Appariement ────────────────────────────────────────────────────────
console.log("\n=== 3. APPARIEMENT DES DOUBLES ===\n");
dire(total % 2 === 0, `${total} pages — un livret se compose en pages paires`);
dire(total % 4 === 0, `${total} pages — piqûre à cheval : multiple de 4 (${total / 4} feuillets)`);
const doubles = [];
for (let i = 2; i <= total - 1; i += 2) doubles.push(`${i}|${i + 1}`);
console.log(`   [1]  ${doubles.slice(0, 3).join("  ")} … ${doubles.slice(-2).join("  ")}  [${total}]`);

// ── 4. Bandes de section sur la tranche extérieure ────────────────────────
console.log("\n=== 4. BANDES DE SECTION ===\n");
const bandes = [];
pages.forEach((p, i) => {
  const m = p.match(/class="sect-band (left|right)"[^>]*><span>([^<]*)</);
  if (m) bandes.push({ n: i + 1, cote: m[1], label: m[2].replace(/&amp;/g, "&") });
});
const mauvaisCote = bandes.filter((b) => b.cote !== (b.n % 2 === 1 ? "right" : "left"));
dire(mauvaisCote.length === 0, mauvaisCote.length ? `${mauvaisCote.length} bande(s) du mauvais côté : ${mauvaisCote.map((b) => "p." + b.n).join(", ")}` : `${bandes.length} bandes, toutes sur la tranche extérieure`);

// ── 5. Séquence éditoriale ────────────────────────────────────────────────
console.log("\n=== 5. SÉQUENCE ÉDITORIALE ===\n");
const ATTENDU = [
  [1, "L'IA,", "couverture"],
  [2, "mot du fondateur", "édito + sommaire"],
  [3, "catalogue en ligne", "QR du catalogue"],
  [6, "Quatre façons de", "carte de l'offre"],
  [7, "Quelle formation", "guide de choix"],
  [8, "Offre générale · nº 1", "1re fiche formation"],
  [17, "Séminaire IA", "séminaire"],
  [19, "une journée, ses vrais dossiers", "ouvreur coaching"],
  [23, "Avant d'investir, savoir", "ouvreur audit"],
  [29, "Le clé en main", "ouvreur implémentation"],
  [36, "Tous nos tarifs", "tarifs"],
  [37, "Ce qui est finançable", "financement"],
  [39, "Témoignage 1", "témoignages"],
  [47, "Parlons de vos", "contact"],
  [48, "coup de projecteur", "visibilité — 4e de couverture"],
];
const hors = ATTENDU.filter(([n, marqueur]) => !texte(pages[n - 1] || "").includes(marqueur));
for (const [n, , role] of ATTENDU) {
  const ok = texte(pages[n - 1] || "").includes(ATTENDU.find((a) => a[0] === n)[1]);
  if (!ok) console.log(`🔴 p.${String(n).padStart(2)} — ${role} : ABSENT`);
}
dire(hors.length === 0, hors.length ? `${hors.length} page(s) hors séquence` : `les ${ATTENDU.length} repères éditoriaux sont à leur place`);

console.log(ko === 0 ? "\n=== ✅ ordre vérifié — rien à signaler ===" : `\n=== 🔴 ${ko} anomalie(s) d'ordre ===`);
process.exit(ko === 0 ? 0 : 1);
