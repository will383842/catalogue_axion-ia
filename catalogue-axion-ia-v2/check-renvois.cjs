/* =============================================================
   CHECK-RENVOIS — chaque « p. NN » imprimé désigne-t-il la bonne page ?

   POURQUOI CETTE GARDE EXISTE

   Le catalogue est passé de 24 à 48 pages. Tous les renvois écrits pour
   l'édition 24 pages ont survécu au passage et pointent à côté. Cinq ont été
   repris à la main ; TROIS AUTRES sont restés, et n'ont ete trouves qu'en
   relisant les 48 pages a l'oeil, une fois le catalogue deja publie :

     · p.7  « Séminaire IA … voir p. 15 »        → le séminaire est en 17
     · p.18 « Séminaire IA … (voir p. 15) »       → idem
     · p.44 « IA pour l'automatisation, p. 9 »    → elle est en 11

   Ils avaient echappe au balayage precedent parce que celui-ci cherchait des
   TOURNURES (« voir p. », « (voir p. ) »). Deux portaient une espace
   insecable, le troisieme etait glisse au milieu d'une phrase. Un balayage qui
   part de la formulation rate tout ce qui ne l'emploie pas.

   CE CONTRÔLE PART DONC DES NUMÉROS, PAS DES TOURNURES.

   Il releve TOUS les « p. NN » / « pages NN-MM » de la sortie, et exige que
   chacun soit DÉCLARÉ ci-dessous avec le repere que la page citee doit
   contenir. Un renvoi non declare fait rougir : on ne peut pas ajouter un
   renvoi sans dire ce qu'il est cense designer.

   C'est le meme principe que les marqueurs du sommaire dans `renumber.cjs` :
   verifier un numero contre un AUTRE numero ne prouve rien — les deux peuvent
   avoir derive ensemble. Seul le CONTENU de la page citee fait foi.

   Usage : node check-renvois.cjs [chemin.html]
   ============================================================= */
const fs = require("fs");
const path = require("path");

const cible = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, "index.html");
const html = fs.readFileSync(cible, "utf8");
const pages = html.split(/(?=<section class="page")/).slice(1);
const TOTAL = pages.length;

const texte = (p) =>
  p
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#8209;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const TEXTES = pages.map(texte);

// ---------------------------------------------------------------------------
// LES RENVOIS ATTENDUS
//
// `ou`      la page qui PORTE le renvoi
// `amorce`  ce qui precede le numero — identifie le renvoi sans ambiguite
// `repere`  ce que la page CITÉE doit contenir. C'est la seule chose qui
//           prouve que le renvoi tombe juste.
//
// Une plage « p. 8 à 17 » est verifiee aux DEUX bouts : la borne haute d'une
// plage qui annonce « 1 séminaire » doit couvrir la page du seminaire. C'est
// exactement ce qui manquait : la tuile disait « 8 à 16 », le seminaire est
// en 17, et personne ne l'avait vu.
// ---------------------------------------------------------------------------
const ATTENDUS = [
  { ou: 1, amorce: "La réponse", repere: "Quatre façons de" },
  { ou: 2, amorce: "en une", repere: "Quelle formation" },
  { ou: 5, amorce: "inclus (voir", repere: "coup de projecteur" },

  { ou: 6, amorce: "1 séminaire", repere: "IA pour bien commencer", repereFin: "Séminaire IA" },
  { ou: 6, amorce: "suivi régulier", repere: "une journée, ses vrais dossiers", repereFin: "Coaching régulier" },
  { ou: 6, amorce: "de la TPE à l'ETI", repere: "On regarde comment vous", repereFin: "Audit Stratégique ETI" },
  { ou: 6, amorce: "agents · données", repere: "On ne s'arrête pas", repereFin: "IA custom d'entreprise" },

  { ou: 7, amorce: "Offres générales 4 formations ·", repere: "IA pour bien commencer", repereFin: "IA pour l'automatisation" },
  { ou: 7, amorce: "Par métier 9 formations ·", repere: "L'IA par métier", repereFin: "IA pour l'IT" },
  { ou: 7, amorce: "Par secteur d'activité 8 formations ·", repere: "L'IA par secteur", repereFin: "IA pour la banque" },
  { ou: 7, amorce: "dès 990 € HT, voir", repere: "une journée, ses vrais dossiers", repereFin: "Coaching régulier" },
  { ou: 7, amorce: "jusqu'à 50 personnes — voir", repere: "Séminaire IA" },

  { ou: 11, amorce: "de nos automatisations (voir", repere: "Automatisés au maximum", repereFin: "Et dans votre entreprise" },

  { ou: 18, amorce: "Séminaire IA jusqu'à 50 pers. (voir", repere: "Séminaire IA" },
  { ou: 18, amorce: "grille complète", repere: "Tous nos tarifs" },

  { ou: 19, amorce: "pas de financement OPCO. Voir", repere: "Ce qui est finançable" },
  { ou: 23, amorce: "non finançable par un OPCO. Voir", repere: "Ce qui est finançable" },
  { ou: 29, amorce: "non finançable par un OPCO. Voir", repere: "Ce qui est finançable" },
  { ou: 36, amorce: "Montage du dossier inclus — voir", repere: "Ce qui est finançable" },

  { ou: 44, amorce: "IA pour l'automatisation (2 jours,", repere: "IA pour l'automatisation" },
];

