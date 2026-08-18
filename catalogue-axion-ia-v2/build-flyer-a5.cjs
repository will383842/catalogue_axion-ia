/* =============================================================
   BUILD-FLYER-A5 — le flyer recto-verso d'Axion-IA.

   RÉÉCRIT LE 2026-08-17 APRÈS RETOUR DE WILL

   La premiere version etait une PAGE DE CATALOGUE reduite en A5 : cinq blocs
   de texte, des prix partout, l'accent sur la formation. Verdict de Will :
   « trop axe sur la formation alors que nous avons plusieurs activites, ca
   fait trop d'informations, il ne faut pas les prix et ca ne fait pas du tout
   flyer. Je veux que ca retienne l'attention meme si on voit ce flyer de loin.
   Il faudrait un fond avec plus de contraste. »

   TROIS REGLES QUI DECIDENT DE TOUT ICI

   1. ON LIT UN FLYER A TROIS METRES. A cette distance on saisit une forme et
      cinq a huit mots, pas un paragraphe. Chaque face porte donc UN message
      dominant, et rien ne vient le concurrencer.

   2. AUCUN PRIX. Un prix invite a comparer ; un flyer invite a appeler. Les
      prix sont dans le catalogue, a un QR de distance.

   3. LES CINQ ACTIVITES SONT A EGALITE. Meme cercle, meme taille, meme poids
      typographique. La formation ne domine plus : elle est la premiere des
      cinq, pas le sujet.

   LE CONTRASTE

   Recto quasi noir (#14100d), halo terracotta et grands arcs traces : de loin
   on voit une FORME avant de lire un mot. Verso ivoire, pour que les deux
   blocs chiffres ressortent en aplat.

   LES PICTOGRAMMES SONT DESSINES, PAS DES EMOJI

   Un emoji sort en couleur, avec un rendu different d'une machine a l'autre,
   et se noie sur un aplat. Cinq traces SVG au meme trait font une famille
   coherente, lisible a trois metres.

   FORMAT : A5 fini 148 x 210 mm, + 3 mm de fond perdu = 154 x 216 mm.
   Marge de securite 9 mm — un flyer se massicote plus grossierement.

   ⚠️ `page.setContent()` ne donne AUCUNE URL de base : tout `src` relatif sort
   CASSE. Les images sont donc embarquees en data URI, et une garde refuse
   toute image qui ne charge pas.

   Usage : node build-flyer-a5.cjs
   ============================================================= */
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const { svgVerifie } = require("./lib-qr.cjs");

const DIR = __dirname;
const SORTIE = path.join(DIR, "export", "flyer-a5.pdf");

const L = 154; // 148 + 3 + 3
const H = 216; // 210 + 3 + 3

function dataURI(rel, mime) {
  return `data:${mime};base64,` + fs.readFileSync(path.join(DIR, rel)).toString("base64");
}
const QUALIOPI = dataURI("assets/qualiopi-logo.png", "image/png");

// ── LES CINQ ACTIVITES ──────────────────────────────────────────────────────
// Deux ou trois mots chacune. Le trace est au meme trait pour toutes : c'est
// ce qui en fait une famille plutot que cinq pictogrammes empruntes.
const ACTIVITES = [
  {
    nom: "Former",
    sous: "vos équipes",
    d: '<path d="M2 8.4 12 3.5l10 4.9-10 4.9z"/><path d="M6.2 10.9v4.6c0 1.6 2.6 2.9 5.8 2.9s5.8-1.3 5.8-2.9v-4.6"/><path d="M21 8.7v5.4"/>',
  },
  {
    nom: "Accompagner",
    sous: "une personne",
    d: '<circle cx="9" cy="7.5" r="3.4"/><path d="M2.8 19.5c0-3.3 2.8-5.6 6.2-5.6s6.2 2.3 6.2 5.6"/><circle cx="17.6" cy="9.2" r="2.4"/><path d="M16 13.8c2.9.3 5.2 2.4 5.2 5.2"/>',
  },
  {
    nom: "Auditer",
    sous: "vos process",
    d: '<circle cx="10.4" cy="10.4" r="6.6"/><path d="M15.2 15.2 21 21"/><path d="M7.6 10.9l2 2 3.4-3.8"/>',
  },
  {
    nom: "Implémenter",
    sous: "vos automatisations",
    d: '<path d="M4.5 19.5 8 16"/><path d="M13.6 4.2c3.7 0 6.4 2.7 6.4 6.4 0 4.3-4.3 8.4-8.5 10l-1.7-3.2-3.2-1.7C8.2 11.5 9.3 4.2 13.6 4.2z"/><circle cx="14.7" cy="9.5" r="1.7"/>',
  },
  {
    nom: "Faire connaître",
    sous: "votre entreprise",
    d: '<rect x="8.8" y="2.4" width="6.4" height="11.4" rx="3.2"/><path d="M5.2 11.4a6.8 6.8 0 0 0 13.6 0"/><path d="M12 18.4V21.6"/><path d="M8.6 21.6h6.8"/>',
  },
];

