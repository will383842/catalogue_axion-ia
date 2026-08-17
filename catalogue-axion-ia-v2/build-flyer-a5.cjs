/* =============================================================
   BUILD-FLYER-A5 — le flyer recto-verso qui presente Axion-IA.

   Demande Will 2026-08-17 : « un flyer A5 qui presente axion-ia.com, ses
   5 activites, Qualiopi, financement OPCO jusqu'a 0 de cout entreprise,
   21 formations, le podcast, interviews etc a 0 au lieu de 650 ».

   LES CINQ ACTIVITES — lecture assumee

   Le catalogue s'est arrete a QUATRE familles : le seminaire y est un FORMAT
   de formation, pas une famille (recommandation d'audit appliquee). La
   cinquieme activite de ce flyer est donc la VISIBILITE OFFERTE — podcast,
   interviews, page entreprise, backlink. C'est bien une prestation qu'Axion-IA
   execute, c'est celle que Will veut mettre en avant a 0 EUR au lieu de 650, et
   ca garde le flyer en harmonie avec le catalogue. Si Will voulait plutot
   « formations / seminaire / 1-to-1 / audit / implementation », c'est une
   ligne a changer dans ACTIVITES.

   FORMAT

   A5 fini = 148 x 210 mm. Avec 3 mm de fond perdu sur chaque bord :
   154 x 216 mm. Deux pages : recto (l'accroche et l'argent), verso (les cinq
   activites et la preuve). Marge de securite de 8 mm — un flyer se massicote
   plus grossierement qu'un livret.

   LES FAITS VIENNENT DU CATALOGUE, PAS DE MA MEMOIRE

   Prix planchers, formulation OPCO, valeur des 650 EUR, mentions legales :
   tout est repris de `index.html`, lui-meme branche sur `pricing.ts`. Un
   controle compare les deux a la fin (`check-flyer.cjs`) : un flyer qui
   annonce un prix que le site ne pratique plus est pire qu'un flyer absent.

   LES QR SONT DYNAMIQUES

   `cat-catalogue` et `formations` existent deja en production et sont vivants.
   On ne cree pas de slug : leur destination se change dans la console sans
   reimprimer. Verifie au build par le decodeur, comme pour le catalogue.

   Usage : node build-flyer-a5.cjs
   ============================================================= */
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const { svgVerifie } = require("./lib-qr.cjs");

const DIR = __dirname;
const SORTIE = path.join(DIR, "export", "flyer-a5.pdf");

// ⚠️ `page.setContent()` ne donne AUCUNE URL de base a la page : un
// `src="assets/..."` relatif ne resout pas et l'image sort CASSEE. C'est
// exactement ce qui est arrive au logo Qualiopi de la page 45 du catalogue.
// On embarque donc les images en data URI.
function dataURI(rel, mime) {
  return `data:${mime};base64,` + fs.readFileSync(path.join(DIR, rel)).toString("base64");
}
const QUALIOPI = dataURI("assets/qualiopi-logo.png", "image/png");

const L = 154; // 148 + 3 + 3
const H = 216; // 210 + 3 + 3

// ── LES FAITS ───────────────────────────────────────────────────────────────
// Repris du catalogue. Toute modification se fait LA-BAS, puis ici.
const ACTIVITES = [
  {
    ic: "🎓",
    nom: "Formations IA",
    prix: "Dès 1 200 € HT",
    c: "var(--terra)",
    txt: "<b>21 formations</b> en intra-entreprise, présentiel ou distanciel — et le <b>séminaire IA</b>, une journée pour mettre jusqu'à 50 personnes au diapason.",
    detail: "4 générales · 9 par métier · 8 par secteur · 1 séminaire",
  },
  {
    ic: "🤝",
    nom: "Accompagnement 1-to-1",
    prix: "Dès 990 € HT",
    c: "var(--ochre)",
    txt: "Une personne, un expert, une journée sur <b>ses propres dossiers</b>. Rien de standardisé.",
    detail: "Dirigeant · collaborateur · suivi régulier",
  },
  {
    ic: "🔍",
    nom: "Audit IA",
    prix: "Dès 1 190 € HT",
    c: "var(--blue)",
    txt: "On cartographie vos usages, on <b>chiffre chaque opportunité</b> et on livre une feuille de route priorisée.",
    detail: "4 niveaux, de la TPE à l'ETI",
  },
  {
    ic: "🚀",
    nom: "Implémentation & automatisation",
    prix: "Dès 990 € HT",
    c: "var(--sage)",
    txt: "Le clé en main : on conçoit, on développe, on met en production. <b>Code et documentation livrés.</b>",
    detail: "Processus · chatbots · agents · données",
  },
  {
    ic: "🎙️",
    nom: "Visibilité offerte",
    prix: "0 € — offert",
    c: "var(--plum)",
    txt: "Podcast avec votre dirigeant, interviews de vos équipes, page dédiée + <b>backlink dofollow</b>. Inclus dans chaque formation.",
    detail: "Valeur 650 € · diffusion sponsorisée incluse",
  },
];

