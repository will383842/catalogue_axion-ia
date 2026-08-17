/* =============================================================
   BUILD-OG — l'image d'aperçu quand on partage le lien du feuilletoir.

   POURQUOI

   `/fr/catalogue` porte deja une carte complete, generee par `/api/og` du site.
   `/catalogue/index.html` — le feuilletoir — n'a RIEN : ni `og:image`, ni
   `og:title`, ni carte Twitter. Colle dans WhatsApp, LinkedIn ou un mail, il
   s'affiche en lien nu. C'est le lien qu'on partage le plus, parce que c'est
   celui qui ouvre le catalogue.

   Un PDF, lui, ne peut JAMAIS porter d'apercu : aucun reseau ne lit les
   metadonnees d'un PDF. Le lien a partager reste donc une PAGE.

   CE QU'ON MONTRE

   Pas une carte generique de plus : la VRAIE couverture, ouverte sur une
   double. En vignette WhatsApp, on doit comprendre en un coup d'oeil que c'est
   un catalogue de 48 pages, pas un article de blog.

   COMMENT

   Rendu dans Chromium, comme le catalogue lui-meme : c'est le seul moyen
   d'avoir Fraunces et Manrope. Un rendu SVG par sharp retomberait sur les
   polices systeme et la carte ne serait plus dans la charte.

   Format 1200 x 630 — le standard Open Graph. WhatsApp recadre au carre au
   centre sur certaines versions : rien d'essentiel ne doit toucher les bords.

   Usage : node build-og.cjs
   ============================================================= */
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const DIR = __dirname;
const SORTIE = path.join(DIR, "export", "og-catalogue.jpg");
const L = 1200;
const H = 630;

// La couverture et une double interieure, en data URI : le rendu ne depend
// d'aucun chemin relatif au moment de la capture.
function dataURI(rel) {
  const f = path.join(DIR, rel);
  return "data:image/jpeg;base64," + fs.readFileSync(f).toString("base64");
}

const COUV = dataURI("pages-web/p01.jpg");
const G = dataURI("pages-web/p06.jpg");
const D = dataURI("pages-web/p07.jpg");

