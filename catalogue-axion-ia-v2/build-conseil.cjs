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
        ? `<div class="fsub o">Nos engagements</div><ul class="fl">${o.garanties.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>`
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
          <span class="fchip" style="${f.pastille}">${esc(o.pillarBadge)}</span>
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
  const l = (ic, titre, compl, txt, detail, prix) =>
    `<div class="svc" style="padding:3.4mm 0">
      <div class="ic">${ic}</div>
      <div style="flex:1"><h4>${titre}${compl ? ` <span style="font-weight:600;color:var(--ink-muted);font-size:9.5pt">— ${compl}</span>` : ""}</h4>
        <p style="margin-bottom:${detail ? "1.5mm" : "0"}">${txt}</p>
        ${detail ? `<div style="font-size:9pt;color:var(--ink-muted);line-height:1.55">${detail}</div>` : ""}</div>
      <div class="mono" style="font-weight:700;color:var(--terra);white-space:nowrap">${prix}</div>
    </div>`;

  return page(
    `${runhead("Nos offres")}

  <div style="text-align:center">
    <h2 class="display" style="font-size:28pt;margin:0">Cinq façons de
      <span class="display-it" style="color:var(--terra)">travailler ensemble</span></h2>
    <p style="font-size:11pt;color:var(--ink-soft);margin:3mm auto 0;max-width:158mm">
      Former vos équipes, fédérer toute l'entreprise, accompagner une personne, auditer vos process, construire vos automatisations — de l'idée à l'impact.</p>
    <div class="rule" style="margin:4mm auto 0"></div>
  </div>

  <div style="margin-top:4mm">
    ${l("🎓", "Formations IA", "21 formations", "En intra-entreprise, présentiel ou distanciel, sur vos vraies tâches. Chacun repart avec un livrable terminé.", "<b>4 offres générales</b> &nbsp;·&nbsp; <b>9 par métier</b> &nbsp;·&nbsp; <b>8 par secteur</b> &nbsp;— voir p. 7 à 15", "Dès 1 200 € HT")}
    ${l("🎤", "Séminaire IA", "toute l'entreprise", "Une journée pour cadrer les usages et mettre tous vos services au diapason, jusqu'à 50 participants.", "Voir p. 16", "Sur devis")}
    ${l("🤝", "Accompagnement 1-to-1", "3 formules", "Une personne, un expert, une journée sur ses vrais dossiers — ou un suivi régulier dans la durée.", "<b>Dirigeant · Vision IA stratégique</b> &nbsp;·&nbsp; <b>Collaborateur</b> &nbsp;·&nbsp; <b>Coaching régulier</b> — voir p. 20 à 23", "Dès 790 € HT")}
    ${l("🔍", "Audit IA", "4 niveaux", "On cartographie vos usages, on chiffre chaque opportunité et on livre une feuille de route priorisée.", "<b>Sur place (TPE)</b> &nbsp;·&nbsp; <b>Ciblé</b> &nbsp;·&nbsp; <b>Stratégique PME</b> &nbsp;·&nbsp; <b>Stratégique ETI</b> — voir p. 24 à 29", "Dès 1 190 € HT")}
    ${l("🚀", "Implémentation & automatisation", "5 domaines", "Vous préférez le clé en main ? Nous concevons, développons et livrons — code et documentation compris.", "<b>Processus</b> &nbsp;·&nbsp; <b>Chatbots</b> &nbsp;·&nbsp; <b>Agents IA</b> &nbsp;·&nbsp; <b>Documents</b> &nbsp;·&nbsp; <b>IA custom</b> — voir p. 30 à 36", "Pilote dès 990 € HT")}
  </div>

  <div style="margin-top:auto;background:var(--mocha);border-radius:16px;padding:4.5mm 8mm;color:#fff;display:flex;align-items:center;gap:8mm">
    <div style="flex:1">
      <div class="eyebrow" style="color:var(--terra-bright);margin-bottom:1.5mm">Vous ne savez pas par où commencer ?</div>
      <div style="font-family:'Fraunces',serif;font-size:18pt;font-weight:600;line-height:1.12;color:#fff">Un appel de cadrage de 30 minutes, <span class="display-it" style="color:var(--terra-bright)">et on vous dit franchement.</span></div>
      <p style="font-size:10pt;color:var(--sand);line-height:1.5;margin:2.5mm 0 0;max-width:118mm">Parfois la bonne réponse est une demi-journée de formation. Parfois c'est un audit. Parfois c'est d'attendre. <b style="color:#fff">On vous le dira.</b> Sans engagement.</p>
    </div>
    ${qrBoite("cat-catalogue", "26mm", "")}
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
    eyebrow: "Accompagnement individuel",
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
    encart: "⚠️ Une prestation de conseil, pas une action de formation — donc pas d'objectifs pédagogiques, pas d'évaluation, et pas de financement OPCO. Voir p. 44.",
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
    encart: "⚠️ Prestation de conseil, hors action de formation : non finançable par un OPCO. Voir p. 44.",
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
    encart: "⚠️ Prestation de conception et de développement, hors action de formation : non finançable par un OPCO. Voir p. 44.",
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

    <div style="background:var(--sand);border-radius:13px;padding:4mm 6mm;font-size:10pt;color:var(--ink-soft);line-height:1.5">${esc(o.encart)}</div>

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
  const bloc = (titre, couleur, lignes, note) =>
    `<div style="margin-top:3.4mm">
      <div style="display:flex;align-items:center;gap:3mm;margin-bottom:1.6mm">
        <span style="width:4mm;height:4mm;border-radius:2px;background:${couleur};flex:none"></span>
        <span style="font-family:'Fraunces',serif;font-weight:600;font-size:13pt">${esc(titre)}</span></div>
      <table class="ptable" style="font-size:9.2pt">
        <tbody>${lignes
          .map(
            ([a, b, c]) =>
              // padding resserré : quatre tableaux sur une page rognaient 42 mm
              // avec le 3,1 mm par défaut (mesuré par check-overflow.cjs).
              `<tr><td class="g" style="padding:1.5mm 5mm">${esc(a)}</td>` +
              `<td style="padding:1.5mm 5mm;color:var(--ink-muted)">${esc(b)}</td>` +
              `<td style="padding:1.5mm 5mm;font-size:10.5pt">${esc(c)}</td></tr>`,
          )
          .join("")}</tbody>
      </table>
      ${note ? `<div style="font-size:8.2pt;color:var(--ink-muted);margin-top:1.2mm;line-height:1.35">${note}</div>` : ""}
    </div>`;

  return page(
    `${runhead("Tarifs · toutes les offres")}

  <div style="text-align:center">
    <h2 class="display" style="font-size:26pt;margin:0">Tous nos tarifs,
      <span class="display-it" style="color:var(--terra)">en une page</span></h2>
    <p style="font-size:10.5pt;color:var(--ink-soft);margin:2.5mm auto 0;max-width:158mm">
      Prix publics hors taxes. Formations : <b>par groupe</b>, pas par personne. Hors frais de déplacement.</p>
  </div>

  ${bloc("Formations & séminaire", "var(--terra)", [
    ["Offres générales — 4 h (½ j)", "2 à 15 pers.", "1 200 €"],
    ["Offres générales — 1 jour", "2 à 15 pers.", "1 900 €"],
    ["Offres générales — 2 jours", "2 à 15 pers.", "3 600 €"],
    ["Formations par métier — 1 j / 2 j", "2 à 15 pers.", "1 900 € / 3 600 €"],
    ["Formations par secteur — 1 j / 2 j", "2 à 15 pers.", "2 200 € / 3 900 €"],
    ["Séminaire IA — 1 journée", "jusqu'à 50 pers.", "Sur devis"],
  ], "Finançable OPCO / France Travail — jusqu'à 100 %. Montage du dossier inclus. Voir p. 17 et 44.")}

  ${bloc("Accompagnement 1-to-1", "var(--ochre)", [
    ["Dirigeant · Vision IA stratégique — 1 j / 2 j", "1 dirigeant", "1 390 € / 2 590 €"],
    ["Collaborateur · Optimisation du poste — 1 j / 2 j", "1 collaborateur", "990 € / 1 830 €"],
    ["Coaching régulier", "1 session / mois", "790 € / session"],
  ], "Conseil — non finançable OPCO. Contrat de 6, 12 ou 24 mois pour le coaching régulier.")}

  ${bloc("Audit IA", "var(--blue)", [
    ["Audit sur place — 1 journée (TPE)", "toute l'entreprise", "À partir de 1 190 €"],
    ["Audit Ciblé — Solo / Standard / Avancé", "1 département", "1 900 € → 3 900 €"],
    ["Audit Stratégique PME", "20-50 / 50-250 salariés", "4 900 € / 9 900 €"],
    ["Audit Stratégique ETI", "1-2 BU · multi-BU", "À partir de 1 900 €"],
  ], "Conseil — non finançable OPCO. Chiffrage au cas par cas selon le périmètre réel.")}

  ${bloc("Implémentation & automatisation", "var(--sage)", [
    ["Pilote IA — un cas d'usage prioritaire", "TPE / PME", "Dès 990 €"],
    ["Mission PME / ETI / Grand programme", "multi-cas, transverse", "Sur devis"],
    ["IA custom d'entreprise", "4 à 16 semaines", "Sur devis"],
    ["Maintenance (optionnelle, après les 30 j inclus)", "forfait 4 h / mois", "290 € / mois"],
  ], "Conception et développement — non finançable OPCO. Forfait fixe, devis ferme.")}

  <div style="margin-top:auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:3.5mm">
    <div class="card" style="padding:3.2mm 4.2mm">
      <div class="eyebrow" style="font-size:8pt">Ce qui est compris</div>
      <div style="font-size:8.6pt;color:var(--ink-soft);line-height:1.4;margin-top:1.4mm">
        Préparation, animation, supports et livrables. Pour les formations : convention, convocations, émargements et attestations.</div>
    </div>
    <div class="card" style="padding:3.2mm 4.2mm">
      <div class="eyebrow" style="font-size:8pt">Ce qui s'ajoute</div>
      <div style="font-size:8.6pt;color:var(--ink-soft);line-height:1.4;margin-top:1.4mm">
        Frais de déplacement, d'hébergement et de repas, au réel et sur justificatifs, quand l'intervention a lieu sur site.</div>
    </div>
    <div class="card" style="padding:3.2mm 4.2mm">
      <div class="eyebrow" style="font-size:8pt">TVA</div>
      <div style="font-size:8.6pt;color:var(--ink-soft);line-height:1.4;margin-top:1.4mm">
        Tous les prix sont hors taxes. <b>La TVA au taux en vigueur s'applique à toutes nos prestations</b>, formations comprises.</div>
    </div>
  </div>

${footer("Un devis sous 48 h", "axion-ia.com/appel")}`,
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
      <img src="assets/qualiopi.png" alt="Certification Qualiopi" style="max-width:100%;max-height:36mm;display:block;margin:0 auto">
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
  const tete = html.slice(0, iDeck);
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

  // 3. L'ordre voulu : formations → séminaire → coaching → audit →
  //    implémentation, Visibilité en 4e de couverture.
  const ORDRE = [
    E[0],                                   //  1 Couverture
    E[1],                                   //  2 Édito + sommaire
    pageQrCatalogue(),                      //  3 Le catalogue en ligne
    E[2], E[3], E[4],                       //  4-6 Pourquoi · Comment · Quelle formation
    E[5], E[6], E[7], E[8],                 //  7-10 Offres générales
    E[9], E[10], E[11],                     // 11-13 Par métier
    E[12], E[13],                           // 14-15 Par secteur
    E[14],                                  // 16 Séminaire IA
    E[15],                                  // 17 Tarifs formations
    E[16],                                  // 18 Cas d'usage
    pageServices5(),                        // 19 Cinq façons (remplace E[17])
    pageOuvreur("coaching"),                // 20
    fichePrestation(co[0], "coaching", 1, "cat-c01"),        // 21
    fichePrestation(co[1], "coaching", 2, "cat-c02"),        // 22
    fichePrestation(co[2], "coaching", 3, "cat-c03"),        // 23
    pageOuvreur("audit"),                   // 24
    pageMethodeAudit(),                     // 25
    fichePrestation(au[0], "audit", 1, "cat-a01"),           // 26
    fichePrestation(au[1], "audit", 2, "cat-a02"),           // 27
    fichePrestation(au[2], "audit", 3, "cat-a03"),           // 28
    fichePrestation(au[3], "audit", 4, "cat-a04"),           // 29
    pageOuvreur("implementation"),          // 30
    pageMethodeImplementation(),            // 31
    fichePrestation(im[0], "implementation", 1, "cat-i01"),  // 32
    fichePrestation(im[1], "implementation", 2, "cat-i02"),  // 33
    fichePrestation(im[2], "implementation", 3, "cat-i03"),  // 34
    fichePrestation(im[3], "implementation", 4, "cat-i04"),  // 35
    fichePrestation(im[4], "implementation", 5, "cat-i05"),  // 36
    pageTarifsRecap(),                      // 37
    pageTemoignages(slots.slice(0, 3), 1, 2),  // 38
    pageTemoignages(slots.slice(3, 6), 2, 2),  // 39
    E[18], E[19], E[20], E[21],             // 40-43 Moteur · automatisations · et chez vous
    pageFinancement(),                      // 44
    pageConformite(),                       // 45
    pageFaq(),                              // 46
    E[23],                                  // 47 Nous contacter
    E[22],                                  // 48 Visibilité offerte — 4e de couverture
  ];

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
  console.log(`\nEnchaîner : node renumber.cjs && node scan-qr.cjs`);
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