function pastilleActivite(a) {
  return `
  <div style="text-align:center;flex:1">
    <div style="width:14mm;height:14mm;margin:0 auto;border-radius:50%;
                border:1.7px solid rgba(239,106,44,.85);
                background:rgba(239,106,44,.10);
                display:flex;align-items:center;justify-content:center">
      <svg viewBox="0 0 24 24" width="7.4mm" height="7.4mm" fill="none"
           stroke="#ef6a2c" stroke-width="1.7"
           stroke-linecap="round" stroke-linejoin="round">${a.d}</svg>
    </div>
    <div style="font-size:7.8pt;font-weight:800;color:var(--creme);margin-top:2mm;line-height:1.1">${a.nom}</div>
    <div style="font-size:6.2pt;color:rgba(226,209,176,.72);margin-top:.6mm;line-height:1.2">${a.sous}</div>
  </div>`;
}

const ETAPES = [
  ["1", "Un appel", "30 minutes, sans engagement"],
  ["2", "Un devis", "chiffré sous 48 h"],
  ["3", "Un dossier", "monté de A à Z"],
];

(async () => {
  fs.mkdirSync(path.dirname(SORTIE), { recursive: true });

  const qrCatalogue = await svgVerifie("cat-catalogue");
  const svgQr = (q, mm) =>
    `<svg viewBox="${q.viewBox}" width="${mm}mm" height="${mm}mm" shape-rendering="crispEdges" style="display:block">${q.paths}</svg>`;

  const HTML = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600;1,9..144,700&family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --noir:#14100d; --creme:#faf8f3; --ivory:#ece0c9; --sand:#e2d1b0;
    --terra:#c24a1b; --terra-bright:#ef6a2c; --ink:#1a1815; --ink-soft:#524b41;
    --ink-muted:#6a5f52; --line:#d0b78f;
  }
  @page{size:${L}mm ${H}mm;margin:0}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Manrope',system-ui,sans-serif;color:var(--ink)}
  .p{width:${L}mm;height:${H}mm;position:relative;overflow:hidden;
     page-break-after:always;break-after:page}
  .p:last-child{page-break-after:auto;break-after:auto}
  .in{position:absolute;inset:12mm;display:flex;flex-direction:column;z-index:2}
  /* Le verso porte cinq blocs de tailles inegales : les repartir vaut mieux
     que de tout tasser en haut et de coller le pied en bas. */
  [data-face="verso"] .in{justify-content:space-between}
  .display{font-family:'Fraunces',Georgia,serif;font-weight:600;letter-spacing:-.025em}
  .it{font-style:italic}
</style></head><body>

<!-- ══════════ RECTO — un fond noir, une phrase, cinq activités ══════════ -->
<section class="p" style="background:var(--noir)">
  <div style="position:absolute;inset:0;z-index:0;
       background:radial-gradient(78% 55% at 82% 88%, rgba(239,106,44,.32) 0%, rgba(239,106,44,.08) 42%, transparent 68%)"></div>
  <svg viewBox="0 0 154 216" width="${L}mm" height="${H}mm"
       style="position:absolute;inset:0;z-index:0" fill="none" preserveAspectRatio="none">
    <circle cx="128" cy="198" r="86" stroke="rgba(239,106,44,.32)" stroke-width="1"/>
    <circle cx="128" cy="198" r="112" stroke="rgba(239,106,44,.19)" stroke-width="1"/>
    <circle cx="128" cy="198" r="140" stroke="rgba(239,106,44,.11)" stroke-width="1"/>
  </svg>

  <div class="in">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="display:inline-flex;align-items:center;gap:5px;border:1.5px solid var(--terra-bright);
                  border-radius:999px;padding:1.8mm 3.6mm 2mm">
        <span class="display" style="font-weight:700;font-size:11.5pt;color:var(--creme)">Axion-<span style="color:var(--terra-bright)">IA</span></span>
        <span style="font-size:6pt;font-weight:800;color:var(--terra-bright);letter-spacing:.05em;padding-top:2px">.com</span>
      </div>
      <div style="font-size:6.4pt;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
                  color:rgba(226,209,176,.8);text-align:right;line-height:1.35">Organisme<br>certifié Qualiopi</div>
    </div>

    <div style="margin-top:14mm">
      <h1 class="display" style="font-size:38pt;line-height:.99;color:var(--creme)">L'IA,<br>
        <span class="it" style="color:var(--terra-bright)">de l'idée<br>à l'impact.</span></h1>
      <div style="width:22mm;height:2.4px;background:var(--terra-bright);border-radius:2px;margin-top:6mm"></div>
      <p style="font-size:10.2pt;line-height:1.4;color:var(--sand);margin-top:5mm">
        Un seul partenaire, de la première<br>formation à la mise en production.</p>
    </div>

    <div style="margin-top:auto;display:flex;gap:1.2mm;align-items:flex-start">
      ${ACTIVITES.map(pastilleActivite).join("")}
    </div>

    <div style="margin-top:9mm;display:flex;align-items:center;gap:4mm;
                border-top:1px solid rgba(226,209,176,.25);padding-top:5mm">
      <div style="flex:1">
        <div class="display" style="font-size:14pt;color:var(--creme);line-height:1.1">Le catalogue complet</div>
        <div style="font-size:8.4pt;color:var(--sand);margin-top:1.2mm">axion-ia.com/catalogue</div>
      </div>
      <div style="flex:none;background:#fff;padding:1.5mm;border-radius:6px">${svgQr(qrCatalogue, 16)}</div>
    </div>
  </div>
</section>

<!-- ══════════ VERSO — deux chiffres, trois étapes, un contact ══════════ -->
<section class="p" style="background:var(--ivory)" data-face="verso">
  <svg viewBox="0 0 154 216" width="${L}mm" height="${H}mm"
       style="position:absolute;inset:0;z-index:0" fill="none" preserveAspectRatio="none">
    <circle cx="18" cy="18" r="66" stroke="rgba(194,74,27,.17)" stroke-width="1"/>
    <circle cx="18" cy="18" r="92" stroke="rgba(194,74,27,.10)" stroke-width="1"/>
  </svg>

  <div class="in">
    <h2 class="display" style="font-size:18pt;line-height:1.06;color:var(--ink)">
      Deux raisons<br><span class="it" style="color:var(--terra)">d'en parler maintenant.</span></h2>

    <div style="background:var(--noir);border-radius:14px;padding:5.5mm 5.5mm 6mm;
                display:flex;gap:4mm;align-items:center">
      <div style="flex:none;text-align:center;min-width:24mm">
        <div class="display" style="font-size:34pt;line-height:.9;color:var(--terra-bright)">0 €</div>
      </div>
      <div style="flex:1">
        <b style="font-size:11pt;color:var(--creme);line-height:1.2;display:block">Vos formations peuvent<br>ne rien vous coûter</b>
        <div style="font-size:8.2pt;line-height:1.42;color:var(--sand);margin-top:2mm">
          Votre <b style="color:var(--creme)">OPCO</b> les prend en charge et nous règle
          directement : <b style="color:var(--creme)">vous n'avancez rien.</b></div>
      </div>
    </div>

    <div style="background:var(--terra);border-radius:14px;padding:5.5mm 5.5mm 6mm;
                display:flex;gap:4mm;align-items:center">
      <div style="flex:none;text-align:center;min-width:24mm">
        <div style="font-size:8.2pt;color:rgba(255,255,255,.72);text-decoration:line-through">650 €</div>
        <div class="display" style="font-size:34pt;line-height:.9;color:#fff">0 €</div>
      </div>
      <div style="flex:1">
        <b style="font-size:11pt;color:#fff;line-height:1.2;display:block">Un coup de projecteur,<br>offert</b>
        <div style="font-size:8.2pt;line-height:1.42;color:rgba(255,255,255,.9);margin-top:2mm">
          Podcast avec votre dirigeant, interviews de vos équipes,
          page dédiée. <b style="color:#fff">Et on le diffuse.</b></div>
      </div>
    </div>

    <div style="background:#fff;border-radius:14px;padding:5.5mm 5.5mm 6mm;
                border:1px solid rgba(208,183,143,.55)">
      <div style="font-size:6.6pt;font-weight:800;letter-spacing:.15em;text-transform:uppercase;
                  color:var(--terra);margin-bottom:3.5mm">Comment ça se passe</div>
      <div style="display:flex;gap:4mm">
      ${ETAPES.map(
        ([n, t, s]) => `
        <div style="flex:1">
          <div class="display" style="font-size:19pt;color:var(--terra);line-height:1">${n}</div>
          <b style="font-size:9.4pt;display:block;margin-top:1.4mm">${t}</b>
          <div style="font-size:7.4pt;color:var(--ink-soft);line-height:1.3;margin-top:.8mm">${s}</div>
        </div>`,
      ).join("")}
      </div>
    </div>

    <div style="display:flex;gap:4.5mm;align-items:center;
                border-top:1.5px solid var(--line);padding-top:5mm">
      <div style="flex:1">
        <div class="display" style="font-size:15pt;line-height:1.08">Parlons-en.</div>
        <div style="font-size:8.8pt;line-height:1.5;margin-top:1.5mm">
          <b>axion-ia.com</b><br>contact@axion-ia.com<br>Grenoble · Auvergne-Rhône-Alpes</div>
      </div>
      <img src="${QUALIOPI}" alt="Certification Qualiopi" style="flex:none;height:14mm;display:block">
    </div>

    <div style="font-size:5.5pt;color:var(--ink-muted);line-height:1.35">
      AXION IA SAS · ELITE BUREAUX, boîte 53, 11 avenue Paul Verlaine, 38100 Grenoble ·
      SIREN 108 018 631 · Organisme de formation certifié Qualiopi, catégorie
      <b>Actions de formation</b>. Prise en charge OPCO selon votre situation.
    </div>
  </div>
</section>

</body></html>`;

  const nav = await chromium.launch();
  const page = await nav.newPage();
  await page.setContent(HTML, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);

  const polices = await page.evaluate(() => ({
    fraunces: document.fonts.check('40px "Fraunces"'),
    manrope: document.fonts.check('20px "Manrope"'),
  }));
  if (!polices.fraunces || !polices.manrope) {
    await nav.close();
    throw new Error(
      `polices de marque absentes (Fraunces=${polices.fraunces}, Manrope=${polices.manrope}).`,
    );
  }

  // Une image qui ne charge pas ARRETE le build : c'est ce qui a laisse le
  // logo Qualiopi casse pendant toute la vie de la page 45 du catalogue.
  const imagesMortes = await page.evaluate(() =>
    [...document.querySelectorAll("img")]
      .filter((i) => !i.naturalWidth)
      .map((i) => (i.getAttribute("alt") || "?").slice(0, 60)),
  );
  if (imagesMortes.length) {
    await nav.close();
    throw new Error(`${imagesMortes.length} image(s) ne chargent pas : ${imagesMortes.join(", ")}`);
  }

  // Un debordement sur un imprime = un texte coupe au massicot. Les decors de
  // fond (halo, arcs) sont EXCLUS : ils debordent par construction.
  const debords = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll(".p").forEach((p, i) => {
      const b = p.getBoundingClientRect();
      p.querySelectorAll(".in *").forEach((e) => {
        const r = e.getBoundingClientRect();
        if (r.height < 2 || r.width < 2) return;
        if (r.bottom > b.bottom - 1 || r.right > b.right - 1 || r.top < b.top + 1)
          out.push(`page ${i + 1} : « ${(e.textContent || "").trim().slice(0, 38)} »`);
      });
    });
    return [...new Set(out)];
  });
  if (debords.length) {
    await nav.close();
    throw new Error(
      `${debords.length} bloc(s) débordent :\n    ` + debords.slice(0, 6).join("\n    "),
    );
  }

  // Un flyer se lit a trois metres : on COMPTE les mots. Au-dela, ce n'est plus
  // un flyer mais une page de catalogue — le defaut exact de la v1, que Will a
  // vu immediatement. La garde chiffre ce que l'oeil avait tranche.
  const mots = await page.evaluate(() =>
    [...document.querySelectorAll(".p")].map(
      (p) => (p.innerText || "").trim().split(/\s+/).filter(Boolean).length,
    ),
  );

  await page.pdf({ path: SORTIE, printBackground: true, preferCSSPageSize: true });
  await nav.close();

  console.log(`Flyer A5 recto-verso : ${L} × ${H} mm (A5 148 × 210 + 3 mm de fond perdu)`);
  console.log(`  recto ${mots[0]} mots · verso ${mots[1]} mots (mentions légales comprises)`);
  if (mots[0] > 80) console.log(`  ⚠️  recto au-dessus de 80 mots : il redevient une page`);
  console.log(`  polices ✅ · aucune image cassée ✅ · aucun débordement ✅`);
  console.log(`  ${(fs.statSync(SORTIE).size / 1024).toFixed(0)} Ko — ${SORTIE}`);
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
