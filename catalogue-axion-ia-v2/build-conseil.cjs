/* =============================================================
   BUILD-CONSEIL — passe le catalogue de 24 à 48 pages.

   Ajoute les prestations de conseil (coaching 1-to-1, audit,
   implémentation), les témoignages et le QR « catalogue en ligne »,
   dans l'ordre voulu : formations → séminaire → coaching → audit →
   implémentation, et la page Visibilité en 4e de couverture.

   PRINCIPE — on ne tape aucune page à la main.

   Les 25 nouvelles pages dérivent d'une SSOT déjà écrite pour le livre KDP
   (`../catalogue-kdp/coaching-audit-data.json`). Les 23 pages existantes
   sont reprises TELLES
   QUELLES, à l'octet près : seul leur numéro de pied de page change, et il
   est recalculé par `renumber.cjs`. Les fiches formations ne sont jamais
   réécrites.

   IDEMPOTENT — chaque page générée porte le marqueur `<!-- GEN:conseil -->`.
   Au lancement, toutes les pages marquées sont retirées avant regénération,
   donc on peut relancer autant de fois qu'on veut sans empiler.

   CONTRAINTE D'IMPRESSION — livret piqué à cheval : le nombre de pages DOIT
   être un multiple de 4. Le script refuse de sortir si ce n'est pas le cas.

   CE QU'ON N'IMPRIME PAS, ET POURQUOI
     - les notes `rating` / `ratingCount` des audits (« 4,8/5 · 16 avis
       vérifiés ») : une note agrégée et le mot « vérifiés » sont des
       allégations opposables. Non reprises tant que la base d'avis n'est
       pas rattachée à des justificatifs.
     - aucun texte de témoignage (décision Will 2026-08-17). Les pages 38-39
       ne portent que six emplacements numérotés et leur QR. Voir plus bas.

   Usage : node build-conseil.cjs && node renumber.cjs
          (lit pages-source.html — 24 pages figées — et écrit index.html)
   ============================================================= */
const fs = require("fs");
const path = require("path");
const { svgVerifie } = require("./lib-qr.cjs");

const DIR = __dirname;
const KDP = path.join(DIR, "..", "catalogue-kdp");

// ⚠️ ENTRÉE ET SORTIE SONT DEUX FICHIERS DISTINCTS.
//
// `index.html` était à la fois la source et le rendu. Ça tenait tant que rien
// ne le transformait. Dès que ce script s'est mis à REMPLACER une page
// d'origine (l'ancienne « Trois façons de travailler ensemble » devenue
// « Cinq façons »), la transformation est devenue irréversible : relancer le
// build sur sa propre sortie ne retrouvait plus que 23 pages d'origine sur 24,
// et la page perdue l'était définitivement.
//
// `pages-source.html` porte donc les 24 pages d'origine, figées, jamais
// écrites par le build. `index.html` est une SORTIE, régénérable à volonté.
const SRC = path.join(DIR, "pages-source.html");
const OUT = path.join(DIR, "index.html");

const offres = JSON.parse(fs.readFileSync(path.join(KDP, "coaching-audit-data.json"), "utf8"));

// ---------------------------------------------------------------------------
// SLUGS QR — un par page actionnable.
//
// Préfixe `cat-` et non `livre-` : le livre KDP a ses propres slugs vers les
// mêmes destinations, et les compteurs de scans doivent rester séparés pour
// qu'on sache lequel des deux supports fait scanner. Réutiliser `livre-*`
// fusionnerait les statistiques des deux supports.
//
// ⚠️ Ces slugs doivent exister dans la console admin (QR codes & liens) AVANT
// impression. `scan-qr.cjs` échoue tant qu'un slug rend 404 — c'est voulu.
// ---------------------------------------------------------------------------
const QR = {
  "cat-catalogue": "https://axion-ia.com/fr/catalogue",
  "cat-coaching": "https://axion-ia.com/fr/un-a-un",
  "cat-c01": "https://axion-ia.com/fr/interventions/dirigeant-vision-strategique",
  "cat-c02": "https://axion-ia.com/fr/interventions/coaching-decouverte",
  "cat-c03": "https://axion-ia.com/fr/un-a-un",
  "cat-audit": "https://axion-ia.com/fr/audit",
  "cat-a01": "https://axion-ia.com/fr/audit/tpe-1-jour",
  "cat-a02": "https://axion-ia.com/fr/audit/cible",
  "cat-a03": "https://axion-ia.com/fr/audit/strategique-pme",
  "cat-a04": "https://axion-ia.com/fr/audit/strategique-eti",
  "cat-implementation": "https://axion-ia.com/fr/implementation",
  "cat-i01": "https://axion-ia.com/fr/implementation/processus",
  "cat-i02": "https://axion-ia.com/fr/implementation/chatbot",
  "cat-i03": "https://axion-ia.com/fr/implementation/agents",
  "cat-i04": "https://axion-ia.com/fr/implementation/documents",
  "cat-i05": "https://axion-ia.com/fr/implementation/ia-custom",
  "cat-avis-1": "https://axion-ia.com/fr/avis",
  "cat-avis-2": "https://axion-ia.com/fr/avis",
  "cat-avis-3": "https://axion-ia.com/fr/avis",
  "cat-avis-4": "https://axion-ia.com/fr/avis",
  "cat-avis-5": "https://axion-ia.com/fr/avis",
  "cat-avis-6": "https://axion-ia.com/fr/avis",
};

// ---------------------------------------------------------------------------
// RENVOIS DE PAGE — déclarés ici, jamais tapés dans une phrase.
//
// Les « voir p. 24 » étaient écrits en dur dans le texte des pages. Déplacer
// une section les rendait tous faux d'un coup, en silence : un renvoi faux ne
// se voit qu'une fois le catalogue entre les mains d'un client. Ils dérivent
// maintenant de l'ORDRE réel (contrôlé plus bas par une garde).
// ---------------------------------------------------------------------------
const P = {
  formations: [8, 16],       // offres générales + métier + secteur
  generales: [8, 11],
  metier: [12, 14],
  secteur: [15, 16],
  moteur: [41, 44],          // « le moteur Axion-IA » + ce que nous automatisons
  seminaire: 17,
  tarifsFormations: 18,
  coaching: [19, 22],
  audit: [23, 28],
  implementation: [29, 35],
  services: 6,               // « Quatre façons de travailler ensemble »
  tarifsToutes: 36,
  financement: 37,
  temoignages: [39, 40],
  visibilite: 48,
};
const pp = (r) => (Array.isArray(r) ? `p. ${r[0]} à ${r[1]}` : `p. ${r}`);

// slug -> { viewBox, paths }, rempli au démarrage (génération + relecture)
const qrCache = {};
function qr(slug, taille) {
  const q = qrCache[slug];
  if (!q) throw new Error(`[build-conseil] QR « ${slug} » non généré`);
  return (
    `<svg role="img" aria-label="QR ${slug}" style="width:${taille};height:${taille};display:block" ` +
    `xmlns="http://www.w3.org/2000/svg" viewBox="${q.viewBox}" shape-rendering="crispEdges">${q.paths}</svg>`
  );
}
/** QR encadré blanc + légende, tel qu'utilisé dans les blocs mocha. */
function qrBoite(slug, taille, legende) {
  return (
    `<div style="flex:none;text-align:center">` +
    `<div class="card" style="padding:5px;background:#fff">${qr(slug, taille)}</div>` +
    (legende
      ? `<div style="font-size:7.5pt;color:var(--ink-muted);margin-top:1.4mm;font-weight:700;line-height:1.25">${legende}</div>`
      : "") +
    `</div>`
  );
}

// ---------------------------------------------------------------------------
// TÉMOIGNAGES — six emplacements NUMÉROTÉS, sans aucun texte.
//
// Décision Will 2026-08-17 : le papier ne porte que « Témoignage 1 … 6 » et
// un QR chacun. Ni citation, ni nom, ni ville, ni mention du type de
// prestation (formation / audit / coaching / implémentation).
//
// Ce n'est pas un appauvrissement, c'est le bon usage du QR dynamique : le
// contenu vit en ligne et se change quand on veut, sans réimprimer. Un
// témoignage imprimé, lui, est figé pour la durée du tirage — et un
// témoignage nominatif figé ne se corrige pas.
//
// Effet de bord utile : plus aucune allégation n'est imprimée. La question
// des avis non retrouvés en production ne se pose plus pour le catalogue —
// elle reste entière côté site, où le contenu, lui, est publié.
//
// ⚠️ Les six slugs pointent aujourd'hui sur /fr/avis. Chacun doit être
// repointé, en console, vers le témoignage qu'il doit ouvrir.
// ---------------------------------------------------------------------------
const NB_TEMOIGNAGES = 6;

const emplacements = () =>
  Array.from({ length: NB_TEMOIGNAGES }, (_, i) => ({
    numero: i + 1,
    slug: `cat-avis-${i + 1}`,
  }));