// ---------------------------------------------------------------------------
let ko = 0;
const dire = (ok, msg) => {
  if (!ok) ko++;
  console.log(`${ok ? "✅" : "🔴"} ${msg}`);
};

// 1. Relever tous les numeros de page cites, sans presumer de la tournure.
const RE = /(?:p\.|pages?)\s?(\d{1,2})(?:\s?(?:-|–|à|a|et)\s?(\d{1,2}))?/g;
const trouves = [];
TEXTES.forEach((t, i) => {
  for (const m of t.matchAll(RE)) {
    // « pages 12-14 » d'un titre courant, « 2 jours » etc. : on ne garde que ce
    // qui ressemble a un renvoi, c'est-a-dire un nombre dans la pagination.
    const n = +m[1];
    if (n < 1 || n > TOTAL) {
      trouves.push({ ou: i + 1, n, fin: null, avant: t.slice(Math.max(0, m.index - 60), m.index).trim(), horsDoc: true });
      continue;
    }
    trouves.push({
      ou: i + 1,
      n,
      fin: m[2] ? +m[2] : null,
      avant: t.slice(Math.max(0, m.index - 60), m.index).trim(),
    });
  }
});

console.log(`=== ${trouves.length} renvois relevés dans ${TOTAL} pages ===\n`);

// 2. Hors document / circulaire — deux fautes qui ne demandent aucune declaration.
console.log("=== NUMÉROS IMPOSSIBLES ===\n");
const impossibles = trouves.filter((r) => r.horsDoc || r.n === r.ou || (r.fin && (r.fin > TOTAL || r.fin < r.n)));
if (!impossibles.length) console.log("  ✅ aucun renvoi hors document ni circulaire");
for (const r of impossibles)
  console.log(
    `  🔴 p.${r.ou} → p.${r.n}${r.fin ? "-" + r.fin : ""} ` +
      `${r.horsDoc ? "HORS DOCUMENT" : r.n === r.ou ? "CIRCULAIRE" : "PLAGE INVALIDE"} — «…${r.avant.slice(-45)}»`,
  );
if (impossibles.length) ko += impossibles.length;

// 3. Chaque renvoi doit etre declare, et la page citee porter son repere.
console.log("\n=== LA PAGE CITÉE PORTE-T-ELLE CE QU'ON Y ANNONCE ? ===\n");
const utilises = new Set();
const orphelins = [];
for (const r of trouves) {
  if (r.horsDoc) continue;
  const d = ATTENDUS.find(
    (a, k) => !utilises.has(k) && a.ou === r.ou && r.avant.replace(/\s+/g, " ").endsWith(a.amorce),
  );
  if (!d) {
    orphelins.push(r);
    continue;
  }
  utilises.add(ATTENDUS.indexOf(d));

  const cible1 = TEXTES[r.n - 1] || "";
  const ok1 = cible1.includes(d.repere);
  dire(ok1, `p.${String(r.ou).padStart(2)} → p.${String(r.n).padStart(2)}  « ${d.repere} »${ok1 ? "" : "  ABSENT de la page citée"}`);

  if (d.repereFin) {
    const fin = r.fin || r.n;
    const cible2 = TEXTES[fin - 1] || "";
    const ok2 = cible2.includes(d.repereFin);
    dire(
      ok2,
      `p.${String(r.ou).padStart(2)} → p.${String(fin).padStart(2)}  « ${d.repereFin} » (fin de plage)` +
        (ok2 ? "" : "  ABSENT — la plage ne couvre pas ce qu'elle annonce"),
    );
  }
}

console.log("\n=== RENVOIS NON DÉCLARÉS ===\n");
if (!orphelins.length) console.log("  ✅ tous les renvois sont déclarés");
for (const r of orphelins)
  console.log(`  🔴 p.${r.ou} → p.${r.n}${r.fin ? "-" + r.fin : ""} — «…${r.avant.slice(-50)}»  → à déclarer dans ATTENDUS`);
ko += orphelins.length;

const inutilises = ATTENDUS.filter((_, k) => !utilises.has(k));
if (inutilises.length) {
  console.log("\n=== DÉCLARATIONS QUI NE CORRESPONDENT PLUS À RIEN ===\n");
  for (const a of inutilises) console.log(`  🔴 p.${a.ou} « …${a.amorce} » — amorce introuvable dans la sortie`);
  ko += inutilises.length;
}

// 4. Toutes les images pointent-elles sur un fichier existant ?
console.log("\n=== IMAGES ===\n");
let imgKo = 0;
pages.forEach((p, i) => {
  for (const m of p.matchAll(/<img[^>]*src="([^"]+)"/g)) {
    const s = m[1];
    if (/^(data:|https?:)/.test(s)) continue;
    if (!fs.existsSync(path.resolve(path.dirname(cible), decodeURIComponent(s)))) {
      imgKo++;
      console.log(`  🔴 p.${i + 1} — ${s} : le fichier n'existe pas, l'image est CASSÉE à l'impression`);
    }
  }
});
if (!imgKo) console.log("  ✅ toutes les images pointent sur un fichier existant");
ko += imgKo;

console.log(ko === 0 ? "\n=== ✅ renvois et images vérifiés ===" : `\n=== 🔴 ${ko} anomalie(s) ===`);
process.exit(ko === 0 ? 0 : 1);