const HTML = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600&family=Manrope:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --ivory:#ece0c9; --sand:#e2d1b0; --ink:#1a1815; --ink-soft:#524b41;
    --terra:#c24a1b; --terra-bright:#ef6a2c; --mocha:#2a2520; --creme:#faf8f3;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:${L}px;height:${H}px;overflow:hidden;
    font-family:'Manrope',system-ui,sans-serif;
    background:var(--mocha);color:var(--creme);
    display:flex;align-items:stretch}

  /* Filet de marque a gauche : le meme que sur la couverture imprimee. */
  .filet{width:14px;flex:none;background:linear-gradient(180deg,var(--terra-bright),var(--terra))}

  .texte{flex:none;width:566px;padding:52px 30px 46px 46px;
    display:flex;flex-direction:column;justify-content:space-between}

  .pastille{display:inline-flex;align-items:center;gap:9px;align-self:flex-start;
    border:2px solid var(--terra-bright);border-radius:999px;padding:7px 17px 8px;
    background:rgba(250,248,243,.05)}
  .pastille .nom{font-family:'Fraunces',Georgia,serif;font-weight:700;font-size:25px;
    letter-spacing:-.01em;color:var(--creme)}
  .pastille .nom i{font-style:normal;color:var(--terra-bright)}
  .pastille .ext{font-size:12px;font-weight:700;color:var(--terra-bright);
    letter-spacing:.05em;padding-top:5px}

  .millesime{font-size:12.5px;font-weight:800;letter-spacing:.19em;
    color:var(--sand);text-transform:uppercase;margin:26px 0 12px}

  h1{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:56px;line-height:1.02;
    letter-spacing:-.022em;color:var(--creme)}
  h1 em{font-style:italic;color:var(--terra-bright);display:block}

  .trait{width:64px;height:4px;background:var(--terra-bright);border-radius:2px;margin:20px 0 17px}

  .familles{font-size:16.5px;line-height:1.5;color:var(--sand);max-width:470px}
  .familles b{color:var(--creme);font-weight:700}

  .pied{display:flex;align-items:center;gap:14px;font-size:15px;color:var(--sand)}
  .pied .site{font-weight:800;color:var(--creme);font-size:16.5px}
  .pied .sep{width:1px;height:17px;background:rgba(226,209,176,.35)}

  /* Le livre : une double ouverte, et la couverture posee devant. On doit
     comprendre « catalogue » sans lire un mot. */
  .scene{flex:1;position:relative;overflow:hidden;
    background:radial-gradient(120% 95% at 62% 42%, #3b342c 0%, #241f1a 62%, #1a1613 100%)}
  .double{position:absolute;top:100px;left:70px;display:flex;
    box-shadow:0 26px 58px rgba(0,0,0,.5);transform:rotate(-3.6deg)}
  .double img{width:180px;display:block}
  .couv{position:absolute;top:168px;left:254px;width:250px;
    box-shadow:0 30px 62px rgba(0,0,0,.62);transform:rotate(2.4deg);
    border-radius:2px;display:block}

  .badge{position:absolute;top:34px;right:32px;
    background:var(--terra);color:#fff;border-radius:999px;
    padding:9px 20px 10px;font-size:15px;font-weight:800;letter-spacing:.02em;
    box-shadow:0 8px 22px rgba(0,0,0,.4)}
</style></head><body>
  <div class="filet"></div>

  <div class="texte">
    <div>
      <div class="pastille"><span class="nom">Axion-<i>IA</i></span><span class="ext">.com</span></div>
      <div class="millesime">Catalogue 2026 · 2027</div>
      <h1>L'IA,<em>de l'idée à l'impact.</em></h1>
      <div class="trait"></div>
      <div class="familles">
        <b>21 formations</b> et un séminaire · <b>accompagnement 1-to-1</b> ·
        <b>audit IA</b> · <b>implémentation &amp; automatisation</b>
      </div>
    </div>
    <div class="pied">
      <span class="site">axion-ia.com</span>
      <span class="sep"></span>
      <span>Organisme de formation · Grenoble</span>
    </div>
  </div>

  <div class="scene">
    <div class="badge">48 pages · à feuilleter</div>
    <div class="double"><img src="${G}"><img src="${D}"></div>
    <img class="couv" src="${COUV}">
  </div>
</body></html>`;

(async () => {
  const dossier = path.dirname(SORTIE);
  fs.mkdirSync(dossier, { recursive: true });

  const nav = await chromium.launch();
  const page = await nav.newPage({ viewport: { width: L, height: H }, deviceScaleFactor: 2 });
  await page.setContent(HTML, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);

  // Les polices de marque doivent etre CHARGEES, sinon la carte sort en police
  // systeme et ne ressemble plus au catalogue. On le verifie au lieu de l'esperer.
  const polices = await page.evaluate(() => ({
    fraunces: document.fonts.check('40px "Fraunces"'),
    manrope: document.fonts.check('20px "Manrope"'),
  }));
  if (!polices.fraunces || !polices.manrope) {
    await nav.close();
    throw new Error(
      `polices de marque absentes du rendu (Fraunces=${polices.fraunces}, Manrope=${polices.manrope}) — ` +
        `la carte serait hors charte. Vérifier l'accès à fonts.googleapis.com.`,
    );
  }

  await page.screenshot({ path: SORTIE, type: "jpeg", quality: 88 });
  await nav.close();

  const ko = (fs.statSync(SORTIE).size / 1024).toFixed(0);
  console.log(`Image de partage : ${L} × ${H} (rendue en ×2) — ${ko} Ko`);
  console.log(`  polices de marque : Fraunces ✅  Manrope ✅`);
  console.log(`  ${SORTIE}`);
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