// ---------------------------------------------------------------------------
// Briques de page
// ---------------------------------------------------------------------------
const esc = (s) => String(s).replace(/&(?![a-z]+;|#)/g, "&amp;");
const LOGO = `<img src="assets/axion-ia-logo.png" alt="Axion-IA">`;

function runhead(section) {
  return `<div class="runhead">${LOGO}<span class="sec">${esc(section)}</span></div>`;
}
function footer(gauche, lien) {
  return `<div class="footer"><div class="l">${esc(gauche)} <b>→</b> ${esc(lien)}</div><div class="r">00 / 00</div></div>`;
}
/** Enveloppe une page. Le marqueur GEN:conseil rend le script idempotent. */
function page(contenu, opts = {}) {
  const style = opts.flex === false ? "" : ` style="display:flex;flex-direction:column"`;
  return (
    `\n<!-- GEN:conseil -->\n<section class="page"${style}>\n${contenu}\n` +
    `  <div class="trim screen-only"></div>\n</section>\n`
  );
}

// Familles : identité par la barre de titre, le surtitre et la 1re pastille.
// Les couleurs des trois cartes restent celles des fiches formations —
// consigne Will : « comme tu l'avais déjà fait pour les formations ».
const FAMILLES = {
  coaching: { badge: "Accompagnement 1-to-1", barre: "var(--ochre)", pastille: "background:#f6e8d2;color:#7a4a0c", section: "Accompagnement 1-to-1", pied: "Réservez votre accompagnement", lien: "axion-ia.com/un-a-un" },
  audit: { badge: "Audit IA", barre: "var(--blue)", pastille: "background:var(--blue-soft);color:var(--blue-deep)", section: "Audit IA", pied: "Demandez votre audit IA", lien: "axion-ia.com/audit" },
  implementation: { badge: "Implémentation & automatisation", barre: "var(--sage)", pastille: "background:#e5eadf;color:#3f4a37", section: "Implémentation & automatisation", pied: "Parlons de votre projet", lien: "axion-ia.com/implementation" },
};

/**
 * Fiche prestation pleine page — décalque exact de la fiche formation
 * (fhead + carte organisme + deux colonnes + bandeau de gain).
 */
function fichePrestation(o, famille, numero, slugQr) {
  const f = FAMILLES[famille];
  const listeExtra =
    famille === "coaching"
      ? { titre: "Ce qui reste après", items: o.livrables }
      : famille === "implementation"
        ? { titre: "Nos engagements", items: o.garanties }
        : null;

  const droiteHaut =
    famille === "coaching"
      ? `<div class="fsub o">Confidentialité</div><div class="ftxt">${esc(o.confidentialite)}</div>`
      : famille === "implementation"
        // ⚠️ NE PAS remettre `garanties` ici : elles sont déjà rendues plus bas,
        // dans « Ce que vous obtenez ». Le bloc était imprimé deux fois sur la
        // même page, sur les cinq fiches d'implémentation.
        ? `<div class="fsub o">Comment on travaille</div><ul class="fl">` +
          `<li>Sprints courts et démos régulières — pas d'effet tunnel</li>` +
          `<li>On se branche sur vos outils existants, on ne remplace pas tout</li>` +
          `<li>Vos équipes sont formées pour reprendre la main</li></ul>`
        : `<div class="fsub o">Notre approche</div><ul class="fl">` +
          `<li>On comprend d'abord comment vous travaillez vraiment — avant de parler d'outils</li>` +
          `<li>Entretiens dirigeants et collaborateurs, sur le terrain</li>` +
          `<li>Chaque recommandation chiffrée : coût, gain attendu, conditions de réussite</li></ul>`;

  return page(
    `  <div class="fhead">
    <div class="ftitle">
      <div class="fbar" style="background:${f.barre}"></div>
      <div>
        <div class="fnum" style="color:${f.barre}">${esc(f.badge)} · nº ${numero}</div>
        <h1 class="display" style="font-size:31pt;margin-top:2mm;color:var(--ink)">${esc(o.title)}</h1>
        <div class="fchipline">
          <span class="fchip" style="${f.pastille}">${esc(f.badge)}</span>
          <span class="fchip" style="background:var(--sand);color:var(--ink)">⏱ ${esc(o.duration)}</span>
          <span class="fchip" style="background:var(--mocha);color:#fff">${esc(o.participants)}</span>
          <span class="fchip" style="background:${f.barre};color:#fff">${esc(o.price)}</span>
        </div>
      </div>
    </div>
    <div class="forg">
      <div class="lbl">${esc(famille === "audit" ? "Conseil — hors action de formation" : famille === "coaching" ? "Conseil — hors action de formation" : "Conception & déploiement")}</div>
      ${LOGO.replace("<img", '<img style="height:13mm;margin-top:2mm"')}
      <div style="margin-top:2.5mm;display:flex;justify-content:flex-end">${qrBoite(slugQr, "19mm", "Le programme<br>complet en ligne")}</div>
    </div>
  </div>

  <div class="fsec" style="margin-top:6mm">
    <div class="fsec-hd" style="background:${f.barre}">La prestation — Axion-IA</div>
    <div class="ftwo">
      <div><div class="fsub o">En une phrase</div>
        <div class="ftxt">${esc(o.hook)}</div>
        <div class="ftxt" style="margin-top:2mm;color:var(--ink-muted)"><b>${esc(o.surtitre)}</b></div></div>
      <div>${droiteHaut}</div>
    </div>
  </div>

  <div class="ftwo" style="margin-top:5mm;align-items:stretch;flex:1">
    <div class="fsec">
      <div class="fsec-hd" style="background:var(--blue)">Le déroulé</div>
      <ul class="fl blue">${o.deroule.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
    </div>
    <div class="fsec">
      <div class="fsec-hd" style="background:var(--gold,#b06a12)">Ce que vous obtenez</div>
      <div class="fblk"${listeExtra ? "" : ' style="margin-bottom:0"'}><ul class="fl">${o.acquis.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>
      ${listeExtra ? `<div class="fblk" style="margin-bottom:0"><div class="fsub g">${esc(listeExtra.titre)}</div><ul class="fl">${listeExtra.items.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
    </div>
  </div>

  <div class="gainband" style="margin-top:auto">
    <div class="hd">⚡ Le changement concret <span class="tag">avant · après</span></div>
    <div class="body">
      <div><div class="who" style="color:var(--terra-bright)">◻ Aujourd'hui</div>
        <div class="gtxt">${esc(o.avant_line)}</div></div>
      <div><div class="who" style="color:#ffc93c">◼ Après l'intervention</div>
        <div class="gtxt">${esc(o.apres_line)}</div></div>
    </div>
  </div>

${footer(f.pied, f.lien)}`,
  );
}

// ---------------------------------------------------------------------------
// Page 3 — le catalogue en ligne (QR), sur le modèle de la p.3 du livre KDP
// ---------------------------------------------------------------------------
function pageQrCatalogue() {
  return page(
    `${runhead("Le catalogue en ligne")}

  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
    <div class="eyebrow">Le catalogue, toujours à jour</div>
    <h2 class="display" style="font-size:33pt;margin:4mm 0 0;max-width:160mm">Découvrez ce catalogue
      <span class="display-it" style="color:var(--terra)">depuis votre mobile ou votre ordinateur.</span></h2>
    <p style="font-size:11.5pt;color:var(--ink-soft);max-width:132mm;margin:5mm auto 0;line-height:1.55">
      Toutes les offres, en couleur, avec les programmes détaillés, les dates et les conditions
      <b>toujours à jour</b>. Vous pouvez aussi le transmettre à qui de droit d'un simple lien.</p>

    <div class="card" style="margin-top:8mm;padding:6mm;background:#fff">${qr("cat-catalogue", "56mm")}</div>
    <div style="font-family:'Fraunces',serif;font-style:italic;font-weight:600;font-size:19pt;color:var(--ink);margin-top:5mm">axion-ia.com/catalogue</div>
    <p style="font-size:10pt;color:var(--ink-muted);max-width:120mm;margin:2.5mm auto 0;line-height:1.5">
      Scannez le code avec l'appareil photo de votre téléphone, ou saisissez l'adresse dans votre navigateur.</p>

    <div style="margin-top:9mm;background:var(--sand);border-radius:14px;padding:4.5mm 7mm;max-width:158mm">
      <span class="eyebrow" style="color:var(--terra-deep)">Bon à savoir</span>
      <span style="font-size:10.5pt;color:var(--ink-soft)"> &nbsp;Chaque QR de ce catalogue reste pilotable après impression : si une page change d'adresse, la destination est corrigée en ligne — le code imprimé continue de fonctionner.</span>
    </div>
  </div>

${footer("Le catalogue complet en ligne", "axion-ia.com/catalogue")}`,
  );
}

// ---------------------------------------------------------------------------
// Page 19 — les 5 façons de travailler ensemble (remplace « Trois façons »)
// ---------------------------------------------------------------------------
function pageServices5() {
  // Une tuile par famille. Le bandeau de couleur reprend celui de la bande de
  // tranche : le lecteur associe une couleur à une famille dès cette page, et
  // la retrouve ensuite sur la tranche de chaque section.
  const tuile = (o) => `<div class="card" style="padding:0;overflow:hidden;display:flex;flex-direction:column">
      <div style="background:${o.c};color:#fff;padding:2.6mm 4.5mm;${o.grand ? "display:flex;align-items:center;justify-content:space-between;gap:3mm" : ""}">
        <div style="font-family:'Fraunces',serif;font-weight:600;font-size:${o.grand ? "15pt" : "12.5pt"};line-height:1.12">${o.ic} ${o.nom}</div>
        <div class="mono" style="font-weight:700;font-size:${o.grand ? "11pt" : "9pt"};white-space:nowrap;opacity:.95${o.grand ? "" : ";margin-top:.9mm"}">${o.prix}</div>
      </div>
      <div style="padding:3.4mm 4.5mm;display:flex;flex-direction:column;flex:1">
        <div style="font-size:${o.grand ? "10.5pt" : "9.6pt"};line-height:1.45;color:var(--ink-soft)">${o.txt}</div>
        <div style="margin-top:auto;padding-top:2.6mm;display:flex;align-items:baseline;justify-content:space-between;gap:3mm">
          <span style="font-size:8.4pt;color:var(--ink-muted);line-height:1.3">${o.detail}</span>
          <span class="mono" style="flex:none;font-weight:700;font-size:9pt;color:${o.c}">${o.pg} →</span>
        </div>
      </div>
    </div>`;

  return page(
    `${runhead("Nos offres")}

  <div style="text-align:center;margin-top:1mm">
    <div class="eyebrow">De l'idée à l'impact — un seul partenaire</div>
    <h2 class="display" style="font-size:36pt;margin:3.5mm 0 0;line-height:1.02">Quatre façons de
      <span class="display-it" style="color:var(--terra)">travailler ensemble.</span></h2>
    <p style="font-size:11.5pt;color:var(--ink-soft);margin:4mm auto 0;max-width:156mm;line-height:1.5">
      Former vos équipes, accompagner une personne, auditer vos process, construire vos automatisations. <b>Vous n'avez pas à choisir tout de suite</b> — on cadre ensemble.</p>
  </div>

  <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:4.5mm;margin-top:6mm">
    ${tuile({ ic: "🎓", nom: "Formations IA", prix: "Dès 1 200 € HT", c: "var(--terra)",
      txt: "<b>21 formations</b> en intra-entreprise, présentiel ou distanciel — et le <b>séminaire IA</b>, une journée pour mettre jusqu'à 50 personnes au diapason. Sur vos vraies tâches.",
      // La plage va jusqu'au SÉMINAIRE, pas jusqu'à la dernière formation : la
      // tuile annonce « 1 séminaire », elle doit donc couvrir sa page. Avec
      // `P.formations` seul, elle s'arrêtait en 16 et le séminaire, en 17,
      // tombait hors de la plage qui prétendait le contenir.
      detail: "4 générales · 9 par métier · 8 par secteur · 1 séminaire", pg: pp([P.formations[0], P.seminaire]) })}
    ${tuile({ ic: "🤝", nom: "Accompagnement 1-to-1", prix: "Dès 990 € HT", c: "var(--ochre)",
      txt: "Une personne, un expert, une journée sur <b>ses propres dossiers</b> — ou 790 € / session en contrat régulier.",
      detail: "Dirigeant · collaborateur · suivi régulier", pg: pp(P.coaching) })}
    ${tuile({ ic: "🔍", nom: "Audit IA", prix: "Dès 1 190 € HT", c: "var(--blue)",
      txt: "On cartographie vos usages, on <b>chiffre chaque opportunité</b> et on livre une feuille de route priorisée.",
      detail: "4 niveaux, de la TPE à l'ETI", pg: pp(P.audit) })}
    ${tuile({ ic: "🚀", nom: "Implémentation", prix: "Dès 990 € HT", c: "var(--sage)",
      txt: "Le clé en main : on conçoit, on développe, on met en production. <b>Code et documentation livrés.</b>",
      detail: "Processus · chatbots · agents · données", pg: pp(P.implementation) })}
  </div>

  <div style="margin-top:5mm;background:var(--mocha);border-radius:16px;padding:4.5mm 8mm;color:#fff;display:flex;align-items:center;gap:8mm">
    <div style="flex:1">
      <div style="font-family:'Fraunces',serif;font-size:18pt;font-weight:600;color:#fff;line-height:1.15">Vous ne savez pas par où commencer ?
        <span class="display-it" style="color:var(--terra-bright)">On vous le dira franchement.</span></div>
      <p style="font-size:10pt;color:var(--sand);line-height:1.5;margin:2.5mm 0 0">Parfois la bonne réponse est une demi-journée de formation. Parfois un audit. Parfois attendre. <b style="color:#fff">30 minutes suffisent pour le savoir.</b></p>
    </div>
    ${qrBoite("cat-catalogue", "23mm", "")}
  </div>

${footer("Réservez votre appel de cadrage", "axion-ia.com/appel")}`,
  );
}

// ---------------------------------------------------------------------------
// Ouvreurs de section
// ---------------------------------------------------------------------------
const OUVREURS = {
  coaching: {
    slug: "cat-coaching",
    eyebrow: "Accompagnement 1-to-1",
    titre: "Une personne,",
    titreIt: "une journée, ses vrais dossiers.",
    chapo:
      "Le 1-to-1 ne ressemble à aucune formation collective : rien n'est standardisé, tout part de votre poste, de vos outils et de vos dossiers en cours. Une préparation en amont, une journée en tête-à-tête, un livrable écrit sous 7 jours.",
    cartes: [
      ["🎯", "Préparation en amont", "On étudie votre poste, vos outils et vos tâches récurrentes avant la date retenue. La journée arrive déjà calibrée sur votre métier."],
      ["📞", "Échange préalable de 30 min", "Un point court pour caler ce qu'on vise et les dossiers réels sur lesquels on travaillera le jour J."],
      ["🤝", "Journée en tête-à-tête, 7 à 8 h", "Sur site, à distance ou en hybride, selon votre préférence. On travaille sur vos vrais dossiers ; rien n'est conservé."],
      ["📄", "Livrable écrit sous 7 jours", "Note de cadrage pour un dirigeant, cahier de prompts et plan d'action pour un collaborateur. Nominatif, réutilisable sans nous."],
    ],
    encart: "⚠️ Une prestation de conseil, pas une action de formation — donc pas d'objectifs pédagogiques, pas d'évaluation, et pas de financement OPCO. Voir PAGE_FIN.",
  },
  audit: {
    slug: "cat-audit",
    eyebrow: "Avant d'investir, savoir",
    titre: "On regarde comment vous",
    titreIt: "travaillez vraiment.",
    chapo:
      "Avant de parler d'outils, de Claude ou de ChatGPT, on comprend comment votre entreprise fonctionne. Un travail de terrain mené avec vos dirigeants et vos équipes — puis des recommandations chiffrées, et une feuille de route que vous exécutez avec nous, seul, ou pas du tout.",
    cartes: [
      ["🧭", "Quatre niveaux", "De la journée sur place en TPE à l'audit transverse d'une ETI avec gouvernance IA. Le périmètre décide, pas la taille affichée."],
      ["📊", "Chaque piste chiffrée", "Coût, gain attendu, complexité, délai. Les options trop lourdes ou hors-sujet sont écartées explicitement."],
      ["🗺", "Une feuille de route", "Par quoi commencer, quand, avec quelles ressources — des gains rapides aux chantiers de fond."],
      ["🔓", "Sans obligation de suite", "Le rapport est à vous. Vous implémentez avec nous, en interne, ou avec un tiers. C'est écrit dans nos conditions."],
    ],
    encart: "⚠️ Prestation de conseil, hors action de formation : non finançable par un OPCO. Voir PAGE_FIN.",
  },
  implementation: {
    slug: "cat-implementation",
    eyebrow: "Le clé en main",
    titre: "On ne s'arrête pas",
    titreIt: "au PDF : on construit.",
    chapo:
      "L'audit dit quoi faire. L'implémentation le fait. Nous concevons, développons et mettons en production vos automatisations et vos agents IA — puis nous vous remettons le code, la documentation et les accès. Vous restez autonome.",
    cartes: [
      ["⚙️", "Sprints courts, démos régulières", "Pas d'effet tunnel : vous voyez la solution prendre forme, et vous validez à chaque étape."],
      ["🔌", "Branché sur votre existant", "CRM, ERP, comptabilité, e-mail, agenda. On se connecte, on ne remplace pas tout."],
      ["📦", "Code et doc livrés", "Dans vos comptes, documentés, modifiables par vos équipes. Aucun abonnement imposé."],
      ["🛟", "30 jours de support inclus", "Pour les ajustements après mise en production. Un contrat de maintenance existe, il est optionnel."],
    ],
    encart: "⚠️ Prestation de conception et de développement, hors action de formation : non finançable par un OPCO. Voir PAGE_FIN.",
  },
};

function pageOuvreur(famille) {
  const f = FAMILLES[famille];
  const o = OUVREURS[famille];
  return page(
    `${runhead(f.section)}

  <div style="text-align:center;margin-top:2mm">
    <div class="eyebrow" style="color:${f.barre}">${esc(o.eyebrow)}</div>
    <h2 class="display" style="font-size:34pt;margin:4mm 0 0">${esc(o.titre)}
      <span class="display-it" style="color:${f.barre}">${esc(o.titreIt)}</span></h2>
    <p style="font-size:11.5pt;color:var(--ink-soft);max-width:164mm;margin:5mm auto 0;line-height:1.58">${esc(o.chapo)}</p>
    <div class="rule" style="margin:5mm auto 0;background:${f.barre}"></div>
  </div>

  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:6mm;margin-top:4mm">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm">
      ${o.cartes
        .map(
          ([ic, t, d]) => `<div class="card" style="padding:5mm 5.5mm">
        <div style="display:flex;align-items:center;gap:3mm;margin-bottom:2mm">
          <span style="font-size:16pt;line-height:1">${ic}</span>
          <span style="font-weight:800;font-size:11.5pt;line-height:1.1">${esc(t)}</span></div>
        <div style="font-size:9.8pt;line-height:1.45;color:var(--ink-soft)">${esc(d)}</div></div>`,
        )
        .join("")}
    </div>

    <div style="background:var(--sand);border-radius:13px;padding:4mm 6mm;font-size:10pt;color:var(--ink-soft);line-height:1.5">${esc(o.encart.replace("PAGE_FIN", pp(P.financement)))}</div>

    <div style="background:var(--mocha);border-radius:16px;padding:5.5mm 8mm;color:#fff;display:flex;align-items:center;gap:8mm">
      <div style="flex:1">
        <div style="font-family:'Fraunces',serif;font-size:17pt;font-weight:600;color:#fff;line-height:1.15">Les fiches détaillées, pages suivantes.</div>
        <p style="font-size:10pt;color:var(--sand);line-height:1.5;margin:2.5mm 0 0">Durées, déroulé, livrables et tarifs pour chaque formule. Le détail complet et les conditions à jour sont en ligne.</p>
      </div>
      ${qrBoite(o.slug, "24mm", "")}
    </div>
  </div>

${footer(f.pied, f.lien)}`,
  );
}

// ---------------------------------------------------------------------------
// Méthodes (audit en 8 étapes · implémentation en 4 temps)
// ---------------------------------------------------------------------------
const ETAPES_AUDIT = [
  ["01", "On cadre la mission avec vous", "Premier temps fort avec vos dirigeants : votre activité, votre organisation, vos contraintes — puis ce que l'audit doit vous apporter. Le tout sous NDA.", "Périmètre & objectifs validés"],
  ["02", "On va sur le terrain", "On rencontre les directions et les collaborateurs qui font tourner l'entreprise. On regarde comment ça se passe vraiment : gestes métier, irritants, outils réellement utilisés.", "Cartographie des usages & frictions"],
  ["03", "On consolide et on analyse", "Panorama des technologies du moment, comparaison avec ce qui marche ailleurs, étude de situations proches de la vôtre.", "Pistes IA qualifiées"],
  ["04", "On filtre les options", "Chaque piste passe le test du réel : exigences, limites, risques. On écarte sans détour ce qui est trop lourd, trop cher ou hors-sujet.", "Short-list priorisée"],
  ["05", "On évalue et on chiffre", "Faisabilité technique, performance attendue, coûts, valeur par service. Recommandations comparables et argumentées, avec un ordre de grandeur de retour.", "Recommandations chiffrées"],
  ["06", "On restitue et on trace la route", "Rapport structuré, cartographie des opportunités service par service, puis une feuille de route limpide : par quoi commencer, quand, avec quelles ressources.", "Rapport + cartographie + roadmap"],
  ["07", "On met en œuvre, par étapes", "Si vous le voulez : la même équipe construit. Déploiement par paliers, dans l'ordre des priorités, en s'intégrant à vos outils — sans tout casser.", "Solutions intégrées, par priorité"],
  ["08", "On ancre dans la durée", "Une techno adoptée vaut mieux qu'une techno déployée : formation des équipes, gouvernance, trajectoire à 3 ans — rôles, principes, indicateurs.", "Adoption, indicateurs & trajectoire"],
];

function pageMethodeAudit() {
  const f = FAMILLES.audit;
  return page(
    `${runhead("Audit IA · notre méthode")}

  <div style="text-align:center">
    <div class="eyebrow" style="color:var(--blue)">Notre méthodologie</div>
    <h2 class="display" style="font-size:30pt;margin:3mm 0 0">Un audit IA
      <span class="display-it" style="color:var(--blue)">rigoureux, en 8 étapes</span></h2>
    <p style="font-size:10.5pt;color:var(--ink-soft);max-width:160mm;margin:3mm auto 0;line-height:1.5">
      Chaque étape produit un livrable. Vous savez à tout moment où en est la mission et ce qui vous a été remis.</p>
  </div>

  <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:4mm 6mm;align-content:center;margin-top:5mm">
    ${ETAPES_AUDIT.map(
      ([n, t, d, liv]) => `<div style="display:flex;gap:4mm;align-items:flex-start">
      <div style="flex:none;width:11mm;height:11mm;border-radius:50%;background:var(--blue);color:#fff;font-family:'Fraunces',serif;font-weight:600;font-size:12.5pt;display:flex;align-items:center;justify-content:center">${n}</div>
      <div style="flex:1">
        <div style="font-weight:800;font-size:11pt;line-height:1.15;margin-bottom:1.2mm">${esc(t)}</div>
        <div style="font-size:9.2pt;line-height:1.42;color:var(--ink-soft)">${esc(d)}</div>
        <div style="margin-top:1.6mm;display:inline-block;font-size:8.2pt;font-weight:800;color:var(--blue-deep);background:var(--blue-soft);border-radius:7px;padding:1.4mm 2.6mm;line-height:1.25">📄 ${esc(liv)}</div>
      </div></div>`,
    ).join("")}
  </div>

  <div style="margin-top:4mm;background:var(--sand);border-radius:13px;padding:4mm 6mm;font-size:10pt;color:var(--ink-soft);line-height:1.5">
    <b>Les étapes 07 et 08 sont optionnelles.</b> L'audit se termine à l'étape 06 : le rapport et la feuille de route vous appartiennent, que vous nous confiiez la suite ou non.</div>

${footer(f.pied, f.lien)}`,
  );
}

const ETAPES_IMPL = [
  ["Cadrage & conception", "On part de votre besoin réel : ateliers métier, choix de l'architecture, backlog priorisé et spécifications claires. Vous savez exactement ce qu'on va construire, et pourquoi."],
  ["Développement itératif", "On construit par sprints courts, avec des démos régulières et une validation métier à chaque étape. Pas d'effet tunnel : vous voyez la solution prendre forme."],
  ["Recette & mise en production", "Tests, corrections, puis passage en production sur vos outils. Le code et la documentation vous sont livrés, et vos équipes sont formées pour être autonomes."],
  ["Suivi & évolution", "Un support de 30 jours inclus à la livraison pour les ajustements. Ensuite, vous faites évoluer à la demande — sans abonnement ni maintenance imposée."],
];

function pageMethodeImplementation() {
  const f = FAMILLES.implementation;
  return page(
    `${runhead("Implémentation · notre méthode")}

  <div style="text-align:center">
    <div class="eyebrow" style="color:var(--sage)">Notre méthodologie</div>
    <h2 class="display" style="font-size:31pt;margin:3mm 0 0">De l'idée à la prod,
      <span class="display-it" style="color:var(--sage)">sans mauvaise surprise</span></h2>
    <p style="font-size:11pt;color:var(--ink-soft);max-width:158mm;margin:3.5mm auto 0;line-height:1.55">
      Avant de coder, on comprend comment vous travaillez vraiment. Un travail méthodique, par étapes, avec des points de validation réguliers — du premier cadrage jusqu'à la mise en production et au-delà.</p>
    <div class="rule" style="margin:4mm auto 0;background:var(--sage)"></div>
  </div>

  <div class="steps" style="margin-top:7mm">
    ${ETAPES_IMPL.map(
      ([t, d], i) => `<div class="step">
      <div class="n" style="background:var(--sage)">${i + 1}</div>
      <div><h4>${esc(t)}</h4><p>${esc(d)}</p></div></div>`,
    ).join("")}
  </div>

  <div style="margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:5mm">
    <div class="card" style="padding:5mm 6mm">
      <div class="eyebrow" style="color:var(--sage)">Ce qui vous est remis</div>
      <ul class="fl" style="margin-top:2.5mm">
        <li>Le code source, dans vos comptes</li>
        <li>La documentation d'exploitation et de reprise</li>
        <li>Les accès, les clés et les coûts d'API à votre nom</li>
        <li>Une passation avec vos équipes</li></ul>
    </div>
    <div class="card" style="padding:5mm 6mm">
      <div class="eyebrow" style="color:var(--sage)">Après la livraison</div>
      <ul class="fl" style="margin-top:2.5mm">
        <li><b>30 jours de support inclus</b> pour les ajustements</li>
        <li>Contrat de maintenance <b>optionnel</b> — 290 € HT / mois, forfait 4 h</li>
        <li>Aucun abonnement imposé, aucune dépendance à nous</li></ul>
    </div>
  </div>

  <div style="margin-top:5mm;background:var(--sand);border-radius:13px;padding:4mm 6mm;font-size:10pt;color:var(--ink-soft);line-height:1.5">
    Chaque projet est unique : le déroulé s'adapte à votre besoin, vos outils et vos contraintes — d'une automatisation simple à un système d'agents connectés. <b>Forfait fixe, devis ferme.</b></div>

${footer(f.pied, f.lien)}`,
  );
}

// ---------------------------------------------------------------------------
// Tarifs — récapitulatif toutes offres
// ---------------------------------------------------------------------------
function pageTarifsRecap() {
  // Quatre cartes plutôt que quatre tableaux empilés. Les tableaux rayés,
  // leurs notes en petit et leurs prix en orange donnaient une page très
  // chargée pour une information qu'on vient chercher précisément.
  const carte = (titre, couleur, lignes, note) =>
    `<div class="card" style="padding:0;overflow:hidden;display:flex;flex-direction:column">
      <div style="background:${couleur};color:#fff;padding:2.4mm 4.5mm;font-family:'Fraunces',serif;font-weight:600;font-size:13pt">${esc(titre)}</div>
      <div style="padding:2.6mm 4.5mm 3mm;flex:1;display:flex;flex-direction:column">
        ${lignes
          .map(
            ([a, b, c], i) => `<div style="display:flex;align-items:baseline;gap:3mm;padding:1.7mm 0${i ? ";border-top:1px solid #eee3cd" : ""}">
            <div style="flex:1">
              <div style="font-weight:800;font-size:9.4pt;line-height:1.25;color:var(--ink)">${esc(a)}</div>
              ${b ? `<div style="font-size:8.2pt;color:var(--ink-muted);margin-top:.4mm">${esc(b)}</div>` : ""}
            </div>
            <div class="mono" style="flex:none;font-weight:700;font-size:10.5pt;color:${couleur};white-space:nowrap">${esc(c)}</div>
          </div>`,
          )
          .join("")}
        ${note ? `<div style="margin-top:auto;padding-top:2.4mm;font-size:8.2pt;color:var(--ink-muted);line-height:1.35">${note}</div>` : ""}
      </div>
    </div>`;

  return page(
    `${runhead("Tarifs · toutes les offres")}

  <div style="text-align:center">
    <h2 class="display" style="font-size:30pt;margin:0">Tous nos tarifs,
      <span class="display-it" style="color:var(--terra)">en une page.</span></h2>
    <p style="font-size:10.8pt;color:var(--ink-soft);margin:3mm auto 0;max-width:154mm;line-height:1.5">
      Prix publics <b>hors taxes</b>. Les formations se facturent <b>par groupe</b>, pas par personne.</p>
  </div>

  <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:4.5mm;margin-top:5mm">
    ${carte("Formations & séminaire", "var(--terra)", [
      ["Offres générales — 4 h (½ journée)", "2 à 15 personnes", "1 200 €"],
      ["Offres générales — 1 jour / 2 jours", "2 à 15 personnes", "1 900 € / 3 600 €"],
      ["Par métier — 1 jour / 2 jours", "2 à 15 personnes", "1 900 € / 3 600 €"],
      ["Par secteur — 1 jour / 2 jours", "2 à 15 personnes", "2 200 € / 3 900 €"],
      ["Séminaire IA — 1 journée", "jusqu'à 50 personnes", "Sur devis"],
    ], `<b>Finançable OPCO / France Travail</b>, jusqu'à 100 %. Montage du dossier inclus — voir ${pp(P.financement)}.`)}

    ${carte("Accompagnement 1-to-1", "var(--ochre)", [
      ["Dirigeant · Vision IA stratégique", "1 jour / 2 jours", "1 390 € / 2 590 €"],
      ["Collaborateur · Optimisation du poste", "1 jour / 2 jours", "990 € / 1 830 €"],
      ["Coaching régulier", "1 session par mois", "790 € / session"],
    ], "Prestation de <b>conseil</b> — non finançable OPCO. Contrat de 6, 12 ou 24 mois pour le coaching régulier.")}

    ${carte("Audit IA", "var(--blue)", [
      ["Audit sur place — 1 journée", "TPE · toute l'entreprise", "Dès 1 190 €"],
      ["Audit Ciblé — Solo / Standard / Avancé", "1 département", "1 900 → 3 900 €"],
      ["Audit Stratégique PME", "20-50 / 50-250 salariés", "4 900 € / 9 900 €"],
      ["Audit Stratégique ETI", "1-2 BU · multi-BU sur devis", "Dès 1 900 €"],
    ], "Prestation de <b>conseil</b> — non finançable OPCO. Chiffrage au cas par cas selon le périmètre réel.")}

    ${carte("Implémentation & automatisation", "var(--sage)", [
      ["Pilote IA — un cas d'usage prioritaire", "TPE / PME", "Dès 990 €"],
      ["Mission PME / ETI / Grand programme", "multi-cas, transverse", "Sur devis"],
      ["IA custom d'entreprise", "4 à 16 semaines", "Sur devis"],
      ["Maintenance (optionnelle)", "après les 30 jours inclus", "290 € / mois"],
    ], "Conception et développement — non finançable OPCO. <b>Forfait fixe, devis ferme.</b>")}
  </div>

  <div style="margin-top:4.5mm;display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm">
    <div style="background:var(--sand);border-radius:11px;padding:3mm 4.2mm">
      <div class="eyebrow" style="font-size:7.6pt;color:var(--terra-deep)">Compris</div>
      <div style="font-size:8.6pt;color:var(--ink-soft);line-height:1.4;margin-top:1.2mm">Préparation, animation, supports et livrables. Pour les formations : convention, convocations, émargements, attestations.</div>
    </div>
    <div style="background:var(--sand);border-radius:11px;padding:3mm 4.2mm">
      <div class="eyebrow" style="font-size:7.6pt;color:var(--terra-deep)">En sus</div>
      <div style="font-size:8.6pt;color:var(--ink-soft);line-height:1.4;margin-top:1.2mm">Frais de déplacement, d'hébergement et de repas, au réel et sur justificatifs, pour les interventions sur site.</div>
    </div>
    <div style="background:var(--sand);border-radius:11px;padding:3mm 4.2mm">
      <div class="eyebrow" style="font-size:7.6pt;color:var(--terra-deep)">TVA</div>
      <div style="font-size:8.6pt;color:var(--ink-soft);line-height:1.4;margin-top:1.2mm">Tous les prix sont hors taxes. <b>La TVA au taux en vigueur s'applique à toutes nos prestations</b>, formations comprises.</div>
    </div>
  </div>

${footer("Un devis chiffré sous 48 h", "axion-ia.com/appel")}`,
  );
}

// ---------------------------------------------------------------------------
// Témoignages — un QR par témoignage
// ---------------------------------------------------------------------------
function pageTemoignages(slots, num, total) {
  return page(
    `${runhead("Témoignages clients")}

  <div style="text-align:center">
    <div class="eyebrow">Témoignages ${num} / ${total}</div>
    <h2 class="display" style="font-size:31pt;margin:3mm 0 0">Ce qu'ils en disent,
      <span class="display-it" style="color:var(--terra)">de leur propre voix.</span></h2>
    <p style="font-size:10.5pt;color:var(--ink-soft);max-width:150mm;margin:3mm auto 0;line-height:1.5">
      Scannez un code pour découvrir le retour d'un client. Les témoignages sont mis à jour en ligne — ce catalogue reste à jour sans être réimprimé.</p>
    <div class="rule" style="margin:4mm auto 0"></div>
  </div>

  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:6mm;margin-top:4mm">
    ${slots
      .map(
        (t) => `<div class="card" style="padding:6mm 8mm;display:flex;align-items:center;gap:8mm">
      <div style="flex:none;width:14mm;height:14mm;border-radius:50%;background:var(--terra);color:#fff;font-family:'Fraunces',serif;font-weight:600;font-size:17pt;display:flex;align-items:center;justify-content:center">${t.numero}</div>
      <div style="flex:1;font-family:'Fraunces',serif;font-weight:600;font-size:20pt;color:var(--ink);line-height:1.1">Témoignage ${t.numero}</div>
      <div class="card" style="flex:none;padding:5px;background:#fff">${qr(t.slug, "32mm")}</div>
    </div>`,
      )
      .join("")}
  </div>

${footer("Tous les avis clients", "axion-ia.com/avis")}`,
  );
}

// ---------------------------------------------------------------------------
// Financement — la frontière formation / conseil
// ---------------------------------------------------------------------------
function pageFinancement() {
  return page(
    `${runhead("Financement")}

  <div style="text-align:center">
    <div class="eyebrow">Ce qui est finançable, ce qui ne l'est pas</div>
    <h2 class="display" style="font-size:30pt;margin:3mm 0 0">Une frontière nette,
      <span class="display-it" style="color:var(--terra)">annoncée d'avance.</span></h2>
    <p style="font-size:11pt;color:var(--ink-soft);max-width:160mm;margin:3.5mm auto 0;line-height:1.55">
      Nos formations sont des actions de formation, finançables. Nos accompagnements, audits et implémentations sont des prestations de conseil : ils ne le sont pas. Mieux vaut le savoir avant de bâtir un budget dessus.</p>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:7mm">
    <div class="card" style="padding:6mm 6.5mm;border-top:5px solid var(--terra)">
      <div style="font-family:'Fraunces',serif;font-weight:600;font-size:17pt;color:var(--terra-deep)">✓ Finançable</div>
      <div style="font-size:10pt;color:var(--ink-soft);margin-top:1.5mm;line-height:1.5">Les <b>21 formations</b> et le <b>séminaire IA</b>.</div>
      <ul class="fl" style="margin-top:3mm">
        <li><b>OPCO</b> — jusqu'à 100 % de prise en charge. Vous cotisez déjà.</li>
        <li><b>France Travail</b> — AIF, POEI selon la situation.</li>
        <li>Organisme certifié <b>Qualiopi</b>, catégorie Actions de formation.</li>
        <li><b>Nous montons le dossier</b>, de A à Z.</li></ul>
      <div style="margin-top:3.5mm;background:var(--terra-soft);border-radius:9px;padding:3mm 4mm;font-size:9.2pt;color:var(--terra-deep);line-height:1.4">
        Le montant réellement pris en charge dépend de votre OPCO et de votre situation. <b>Actions non éligibles au CPF.</b></div>
    </div>

    <div class="card" style="padding:6mm 6.5mm;border-top:5px solid var(--mocha)">
      <div style="font-family:'Fraunces',serif;font-weight:600;font-size:17pt;color:var(--mocha)">✗ Non finançable</div>
      <div style="font-size:10pt;color:var(--ink-soft);margin-top:1.5mm;line-height:1.5">L'<b>accompagnement 1-to-1</b>, l'<b>audit IA</b> et l'<b>implémentation</b>.</div>
      <ul class="fl" style="margin-top:3mm">
        <li>Ce sont des prestations de <b>conseil</b>, pas des actions de formation.</li>
        <li>Pas d'objectifs pédagogiques, pas d'évaluation des acquis, pas d'attestation de formation — et donc pas de prise en charge OPCO.</li>
        <li>Facturation directe, TVA applicable.</li>
        <li>Ces prestations sont <b>déductibles en charges d'exploitation</b> comme toute prestation de conseil.</li></ul>
      <div style="margin-top:3.5mm;background:var(--sand);border-radius:9px;padding:3mm 4mm;font-size:9.2pt;color:var(--ink-soft);line-height:1.4">
        Nous ne présenterons jamais un audit ou un coaching comme une formation pour le faire financer. <b>C'est une ligne que nous ne franchissons pas.</b></div>
    </div>
  </div>

  <div style="margin-top:auto;background:var(--mocha);border-radius:16px;padding:5.5mm 8mm;color:#fff">
    <div class="eyebrow" style="color:var(--terra-bright);margin-bottom:2mm">Le montage combiné</div>
    <div style="font-size:10.5pt;color:var(--sand);line-height:1.55">
      Beaucoup d'entreprises font financer la <b style="color:#fff">formation de leurs équipes</b> par l'OPCO, et prennent l'<b style="color:#fff">audit</b> ou l'<b style="color:#fff">accompagnement du dirigeant</b> sur leur budget propre. C'est le montage le plus fréquent, et le plus sain : chaque prestation est appelée par son nom.</div>
  </div>

${footer("Montage du dossier OPCO inclus", "axion-ia.com/appel")}`,
  );
}

// ---------------------------------------------------------------------------
// Conformité
// ---------------------------------------------------------------------------
function pageConformite() {
  const c = (ic, t, d) =>
    `<div class="card" style="padding:5mm 5.5mm">
      <div style="display:flex;align-items:center;gap:3mm;margin-bottom:2mm">
        <span style="font-size:16pt;line-height:1">${ic}</span>
        <span style="font-weight:800;font-size:11.5pt;line-height:1.1">${esc(t)}</span></div>
      <div style="font-size:9.6pt;line-height:1.45;color:var(--ink-soft)">${d}</div></div>`;

  return page(
    `${runhead("Conformité & confidentialité")}

  <div style="text-align:center">
    <div class="eyebrow" style="color:var(--blue)">AI Act · RGPD · secret des affaires</div>
    <h2 class="display" style="font-size:30pt;margin:3mm 0 0">Vos données ne sortent pas,
      <span class="display-it" style="color:var(--blue)">et vos usages sont documentés.</span></h2>
    <p style="font-size:11pt;color:var(--ink-soft);max-width:162mm;margin:3.5mm auto 0;line-height:1.55">
      Depuis le 2 août 2026, l'essentiel des obligations de l'AI Act s'applique à toute entreprise qui utilise l'IA. Se former et se faire auditer, c'est aussi structurer le dossier qui le prouve.</p>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:6mm">
    ${c("⚖️", "AI Act — vous êtes déjà concerné", "Obligation d'information, de maîtrise des risques et de <b>littératie IA</b> de vos équipes. Nos formations et nos audits produisent les preuves correspondantes : programmes, émargements, attestations, cartographie des usages.")}
    ${c("🔐", "Liste rouge & anonymisation", "On définit avec vous ce qui ne doit <b>jamais</b> être soumis à un outil d'IA — et comment anonymiser un document ou une photo avant de s'en servir. C'est un module de chaque formation, pas une annexe.")}
    ${c("🇪🇺", "Hébergement et sous-traitance", "Nous privilégions les traitements en <b>Union européenne</b> et documentons les sous-traitants mobilisés dans chaque projet d'implémentation. Registre et durées de conservation tenus.")}
    ${c("🤐", "Vos dossiers restent les vôtres", "Les 1-to-1 et les audits se font sur vos vrais dossiers, <b>sous NDA</b>. Rien n'est conservé après la mission, rien n'est réutilisé pour un autre client, rien ne sert à entraîner quoi que ce soit.")}
  </div>

  <div style="margin-top:auto;display:grid;grid-template-columns:1.3fr 1fr;gap:6mm;align-items:center">
    <div style="background:var(--blue-soft);border-radius:14px;padding:5mm 6mm">
      <div class="eyebrow" style="color:var(--blue-deep);margin-bottom:2mm">Ce que ça vous évite</div>
      <div style="font-size:10.2pt;color:var(--ink-soft);line-height:1.5">
        Un seul incident — un contrat confidentiel déposé dans un outil public, un dossier client recopié dans un chat — coûte des dizaines de fois le prix d'une demi-journée de formation. <b>La confidentialité n'est pas un chapitre : c'est un réflexe qu'on installe.</b></div>
    </div>
    <div style="text-align:center">
      <img src="assets/qualiopi-logo.png" alt="Certification Qualiopi" style="max-width:100%;max-height:33.5mm;display:block;margin:0 auto">
      <div style="font-size:8.2pt;color:var(--ink-muted);margin-top:2mm;line-height:1.4">La certification qualité a été délivrée au titre de la catégorie <b>ACTIONS DE FORMATION</b>.</div>
    </div>
  </div>

${footer("Parlons de votre conformité", "axion-ia.com/appel")}`,
  );
}

// ---------------------------------------------------------------------------
// Questions fréquentes
// ---------------------------------------------------------------------------
const FAQ = [
  ["Combien de personnes par session ?", "De 2 à 15 participants pour toutes les formations, en intra-entreprise. Au-delà, c'est le séminaire (jusqu'à 50) ou plusieurs sessions."],
  ["Présentiel ou distanciel ?", "Les deux. Le présentiel donne de meilleurs résultats sur les ateliers ; le distanciel évite les frais de déplacement. On en discute au cadrage."],
  ["Faut-il un compte payant sur les outils IA ?", "Non pour découvrir. Pour les formations avancées et l'automatisation, un compte payant sur un outil est utile — on vous dit lesquels valent vraiment leur abonnement, et lesquels non."],
  ["Nos équipes n'y connaissent rien. C'est un problème ?", "Non. La moitié de nos participants n'ont jamais ouvert un outil d'IA. Aucune de nos offres générales n'a de pré-requis."],
  ["Combien de temps pour monter le dossier OPCO ?", "Comptez 3 à 6 semaines entre le premier appel et la session, selon votre OPCO. Nous montons le dossier ; vous signez."],
  ["Et si la formation ne sert à rien chez nous ?", "C'est précisément ce que dit un audit, et il arrive qu'on le dise. Nous préférons vous orienter vers l'offre utile — ou vers aucune — plutôt que vendre une session qui ne changera rien."],
  ["Vous travaillez sur nos vrais dossiers ?", "Oui, c'est le principe. Sous NDA, avec une liste rouge définie ensemble, et rien n'est conservé après la session."],
  ["Peut-on commencer petit ?", "Oui. Une demi-journée à 1 200 € HT pour toute une équipe, ou un pilote d'automatisation dès 990 € HT. La plupart de nos clients commencent comme ça."],
  ["Qui anime ?", "Williams Jullin et les formateurs Axion-IA. Formateur expert des outils IA — ChatGPT, Claude, Gemini, Mistral, Copilot."],
  ["Et après la formation ?", "Le kit reste chez vous : gabarits, bibliothèque de prompts, charte d'usage. Et un point de suivi est prévu sur les accompagnements 1-to-1."],
];

function pageFaq() {
  return page(
    `${runhead("Questions fréquentes")}

  <div style="text-align:center">
    <div class="eyebrow">Ce qu'on nous demande le plus</div>
    <h2 class="display" style="font-size:31pt;margin:3mm 0 0">Les questions
      <span class="display-it" style="color:var(--terra)">qu'on nous pose vraiment.</span></h2>
    <div class="rule" style="margin:4mm auto 0"></div>
  </div>

  <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:4mm 7mm;align-content:center;margin-top:5mm">
    ${FAQ.map(
      ([q, a]) => `<div>
      <div style="font-weight:800;font-size:10.5pt;line-height:1.2;color:var(--ink)">${esc(q)}</div>
      <div style="font-size:9.4pt;line-height:1.45;color:var(--ink-soft);margin-top:1.4mm">${esc(a)}</div></div>`,
    ).join("")}
  </div>

  <div style="margin-top:4mm;background:var(--mocha);border-radius:14px;padding:5mm 7mm;color:#fff;display:flex;align-items:center;gap:7mm">
    <div style="flex:1">
      <div style="font-family:'Fraunces',serif;font-size:16pt;font-weight:600;color:#fff">Une question qui n'est pas là ?</div>
      <div style="font-size:10pt;color:var(--sand);margin-top:1.5mm;line-height:1.5">Posez-la au téléphone, en 30 minutes, sans engagement — ou écrivez-nous à contact@axion-ia.com.</div>
    </div>
    ${qrBoite("cat-catalogue", "22mm", "")}
  </div>

${footer("Réservez un appel découverte", "axion-ia.com/appel")}`,
  );
}

// ---------------------------------------------------------------------------
/// ---------------------------------------------------------------------------
// RENVOIS PÉRIMÉS DES PAGES D'ORIGINE
//
// Les pages reprises telles quelles portent des « voir p. XX » écrits pour le
// catalogue 24 pages. Ils ont survécu au passage à 48 et pointent tous à côté :
// « voir p. 23 » désigne aujourd'hui une fiche d'audit, pas la page visibilité.
// Un renvoi faux ne se voit qu'une fois le catalogue chez le client.
//
// Ces reprises sont faites sur la SORTIE ; `pages-source.html` reste intact.
// ---------------------------------------------------------------------------
const RENVOIS_PERIMES = [
  { page: 5, de: "(voir p. 23)", vers: () => `(voir ${pp(P.visibilite)})` },
  { page: 7, de: "pages 6-9", vers: () => `pages ${P.generales[0]}-${P.generales[1]}` },
  { page: 7, de: "pages 10-12", vers: () => `pages ${P.metier[0]}-${P.metier[1]}` },
  { page: 7, de: "pages 13-14", vers: () => `pages ${P.secteur[0]}-${P.secteur[1]}` },
  { page: 11, de: "voir p. 19-22", vers: () => `voir p. ${P.moteur[0]}-${P.moteur[1]}` },

  // ── Trois renvois de plus, trouvés en RELISANT LES 48 PAGES À L'ŒIL ──────
  //
  // Les cinq entrées ci-dessus ont été écrites en cherchant les renvois page
  // par page dans la source. Ces trois-là y étaient aussi, et sont passés :
  // deux portent une espace insécable (`p.&nbsp;15`), le troisième est glissé
  // au milieu d'une phrase (« (2 jours, p. 9) »), sans le mot « voir » ni
  // parenthèse isolée qui les rendait repérables.
  //
  // Leçon : un balayage qui cherche une TOURNURE rate ce qui ne l'emploie pas.
  // D'où `check-renvois.cjs`, qui part des NUMÉROS et exige que chacun soit
  // déclaré avec le repère attendu sur la page citée.
  {
    // `page` designe la page de SORTIE, pas celle de pages-source.html.
    page: 7,
    de: "jusqu'à 50 personnes — voir p.&nbsp;15.",
    vers: () => `jusqu'à 50 personnes — voir ${pp(P.seminaire)}.`,
  },
  {
    page: 18,
    de: "Séminaire IA jusqu'à 50 pers. (voir p.&nbsp;15)",
    vers: () => `Séminaire IA jusqu'à 50 pers. (voir ${pp(P.seminaire)})`,
  },
  {
    // « IA pour l'automatisation » est la 4e et dernière offre générale : sa
    // page est donc la borne haute de la plage, pas une constante à recopier.
    page: 44,
    de: "<b>IA pour l'automatisation</b> (2 jours, p.&nbsp;9)",
    vers: () => `<b>IA pour l'automatisation</b> (2 jours, ${pp(P.generales[1])})`,
  },
];

// ---------------------------------------------------------------------------
/// ---------------------------------------------------------------------------
// REPRISES ISSUES DE L'AUDIT MULTI-AGENTS (run wf_1a396362-ae5, 107 agents)
//
// Trois défauts que le balayage automatique des renvois n'attrapait pas, parce
// qu'ils ne sont pas de simples numéros de page :
//
//  1. p.7 — « 4 formules, du Flash terrain à l'audit stratégique. Sur devis. »
//     « Flash terrain » ne désigne AUCUN des quatre niveaux d'audit du
//     catalogue (sur place, Ciblé, Stratégique PME, Stratégique ETI). Le
//     lecteur cherche un niveau qui n'existe nulle part. Et « Sur devis »
//     contredit les p.6 et 37, qui affichent « Dès 1 190 € ».
//
//  2. p.18 — « Accompagnement 1-to-1 & Audit IA : sur devis (voir p. 18) »,
//     imprimé EN PAGE 18. Renvoi circulaire. Il portait une espace insécable
//     (`p.&nbsp;18`), ce qui l'a fait échapper au balayage : une entité HTML
//     n'est pas une espace tant qu'on ne l'a pas décodée.
//
//  3. p.6 — « Coaching 1-to-1 · Dès 790 € HT ». Les 790 € sont le prix d'UNE
//     SESSION d'un contrat de 6, 12 ou 24 mois (p.23) : le premier engagement
//     réel est de 6 × 790 = 4 740 € HT. Le vrai ticket d'entrée est le
//     Collaborateur à 990 €. `pricing.ts` tranche explicitement dans ce sens
//     (`UN_A_UN_TIERS`, commentaire Will 2026-06-23 : le Collaborateur est
//     placé en premier pour que le prix d'entrée affiché soit 990 €). Le
//     catalogue papier annonçait donc un prix plus bas que le site ET
//     impossible à payer tel quel — sur la page qui sert de carte à l'offre.
// ---------------------------------------------------------------------------
const REPRISES_AUDIT = [
  {
    page: 7,
    // le « Sur devis. » qui suivait est repris dans la même passe : laissé seul,
    // il contredisait le prix plancher qu'on venait d'écrire deux mots avant
    de: `4 formules, du Flash terrain à l'audit stratégique. <span style="color:#ffc93c">Sur devis.</span>`,
    vers: () =>
      `4 niveaux, de l'audit sur place en TPE à l'audit stratégique ETI. <span style="color:#ffc93c">Dès 1 190 € HT.</span>`,
  },
  {
    page: 7,
    de: "Coaching individuel dirigeant ou collaborateur, 100&nbsp;% sur mesure — voir p.&nbsp;18.",
    vers: () =>
      `Accompagnement 1-to-1, dirigeant ou collaborateur, 100&nbsp;% sur mesure — dès 990 € HT, voir ${pp(P.coaching)}.`,
  },
  {
    page: 18,
    de: "Accompagnement 1-to-1 &amp; Audit IA : sur devis (voir p.&nbsp;18).",
    vers: () =>
      `Accompagnement 1-to-1 dès 990 € HT, Audit IA dès 1 190 € HT, implémentation dès 990 € HT — grille complète ${pp(P.tarifsToutes)}.`,
  },
];

// MENTION OPCO SUR LES PAGES FORMATION
//
// Demande Will : le lecteur doit savoir, sur les pages formation elles-mêmes,
// que la prestation est prise en charge en partie ou en totalité par son OPCO,
// et surtout QU'IL N'A RIEN À AVANCER. L'argument n'existait qu'en couverture
// et sur la page tarifs — pas sur les onze pages qu'on lui met sous les yeux.
//
// On l'écrit dans le bandeau de pied : pleine largeur, présent sur chaque page
// de la section, et sans aucun risque de débordement puisque le bandeau a une
// hauteur fixe. Le lien reste, l'accroche change.
//
// Formulation : « en subrogation » est le terme exact — l'OPCO règle
// directement l'organisme, donc l'entreprise n'avance pas les fonds. C'est
// conditionné à l'accord de l'OPCO, d'où « possible » plutôt qu'un absolu.
// ---------------------------------------------------------------------------
const MENTION_OPCO =
  "Pris en charge par votre OPCO, en partie ou en totalité — sans avance de votre part";

function mentionOpco(htmlPage) {
  return htmlPage.replace(
    /(<div class="footer">\s*<div class="l">)([\s\S]*?)(<\/div>)/,
    `$1${MENTION_OPCO} <b>→</b> axion-ia.com/formations$3`,
  );
}

// BANDES DE SECTION — repère pleine hauteur, comme dans le livre KDP.
//
// Une bande verticale sur la tranche extérieure dit, sans qu'on ait à lire,
// dans quelle famille d'offre on se trouve. Elle sert d'onglet : catalogue
// fermé, on voit les sections sur la tranche.
//
// Tranche EXTÉRIEURE : à droite sur les pages impaires (recto), à gauche sur
// les paires (verso). Une bande toujours du même côté tomberait dans le pli
// une page sur deux, donc invisible.
//
// Largeur 9 mm dont 3 mm de fond perdu : 6 mm restent après coupe. Le texte
// est décalé de 3 mm vers l'intérieur pour rester dans la partie visible.
// ---------------------------------------------------------------------------
// QUATRE familles, pas cinq. Une famille commerciale = une promesse + un
// acheteur + un régime de financement. Le séminaire partage les trois avec les
// formations — le catalogue le range lui-même avec elles sur la page tarifs et
// sur la page financement (« finançable OPCO »). C'est un FORMAT (grand
// effectif, une journée), pas un métier. Le compter comme famille faisait
// passer l'offre de quatre verbes mémorisables à cinq rayons.
const BANDES = [
  { de: 8, a: 18, label: "Formations IA", couleur: "var(--terra)" },
  { de: 19, a: 22, label: "Accompagnement 1-to-1", couleur: "var(--ochre)" },
  { de: 23, a: 28, label: "Audit IA", couleur: "var(--blue)" },
  { de: 29, a: 35, label: "Implémentation & automatisation", couleur: "var(--sage)" },
  { de: 36, a: 37, label: "Tarifs & financement", couleur: "var(--mocha)" },
];

function bandePour(n) {
  return BANDES.find((b) => n >= b.de && n <= b.a) || null;
}

/** Insère la bande juste après l'ouverture de <section class="page" …>. */
function injecteBande(htmlPage, bande, estPageImpaire) {
  const cote = estPageImpaire ? "right" : "left";
  const div =
    `<div class="sect-band ${cote}" aria-hidden="true" style="background:${bande.couleur}">` +
    `<span>${esc(bande.label)}</span></div>`;
  return htmlPage.replace(/(<section class="page"[^>]*>)/, `$1\n  ${div}`);
}

/** Règles CSS de la bande, injectées dans le <head> pour ne pas toucher la source. */
const CSS_BANDE = `
/* ---- Bande de section (onglet de tranche) — injectée par build-conseil.cjs ---- */
/* 13 mm dont 3 de fond perdu → 10 mm visibles après coupe.
   ⚠️ La première version faisait 9 mm avec 3 mm de retrait, ce qui plaçait le
   LIBELLÉ à 1,1 mm du trait de coupe — mesuré par check-maquette.cjs. Il aurait
   été rogné au façonnage, d'autant qu'un livret de 48 pages perd encore de la
   chasse en gouttière sur les cahiers centraux. Le retrait passe à 4,5 mm : le
   texte revient à ~4,3 mm du trait. On ne dépasse pas 13 mm, parce que le
   contenu courant commence exactement là (--pad) et serait recouvert. */
.sect-band{position:absolute;top:0;bottom:0;width:13mm;z-index:3;
  display:flex;align-items:center;justify-content:center}
.sect-band.right{right:0;padding-right:4.5mm}
.sect-band.left{left:0;padding-left:4.5mm}
.sect-band span{writing-mode:vertical-rl;font-weight:800;font-size:8pt;letter-spacing:.18em;
  text-transform:uppercase;color:#fff;white-space:nowrap}
.sect-band.left span{transform:rotate(180deg)}

/* ---- Folio dans la marge EXTÉRIEURE ----
   Le bandeau de pied est composé « accroche à gauche, folio à droite » sur les
   48 pages. Or sur une page de GAUCHE la marge extérieure est à GAUCHE : le
   folio s'y retrouvait contre la pliure, et sur une double les deux numéros se
   rejoignaient presque au centre. C'est exactement la faute que les bandes de
   section évitent déjà en changeant de tranche selon la parité — le pied, lui,
   ne l'évitait pas.

   row-reverse sur les pages paires suffit : le folio passe à l'extérieur,
   l'accroche rentre vers la pliure. Aucune page n'est réécrite, seule la règle
   partagée change. */
.page[data-parite="paire"] .footer{flex-direction:row-reverse}

/* ---- Bandeau de pied : centrer le texte dans la partie VISIBLE ----
   Le bandeau descend jusqu'au bord de la feuille (fond perdu). Son texte était
   centré dans les 14 mm du bandeau ENTIER, donc dans une zone dont 3 mm
   partent à la coupe : le folio et la flèche se retrouvaient à 1,8-2 mm du
   trait — mesuré par check-maquette.cjs. Trop peu pour du texte, surtout sur
   un livret de 48 pages où les cahiers centraux perdent encore de la chasse.

   Le retrait bas remonte le texte dans ce que le lecteur voit RÉELLEMENT
   (289→300 mm et non 289→303). À 3 mm il est exactement centré sur la partie
   visible et se tient à 3,3 mm du trait ; à 4,5 mm il monte de 0,75 mm — un
   décentrage imperceptible — et gagne 1,4 mm de marge. On prend 4,5 mm : sur
   du texte au bord d'une coupe, la marge vaut mieux que la symétrie parfaite.

   C'est une règle partagée, injectée dans la SORTIE : aucune page n'est
   réécrite, les fiches formations ne bougent pas d'un pixel. */
.footer{padding-bottom:4.5mm}
`;

// ---------------------------------------------------------------------------
// COUVERTURES — la 4e reprend le fond de la 1re.
//
// La 1re de couverture est MOCHA sous la photo. La 4e (Visibilité) était
// ivoire, et la page 47 (Nous contacter) mocha : les deux extrêmes du
// catalogue ne se répondaient pas.
//
// On échange donc les fonds. Ce n'est pas qu'une couleur : chaque page a ses
// textes réglés pour SON fond. Un simple changement d'aplat rendrait du blanc
// sur ivoire et du mocha sur mocha. Les remplacements ci-dessous sont donc
// ciblés, et volontairement peu nombreux — le reste de la maquette ne bouge pas.
// ---------------------------------------------------------------------------

/**
 * p.1 — COUVERTURE. Elle ne vendait qu'une famille sur cinq.
 *
 * Le catalogue portait « Catalogue de formations en entreprise », « Formations
 * IA », « 21 formations + 1 séminaire » et « Votre formation peut ne rien vous
 * coûter » — pas un mot du coaching, de l'audit ni de l'implémentation, qui
 * occupent pourtant 19 des 48 pages. Un lecteur classait Axion-IA en organisme
 * de formation et ne cherchait jamais l'audit.
 *
 * Reprises ciblées : sur-titre, titre, baseline, décompte des offres et bloc
 * OPCO. La photo, les dégradés et la structure ne bougent pas.
 */
function pageCouverture(src) {
  const p = src
    // — sur-titre : le document n'est plus un catalogue de formations
    .replace(
      ">Catalogue de formations en entreprise<",
      ">Catalogue de prestations IA en entreprise<",
    )
    // — titre : trois verbes, les trois modes d'intervention
    .replace(
      /Formations <span class="display-it" style="color:var\(--terra-bright\)">IA<\/span>/,
      `L'IA,<br><span class="display-it" style="color:var(--terra-bright)">de l'idée à l'impact.</span>`,
    )
    // 72 pt tenait sur une ligne ; le titre en fait deux désormais
    .replace("font-size:72pt;margin:3mm 0 0", "font-size:52pt;margin:3mm 0 0")
    // — baseline : les cinq familles, nommées
    .replace(
      `Former · Accompagner · Auditer — <span style="color:#ffb894">de l'idée à l'impact.</span>`,
      `Former · Accompagner · Auditer · Implémenter — <span style="color:#ffb894">un seul partenaire.</span>`,
    )
    // — le logo porte désormais sa propre pastille blanche : la boîte fait doublon
    .replace(
      `style="background:#fff;border-radius:12px;padding:6px 13px;box-shadow:0 4mm 16mm -6mm rgba(0,0,0,.7)"`,
      `style="border-radius:12px;filter:drop-shadow(0 4mm 16mm rgba(0,0,0,.55))"`,
    )
    // — le pavé de décomptes est remplacé par une INVITATION.
    //   « 34 prestations IA · 5 familles » se lisait « 34 formations » (Will) ;
    //   « 21 formations + 1 séminaire et 12 prestations de conseil » était juste
    //   mais lourd pour une couverture. Une couverture doit faire OUVRIR, pas
    //   inventorier : les nombres vivent au sommaire et sur chaque section.
    .replace(
      `<div class="display" style="font-size:30pt;color:#fff;line-height:1">21 formations<span style="color:var(--terra-bright)"> + </span>1 séminaire</div>
        <div style="font-size:10.5pt;color:var(--sand);margin-top:2.5mm">Offres générales · par métier · par secteur — intra, présentiel &amp; distanciel</div>`,
      `<div class="display" style="font-size:23pt;color:#fff;line-height:1.1">Par où commencer&nbsp;?
          <span style="color:var(--terra-bright)">La réponse page ${P.services}.</span></div>
        <div style="font-size:9.6pt;color:var(--sand);margin-top:2.5mm;line-height:1.45">Formations · Accompagnement 1-to-1 · Audit IA · Implémentation &amp; automatisation<br>Intra-entreprise, présentiel &amp; distanciel</div>`,
    )
    // — OPCO : « en partie ou en totalité », et surtout SANS AVANCE (subrogation)
    .replace(
      `<div style="font-size:13.5pt;font-weight:800;color:#fff;line-height:1.15">Votre formation peut ne rien vous coûter</div>
          <div style="font-size:9.5pt;color:#ffe9df;margin-top:2mm;line-height:1.45">Financée par votre <b style="color:#fff">OPCO</b> — vous avez déjà cotisé pour ça. Et <b style="color:#fff">nous montons tout le dossier pour vous</b>, de A à Z.</div>`,
      `<div style="font-size:13pt;font-weight:800;color:#fff;line-height:1.15">Vos formations peuvent ne rien vous coûter</div>
          <div style="font-size:9.2pt;color:#ffe9df;margin-top:2mm;line-height:1.42">Prises en charge par votre <b style="color:#fff">OPCO</b>, en partie ou en totalité — vous avez déjà cotisé pour ça. <b style="color:#fff">En subrogation, l'OPCO nous règle directement : vous n'avancez rien.</b> Nous montons le dossier de A à Z.</div>`,
    )
    // — le bloc bas gagne du contenu (5 familles + réserve) : on le resserre
    //   d'autant, sinon la page déborde de 15,6 mm (mesuré par check-overflow)
    .replace("padding:10mm var(--pad) 13mm", "padding:5mm var(--pad) 7.5mm")
    .replace(
      `<img src="assets/qualiopi-logo.png" alt="Qualiopi — actions de formation" style="height:26mm;width:auto;display:block">`,
      `<img src="assets/qualiopi-logo.png" alt="Qualiopi — actions de formation" style="height:21mm;width:auto;display:block">`,
    )
    .replace('style="flex:none;width:47mm;background:#fff;border-radius:14px;padding:5mm', 'style="flex:none;width:44mm;background:#fff;border-radius:14px;padding:4mm')
    .replace("border-radius:14px;padding:5mm 7mm;display:flex;align-items:center;gap:6mm;box-shadow", "border-radius:14px;padding:4mm 6mm;display:flex;align-items:center;gap:5mm;box-shadow")
    // — le QR de couverture ouvre le catalogue entier, plus seulement les formations
    .replace(">Scannez : toutes nos formations<", ">Scannez : toutes nos offres<")
    // — réserve honnête : le reste à charge s'entend hors taxes, et le conseil
    //   n'est pas finançable. Sans cette ligne, « 0 € » est une promesse nue.
    .replace(
      `<div style="font-size:13pt;font-weight:800;color:#fff;margin-top:2.5mm">axion-ia.com</div>`,
      `<div style="font-size:13pt;font-weight:800;color:#fff;margin-top:2.5mm">axion-ia.com</div>
        <div style="font-size:7.2pt;color:rgba(226,209,176,.75);margin-top:2mm;line-height:1.35;max-width:112mm">Prise en charge applicable aux formations et au séminaire, sur montants HT, selon votre OPCO et votre situation. Accompagnement, audit et implémentation sont des prestations de conseil, non finançables.</div>`,
    );

  return p.replace(/(<section class="page"[^>]*)>/, "$1>\n  <!-- GEN:conseil -->");
}

/** p.47 — « Parlons de vos équipes » repasse en clair. */
function pageContact(src) {
  let p = src
    .replace('<div class="page__bg" style="background:var(--mocha)"></div>', "")
    .replace('<div style="color:#fff;height:100%', '<div style="color:var(--ink);height:100%')
    .replace(/color:#fff"\>Parlons de vos/, 'color:var(--ink)">Parlons de vos')
    // le logo n'a plus besoin de sa pastille blanche sur fond clair
    .replace('style="height:15mm;background:#fff;border-radius:8px;padding:6px 10px"', 'style="height:15mm"')
    .replace(/color:var\(--sand\)/g, "color:var(--ink-soft)")
    .replace('border-top:1px solid rgba(255,255,255,.2)', "border-top:1px solid var(--line)")
    .replace('color:rgba(247,243,234,.6)', "color:var(--ink-muted)")
    .replace('<b style="color:#fff">ACTIONS DE FORMATION</b>', '<b style="color:var(--ink)">ACTIONS DE FORMATION</b>')
    // le bandeau Qualiopi n'a plus besoin de son fond blanc
    .replace('style="height:20mm;background:#fff;border-radius:8px;padding:5px"', 'style="height:20mm"')
    // — MENTIONS LÉGALES RÉELLES (demande Will 2026-08-17).
    //
    // Le catalogue imprimait « SIRET 000 000 000 00000 », « n° 00 00 00000 00 »
    // et « [adresse] ». Des zéros de remplissage sur du papier valent moins que
    // rien : ils donnent l'apparence d'une identité déclarée là où il n'y en a
    // pas. Les valeurs viennent des mentions légales publiées sur axion-ia.com,
    // qui font foi.
    //
    // Décision Will 2026-08-17 : ni le capital social, ni le paragraphe sur la
    // déclaration d'activité ne figurent au catalogue. Ne pas les réintroduire.
    //
    // La mention Qualiopi complète (catégorie d'actions) figure ICI et nulle
    // part ailleurs : le logo reste tel quel sur les autres pages.
    .replace(
      /<b style="color:var\(--ink-soft\)">Mentions légales — à compléter :<\/b>[\s\S]*?Directeur de la publication : Williams Jullin\./,
      `<b style="color:var(--ink)">Mentions légales.</b>
      <b>AXION IA SAS</b>, société par actions simplifiée · Siège social : ELITE BUREAUX — boîte 53, 11 avenue Paul Verlaine, 38100 Grenoble · RCS Grenoble, <b>SIREN 108 018 631</b> · <b>SIRET</b> (siège) 108 018 631 00011 · TVA intracommunautaire FR51 108 018 631 · Directeur de la publication : Williams Jullin, président · contact@axion-ia.com<br>
      <b style="color:var(--ink)">Organisme de formation certifié Qualiopi.</b> La certification qualité a été délivrée au titre de la catégorie d'actions suivante : <b>Actions de formation</b>.`,
    )

    // Le grand vide central passait pour de la respiration sur fond mocha ;
    // sur fond clair il fait page inachevée. On le remplit par les étapes
    // concrètes — c'est la dernière page lue avant la 4e de couverture.
    .replace(
      '<div style="flex:1"></div>',
      `<div style="flex:1;display:flex;flex-direction:column;justify-content:center">
      <div style="background:var(--mocha);border-radius:16px;padding:5.5mm 8mm;color:#fff">
        <div class="eyebrow" style="color:var(--terra-bright);margin-bottom:3mm">Et concrètement, maintenant ?</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7mm">
          ${[
            ["1", "Vous réservez", "30 minutes, sans engagement. On comprend votre métier et vos tâches chronophages."],
            ["2", "On vous répond", "Un devis chiffré sous 48 h — et franchement, si aucune de nos offres n'est utile."],
            ["3", "On monte le dossier", "Pour les formations : la prise en charge OPCO, montée de A à Z par nos soins."],
          ]
            .map(
              ([n, t, d]) => `<div>
            <div style="display:flex;align-items:center;gap:2.5mm;margin-bottom:1.5mm">
              <span style="flex:none;width:7mm;height:7mm;border-radius:50%;background:var(--terra);color:#fff;font-family:'Fraunces',serif;font-weight:600;font-size:10pt;display:flex;align-items:center;justify-content:center">${n}</span>
              <span style="font-weight:800;font-size:10.5pt;color:#fff">${t}</span></div>
            <div style="font-size:9.2pt;line-height:1.42;color:var(--sand)">${d}</div></div>`,
            )
            .join("")}
        </div>
      </div>
    </div>`,
    );
  return p.replace(/(<section class="page"[^>]*)>/, "$1>\n  <!-- GEN:conseil -->");
}

/** p.48 — Visibilité passe en mocha, comme la 1re de couverture. */
function pageVisibilite(src) {
  let p = src
    .replace(
      /(<section class="page"[^>]*>)/,
      '$1\n  <div class="page__bg" style="background:var(--mocha)"></div>\n  <!-- GEN:conseil -->',
    )
    // les trois seuls textes posés directement sur le fond de page
    .replace('<span class="sec">Inclus · visibilité offerte</span>', '<span class="sec" style="color:var(--sand)">Inclus · visibilité offerte</span>')
    .replace('style="color:var(--blue)"', 'style="color:#7ea2ff"')
    .replace(/color:var\(--ink-muted\)/g, "color:var(--sand)");
  return p;
}

// ---------------------------------------------------------------------------
// ASSEMBLAGE
// ---------------------------------------------------------------------------
(async () => {
  // 1. QR : générés ET relus avant d'entrer dans une page.
  for (const slug of Object.keys(QR)) qrCache[slug] = await svgVerifie(slug);
  console.log(`QR générés et relus au décodeur : ${Object.keys(QR).length}`);

  // 2. Pages existantes, dans leur état d'origine.
  let html = fs.readFileSync(SRC, "utf8");
  const iDeck = html.indexOf('<div class="deck">') + '<div class="deck">'.length;
  const iFin = html.lastIndexOf("</div>");
  // CSS de la bande ajoutée au <head> de la sortie : la source reste intacte.
  //
  // ⚠️ La feuille d'origine porte
  //   `.page > *:not(.page__bg):not(.footer):not(.trim):not(.foldline){position:relative}`
  // — ses quatre :not() lui donnent une spécificité (0,5,0), qui écrase le
  // `position:absolute` d'une simple classe. Sans l'exception ajoutée ici, la
  // bande redevient un élément de flux, prend de la hauteur et pousse le
  // contenu hors de la page : 19 pages rognées, constaté par check-overflow.
  const tete = html
    .slice(0, iDeck)
    .replace(
      ".page > *:not(.page__bg):not(.footer):not(.trim):not(.foldline)",
      ".page > *:not(.page__bg):not(.footer):not(.trim):not(.foldline):not(.sect-band)",
    )
    .replace("</style>", CSS_BANDE + "</style>");
  const queue = html.slice(iFin);

  const corps = html.slice(iDeck, iFin);
  const blocs = corps.split(/(?=<section class="page")/).filter((s) => s.trim().startsWith("<section"));
  // La source ne doit JAMAIS contenir de page générée : si c'est le cas, on a
  // pointé le build sur sa propre sortie.
  const E = blocs.filter((b) => !b.includes("GEN:conseil"));
  if (E.length !== blocs.length) {
    throw new Error(
      `[build-conseil] ${blocs.length - E.length} page(s) générée(s) trouvée(s) dans ${path.basename(SRC)}.
` +
        `  La source a été écrasée par une sortie. La restaurer avant de relancer.`,
    );
  }
  if (E.length !== 24) throw new Error(`[build-conseil] attendu 24 pages d'origine, trouvé ${E.length}`);

  const slots = emplacements();
  const co = offres.coaching, au = offres.audit, im = offres.implementation;

  // Nom unique par prestation, aligné pricing.ts et sur la grille de la page
  // tarifs. La 2e portait trois noms selon les pages : « Coaching IA ·
  // Collaborateur », « Collaborateur · Optimisation du poste », « Coaching
  // individuel dirigeant ou collaborateur ».
  co[1] = { ...co[1], title: "Optimisation du poste" };

  // 3. L'ordre voulu : formations → séminaire → coaching → audit →
  //    implémentation, Visibilité en 4e de couverture.
  //
  // « Cinq façons de travailler ensemble » est remontée en p.6, avant le guide
  // de choix des formations : c'est la carte de TOUTE l'offre, elle doit être
  // lue avant qu'on entre dans une famille. Elle était en p.19, où elle arrivait
  // après 12 pages de formations — trop tard pour servir de carte.
  //
  // Les trois pages « argent » se suivent désormais (37 tarifs, 38 financement)
  // au lieu d'être dispersées : il y avait trois endroits où l'on parlait prix.
  const ORDRE = [
    pageCouverture(E[0]),                   //  1 Couverture — réécrite (5 familles)
    E[1],                                   //  2 Édito + sommaire
    pageQrCatalogue(),                      //  3 Le catalogue en ligne
    E[2], E[3],                             //  4-5 Pourquoi · Comment ça se passe
    pageServices5(),                        //  6 Cinq façons (remplace E[17])
    E[4],                                   //  7 Quelle formation pour vous
    E[5], E[6], E[7], E[8],                 //  8-11 Offres générales
    E[9], E[10], E[11],                     // 12-14 Par métier
    E[12], E[13],                           // 15-16 Par secteur
    E[14],                                  // 17 Séminaire IA
    E[15],                                  // 18 Tarifs formations
    pageOuvreur("coaching"),                // 19
    fichePrestation(co[0], "coaching", 1, "cat-c01"),        // 20
    fichePrestation(co[1], "coaching", 2, "cat-c02"),        // 21
    fichePrestation(co[2], "coaching", 3, "cat-c03"),        // 22
    pageOuvreur("audit"),                   // 23
    pageMethodeAudit(),                     // 24
    fichePrestation(au[0], "audit", 1, "cat-a01"),           // 25
    fichePrestation(au[1], "audit", 2, "cat-a02"),           // 26
    fichePrestation(au[2], "audit", 3, "cat-a03"),           // 27
    fichePrestation(au[3], "audit", 4, "cat-a04"),           // 28
    pageOuvreur("implementation"),          // 29
    pageMethodeImplementation(),            // 30
    fichePrestation(im[0], "implementation", 1, "cat-i01"),  // 31
    fichePrestation(im[1], "implementation", 2, "cat-i02"),  // 32
    fichePrestation(im[2], "implementation", 3, "cat-i03"),  // 33
    fichePrestation(im[3], "implementation", 4, "cat-i04"),  // 34
    fichePrestation(im[4], "implementation", 5, "cat-i05"),  // 35
    // 36 | 37 forment une DOUBLE PAGE : en piqûre à cheval, les pages paires
    // sont à gauche. Tarifs et Financement — la paire qui décide de l'achat —
    // étaient en 37|38, donc séparées par le pli et jamais lues ensemble.
    pageTarifsRecap(),                      // 36  ┐ visibles
    pageFinancement(),                      // 37  ┘ ENSEMBLE
    E[16],                                  // 38 Cas d'usage — la preuve, après le prix
    pageTemoignages(slots.slice(0, 3), 1, 2),  // 39
    pageTemoignages(slots.slice(3, 6), 2, 2),  // 40
    E[18], E[19], E[20], E[21],             // 41-44 Moteur · automatisations · et chez vous
    pageConformite(),                       // 45
    pageFaq(),                              // 46
    pageContact(E[23]),                     // 47 Nous contacter — repassée en clair
    pageVisibilite(E[22]),                  // 48 Visibilité — mocha, comme la 1re de couv
  ];

  // Parité de chaque page, puis bandes de section pleine hauteur (voir BANDES).
  // Injectées ici plutôt que dans les pages : la source reste intacte, et les
  // plages suivent l'ordre ci-dessus sans qu'on ait à les recopier page à page.
  //
  // La classe de parité sert à tout ce qui doit se placer en marge EXTÉRIEURE —
  // aujourd'hui le folio. Elle est posée sur la page elle-même pour qu'une
  // règle CSS partagée suffise, sans toucher au contenu.
  let paires = 0;
  for (let i = 0; i < ORDRE.length; i++) {
    const impaire = (i + 1) % 2 === 1;
    // ⚠️ NE PAS ajouter la parité dans `class` : une demi-douzaine de scripts
    // découpent le document sur `/(?=<section class="page")/` — guillemet
    // fermant compris. Une classe supplémentaire fait échouer le découpage et
    // renumber.cjs a immédiatement déclaré tous les renvois hors document.
    // Un ATTRIBUT laisse `class="page"` intact.
    ORDRE[i] = ORDRE[i].replace(
      /<section class="page"/,
      `<section class="page" data-parite="${impaire ? "impaire" : "paire"}"`,
    );
    if (!impaire) paires++;
    const bande = bandePour(i + 1);
    if (bande) ORDRE[i] = injecteBande(ORDRE[i], bande, impaire);
  }

  // Renvois périmés hérités de la version 24 pages.
  let corriges = 0;
  // Une reprise qui ne trouve plus sa cible ARRÊTE le build. Elle ne prévient
  // pas : jusqu'ici elle écrivait un `console.warn` au milieu de vingt lignes
  // de sortie, et le build finissait en vert avec un renvoi faux imprimé.
  // Une garde qui n'a pas le pouvoir de rougir ne garde rien.
  const manques = [];
  for (const r of RENVOIS_PERIMES) {
    const avant = ORDRE[r.page - 1];
    ORDRE[r.page - 1] = avant.split(r.de).join(r.vers());
    if (ORDRE[r.page - 1] !== avant) corriges++;
    else manques.push(`renvoi p.${r.page} : « ${r.de} »`);
  }

  // Reprises issues de l'audit multi-agents.
  let audites = 0;
  for (const r of REPRISES_AUDIT) {
    const avant = ORDRE[r.page - 1];
    ORDRE[r.page - 1] = avant.split(r.de).join(r.vers());
    if (ORDRE[r.page - 1] !== avant) audites++;
    else manques.push(`reprise d'audit p.${r.page} : « ${r.de.slice(0, 60)}… »`);
  }

  if (manques.length) {
    throw new Error(
      `${manques.length} reprise(s) ne trouvent plus leur cible dans pages-source.html :\n` +
        manques.map((m) => `    · ${m}`).join("\n") +
        `\n  La page d'origine a changé sous la reprise. Le texte périmé serait IMPRIMÉ tel quel.`,
    );
  }

  // Mention OPCO sur les pages formation + séminaire.
  let opco = 0;
  for (let n = P.formations[0]; n <= P.tarifsFormations; n++) {
    const avant = ORDRE[n - 1];
    ORDRE[n - 1] = mentionOpco(avant);
    if (ORDRE[n - 1] !== avant) opco++;
  }

  // 3bis. Les renvois de P doivent désigner la bonne page. Sans cette garde,
  // déplacer une section laisserait tous les « voir p. XX » faux en silence —
  // et un renvoi faux ne se voit qu'une fois le catalogue chez le client.
  const attendus = [
    [P.seminaire, "Séminaire IA"],
    [P.coaching[0], "une journée, ses vrais dossiers"],
    [P.audit[0], "Avant d'investir, savoir"],
    [P.implementation[0], "Le clé en main"],
    [P.tarifsToutes, "Tous nos tarifs"],
    [P.financement, "Ce qui est finançable"],
    [P.temoignages[0], "Témoignage 1"],
    [P.visibilite, "coup de projecteur"],
  ];
  const faux = attendus.filter(([n, marqueur]) => !(ORDRE[n - 1] || "").includes(marqueur));
  if (faux.length) {
    throw new Error(
      `[build-conseil] renvois faux — la table P ne suit plus l'ORDRE :\n` +
        faux.map(([n, m]) => `  p.${n} devrait contenir « ${m} »`).join("\n"),
    );
  }

  // 4. Contrainte d'impression : piqûre à cheval = multiple de 4.
  if (ORDRE.length % 4 !== 0) {
    throw new Error(
      `[build-conseil] ${ORDRE.length} pages : le livret piqué à cheval exige un multiple de 4.\n` +
        `  Ajouter ou retirer ${4 - (ORDRE.length % 4)} page(s).`,
    );
  }

  fs.writeFileSync(OUT, tete + "\n" + ORDRE.join("\n") + "\n" + queue, "utf8");

  const ajoutees = ORDRE.filter((p) => p.includes("GEN:conseil")).length;
  console.log(`Catalogue assemblé : ${ORDRE.length} pages (${ORDRE.length / 4} feuillets)`);
  console.log(`  ${ORDRE.length - ajoutees} pages d'origine reprises telles quelles`);
  console.log(`  ${ajoutees} pages générées`);
  console.log(`  témoignages : ${slots.length} emplacements numérotés, 1 QR chacun, aucun texte`);
  console.log(`  renvois périmés corrigés : ${corriges}/${RENVOIS_PERIMES.length}`);
  console.log(`  reprises d'audit appliquées : ${audites}/${REPRISES_AUDIT.length}`);
  console.log(`  mention OPCO « sans avance » posée sur ${opco} pages formation`);
  console.log(`  folio en marge extérieure : ${paires} pages paires passées en row-reverse`);
  console.log(`\nEnchaîner : node renumber.cjs && node scan-qr.cjs`);
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