function bloc(a) {
  return `
  <div style="display:flex;gap:3mm;align-items:flex-start;padding:2.6mm 0;border-top:1px solid var(--line)">
    <div style="flex:none;width:8mm;height:8mm;border-radius:7px;background:#fff;
      border:1.6px solid ${a.c};
      display:flex;align-items:center;justify-content:center;font-size:10.5pt">${a.ic}</div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:3mm">
        <b style="font-size:10.4pt;line-height:1.15">${a.nom}</b>
        <span style="flex:none;font-size:8.6pt;font-weight:800;color:${a.c};white-space:nowrap">${a.prix}</span>
      </div>
      <div style="font-size:8.4pt;line-height:1.42;color:var(--ink-soft);margin-top:.7mm">${a.txt}</div>
      <div style="font-size:7.4pt;color:var(--ink-muted);margin-top:.6mm">${a.detail}</div>
    </div>
  </div>`;
}

(async () => {
  fs.mkdirSync(path.dirname(SORTIE), { recursive: true });

  // Les QR sont relus au decodeur AVANT d'entrer dans la page : un code
  // illisible imprime a 5 000 exemplaires ne se corrige pas.
  const qrCatalogue = await svgVerifie("cat-catalogue");
  const qrFormations = await svgVerifie("formations");
  const svgQr = (q, mm) =>
    `<svg viewBox="${q.viewBox}" width="${mm}mm" height="${mm}mm" shape-rendering="crispEdges" style="display:block">${q.paths}</svg>`;

  const HTML = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --ivory:#ece0c9; --paper:#fff; --sand:#e2d1b0;
    --mocha:#2a2520; --ink:#1a1815; --ink-soft:#524b41; --ink-muted:#6a5f52;
    --blue:#1a4dd9; --terra:#c24a1b; --terra-bright:#ef6a2c; --terra-soft:#f5e3d8;
    --sage:#5e6c54; --ochre:#b06a12; --plum:#7c4a63; --line:#d0b78f;
    --creme:#faf8f3;
  }
  @page{size:${L}mm ${H}mm;margin:0}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Manrope',system-ui,sans-serif;color:var(--ink);background:#f0eee9}
  .p{width:${L}mm;height:${H}mm;position:relative;overflow:hidden;
     page-break-after:always;break-after:page;background:var(--ivory)}
  .p:last-child{page-break-after:auto;break-after:auto}
  /* 3 mm de fond perdu + 8 mm de securite = 11 mm de retrait utile */
  .in{position:absolute;inset:11mm;display:flex;flex-direction:column}
  .display{font-family:'Fraunces',Georgia,serif;font-weight:600;letter-spacing:-.02em}
  .it{font-style:italic}
  .eyebrow{font-size:7.2pt;font-weight:800;letter-spacing:.17em;text-transform:uppercase;color:var(--terra)}
  .pastille{display:inline-flex;align-items:center;gap:5px;border:1.6px solid var(--terra);
    border-radius:999px;padding:2mm 4mm 2.2mm;background:#fff}
  .pastille b{font-family:'Fraunces',Georgia,serif;font-weight:700;font-size:12.5pt;letter-spacing:-.01em}
  .pastille b i{font-style:normal;color:var(--terra)}
  .pastille span{font-size:6.6pt;font-weight:800;color:var(--terra);letter-spacing:.05em;padding-top:2px}
</style></head><body>

<!-- ═══════════ RECTO — l'accroche et les deux arguments d'argent ═══════════ -->
<section class="p">
  <div class="in">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div class="pastille"><b>Axion-<i>IA</i></b><span>.com</span></div>
      <div style="text-align:right">
        <div class="eyebrow" style="color:var(--ink-muted)">2026 · 2027</div>
        <div style="font-size:7.4pt;color:var(--ink-muted);margin-top:.6mm">Organisme de formation<br><b>certifié Qualiopi</b></div>
      </div>
    </div>

    <div style="margin-top:9mm">
      <div class="eyebrow">L'IA en entreprise · Grenoble &amp; France</div>
      <h1 class="display" style="font-size:27pt;line-height:1.03;margin-top:2.5mm">L'IA,<br>
        <span class="it" style="color:var(--terra)">de l'idée à l'impact.</span></h1>
      <p style="font-size:9.6pt;line-height:1.5;color:var(--ink-soft);margin-top:3.5mm">
        Former vos équipes, accompagner une personne, auditer vos process, construire vos
        automatisations. <b>Un seul partenaire</b>, de l'idée à la mise en production.</p>
    </div>

    <!-- L'argument numero un : la formation peut ne rien couter. -->
    <div style="margin-top:7mm;background:var(--mocha);color:var(--creme);border-radius:12px;
                padding:5mm 5.5mm;display:flex;gap:5mm;align-items:center">
      <div style="flex:none;text-align:center">
        <div class="display" style="font-size:30pt;line-height:1;color:var(--terra-bright)">0 €</div>
        <div style="font-size:6.4pt;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
                    color:var(--sand);margin-top:1mm">Reste à charge<br>possible</div>
      </div>
      <div style="flex:1">
        <b style="font-size:10.6pt">Vos formations peuvent ne rien vous coûter</b>
        <div style="font-size:8.4pt;line-height:1.45;color:var(--sand);margin-top:1.4mm">
          Prises en charge par votre <b style="color:var(--creme)">OPCO</b>, en partie ou en totalité —
          vous avez déjà cotisé pour ça. <b style="color:var(--creme)">En subrogation, l'OPCO nous règle
          directement : vous n'avancez rien.</b> Nous montons le dossier de A à Z.</div>
      </div>
    </div>

    <!-- L'argument numero deux : la visibilite offerte. -->
    <div style="margin-top:4mm;background:var(--terra-soft);border:1.4px solid var(--terra);
                border-radius:12px;padding:4.5mm 5mm;display:flex;gap:4.5mm;align-items:center">
      <div style="flex:1">
        <div class="eyebrow" style="font-size:6.6pt">✦ Inclus dans chaque formation</div>
        <b class="display" style="font-size:13pt;display:block;margin-top:1.2mm">Un coup de projecteur, offert.</b>
        <div style="font-size:8.2pt;line-height:1.42;color:var(--ink-soft);margin-top:1.2mm">
          🎙️ Podcast avec votre dirigeant · interviews de vos équipes · page dédiée +
          <b>backlink dofollow</b>. Et nous le <b>diffusons</b> sur nos réseaux, budget publicitaire inclus.</div>
      </div>
      <div style="flex:none;text-align:center">
        <div style="font-size:8pt;color:var(--ink-muted);text-decoration:line-through;
                    text-decoration-color:var(--terra)">valeur 650 €</div>
        <div class="display" style="font-size:23pt;line-height:1;color:var(--terra)">0 €</div>
        <div style="font-size:6.4pt;font-weight:800;letter-spacing:.09em;color:var(--terra)">OFFERT</div>
      </div>
    </div>

    <div style="margin-top:auto;display:flex;gap:4mm;align-items:center;padding-bottom:4mm">
      <div style="flex:1;display:flex;gap:3mm">
        <div style="flex:1;background:#fff;border-radius:9px;padding:2.6mm 2mm;text-align:center;border:1px solid var(--line)">
          <div class="display" style="font-size:15pt;color:var(--terra);line-height:1">21</div>
          <div style="font-size:6.3pt;color:var(--ink-muted);line-height:1.25;margin-top:.5mm">formations<br>+ 1 séminaire</div>
        </div>
        <div style="flex:1;background:#fff;border-radius:9px;padding:2.6mm 2mm;text-align:center;border:1px solid var(--line)">
          <div class="display" style="font-size:15pt;color:var(--blue);line-height:1">12</div>
          <div style="font-size:6.3pt;color:var(--ink-muted);line-height:1.25;margin-top:.5mm">prestations<br>de conseil</div>
        </div>
        <div style="flex:1;background:#fff;border-radius:9px;padding:2.6mm 2mm;text-align:center;border:1px solid var(--line)">
          <div class="display" style="font-size:15pt;color:var(--sage);line-height:1">48 h</div>
          <div style="font-size:6.3pt;color:var(--ink-muted);line-height:1.25;margin-top:.5mm">un devis<br>chiffré</div>
        </div>
      </div>
      <img src="${QUALIOPI}" alt="Certification Qualiopi"
           style="flex:none;height:14mm;display:block">
    </div>

    <div style="display:flex;gap:4.5mm;align-items:center;
                border-top:1.5px solid var(--line);padding-top:4mm">
      <div style="flex:1">
        <b class="display" style="font-size:12.5pt;display:block">Le catalogue complet, 48 pages.</b>
        <div style="font-size:8.4pt;color:var(--ink-soft);line-height:1.45;margin-top:1.2mm">
          Toutes les offres, les programmes détaillés et les prix publics.<br>
          <b>axion-ia.com/catalogue</b></div>
      </div>
      <div style="flex:none;background:#fff;padding:1.6mm;border-radius:7px;border:1px solid var(--line)">
        ${svgQr(qrCatalogue, 19)}
      </div>
    </div>
  </div>
</section>

<!-- ═══════════ VERSO — les cinq activites et la preuve ═══════════ -->
<section class="p" style="background:var(--creme)">
  <div class="in">
    <div class="eyebrow">Nos cinq activités</div>
    <h2 class="display" style="font-size:18pt;line-height:1.06;margin-top:1.8mm">
      Cinq façons de <span class="it" style="color:var(--terra)">travailler ensemble.</span></h2>
    <p style="font-size:8.4pt;color:var(--ink-soft);line-height:1.45;margin-top:2mm">
      Vous n'avez pas à choisir tout de suite — on cadre ensemble en 30 minutes.</p>

    <div style="margin-top:3.5mm">
      ${ACTIVITES.map(bloc).join("")}
    </div>

    <div style="margin-top:4mm;background:#fff;border-radius:11px;padding:4mm 4.5mm;
                border:1px solid var(--line)">
      <div class="eyebrow" style="color:var(--ink-muted);font-size:6.6pt">Comment ça se passe</div>
      <div style="display:flex;gap:3.5mm;margin-top:2mm;font-size:7.9pt;line-height:1.35">
        <div style="flex:1"><b style="color:var(--terra)">1.</b> Un appel de 30 min,<br>sans engagement</div>
        <div style="flex:1"><b style="color:var(--terra)">2.</b> Un devis chiffré<br>sous 48 h</div>
        <div style="flex:1"><b style="color:var(--terra)">3.</b> On monte le dossier<br>OPCO de A à Z</div>
      </div>
    </div>

    <div style="margin-top:auto;display:flex;gap:4.5mm;align-items:flex-end;
                border-top:1.5px solid var(--line);padding-top:4mm">
      <div style="flex:1">
        <b class="display" style="font-size:12.5pt;display:block">Parlons de vos équipes.</b>
        <div style="font-size:8.4pt;line-height:1.6;margin-top:1.5mm">
          <b>axion-ia.com</b><br>
          contact@axion-ia.com<br>
          Grenoble · Auvergne-Rhône-Alpes</div>
      </div>
      <div style="flex:none;text-align:center">
        <div style="background:#fff;padding:1.6mm;border-radius:7px;border:1px solid var(--line)">
          ${svgQr(qrFormations, 17)}
        </div>
        <div style="font-size:6.2pt;color:var(--ink-muted);margin-top:1mm">Nos formations</div>
      </div>
    </div>

    <div style="font-size:5.9pt;color:var(--ink-muted);line-height:1.35;margin-top:3mm">
      <b>AXION IA SAS</b>, société par actions simplifiée · Siège social : ELITE BUREAUX — boîte 53,
      11 avenue Paul Verlaine, 38100 Grenoble · RCS Grenoble, SIREN 108 018 631 · TVA
      FR51 108 018 631 · Directeur de la publication : Williams Jullin, président.
      Organisme de formation certifié Qualiopi — la certification qualité a été délivrée au titre
      de la catégorie d'actions suivante : <b>Actions de formation</b>. Prix HT, par groupe de 2 à
      15 participants, hors frais de déplacement. Prise en charge OPCO selon votre situation.
    </div>
  </div>
</section>

</body></html>`;

  const nav = await chromium.launch();
  const page = await nav.newPage();
  await page.setContent(HTML, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);

  // Les polices de marque doivent etre CHARGEES. Sans elles le flyer sort en
  // police systeme et ne ressemble plus au catalogue — on echoue plutot que de
  // livrer un imprime hors charte sans le dire.
  const polices = await page.evaluate(() => ({
    fraunces: document.fonts.check('40px "Fraunces"'),
    manrope: document.fonts.check('20px "Manrope"'),
  }));
  if (!polices.fraunces || !polices.manrope) {
    await nav.close();
    throw new Error(
      `polices de marque absentes (Fraunces=${polices.fraunces}, Manrope=${polices.manrope}) — ` +
        `le flyer serait hors charte. Vérifier l'accès à fonts.googleapis.com.`,
    );
  }

  // Une image qui ne charge pas ARRETE le build. Passer outre en silence, c'est
  // ce qui a laisse le logo Qualiopi casse pendant toute la vie de la page 45
  // du catalogue : une image absente ne se mesure pas, donc aucun controle de
  // resolution ne pouvait la voir. Une absence n'est pas une conformite.
  const imagesMortes = await page.evaluate(() =>
    [...document.querySelectorAll("img")]
      .filter((i) => !i.naturalWidth)
      .map((i) => (i.getAttribute("alt") || i.getAttribute("src") || "?").slice(0, 60)),
  );
  if (imagesMortes.length) {
    await nav.close();
    throw new Error(`${imagesMortes.length} image(s) ne chargent pas : ${imagesMortes.join(", ")}`);
  }

  // Aucun bloc ne doit deborder de sa page : sur un imprime, un debordement
  // est un texte coupe au massicot.
  const debords = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll(".p").forEach((p, i) => {
      const b = p.getBoundingClientRect();
      p.querySelectorAll("*").forEach((e) => {
        const r = e.getBoundingClientRect();
        if (r.height < 2 || r.width < 2) return;
        if (r.bottom > b.bottom + 1 || r.right > b.right + 1 || r.top < b.top - 1)
          out.push(`page ${i + 1} : « ${(e.textContent || "").trim().slice(0, 40)} »`);
      });
    });
    return [...new Set(out)];
  });
  if (debords.length) {
    await nav.close();
    throw new Error(`${debords.length} bloc(s) débordent :\n    ` + debords.slice(0, 6).join("\n    "));
  }

  await page.pdf({ path: SORTIE, printBackground: true, preferCSSPageSize: true });
  await nav.close();

  const ko = (fs.statSync(SORTIE).size / 1024).toFixed(0);
  console.log(`Flyer A5 recto-verso : ${L} × ${H} mm (A5 148 × 210 + 3 mm de fond perdu) — ${ko} Ko`);
  console.log(`  polices de marque : Fraunces ✅  Manrope ✅`);
  console.log(`  QR relus au décodeur : cat-catalogue ✅  formations ✅`);
  console.log(`  aucune image cassée · aucun débordement`);
  console.log(`  ${SORTIE}`);
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
