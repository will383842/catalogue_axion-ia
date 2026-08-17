/* =============================================================
   RENDER-PAGES-WEB — une image par page, pour le feuilletoir.

   Même principe que `catalogue-kdp/render-pages.cjs` : on ne fait pas
   feuilleter un monolithe HTML, on pré-rend une image par page. L'animation
   ne porte alors que sur des <img> déjà décodées — une texture à transformer,
   pas un sous-arbre DOM.

   CE QUI CHANGE PAR RAPPORT AU LIVRE KDP

   Le livre est composé en doubles-pages : une image = une double. Ici chaque
   page est une page, et surtout elle porte 3 mm de FOND PERDU sur ses quatre
   côtés. Le fond perdu existe pour la coupe, pas pour l'écran : le lecteur
   doit voir la page TELLE QU'ELLE SERA UNE FOIS ROGNÉE, en 210 × 297 mm.
   On découpe donc les 3 mm avant d'enregistrer. Sans ça, le feuilletoir
   montrerait une page plus grande que l'objet imprimé, avec des aplats qui
   débordent sur les bords.

   APPARIEMENT — le manifeste marque `seule` la 1re et la 4e de couverture.
   Le feuilletoir apparie le reste (2|3), (4|5) … (46|47), c'est-à-dire
   (verso|recto) : l'appariement réel du livret piqué à cheval, où la page 1
   est un recto isolé. Poser les impaires à gauche collerait les bandes de
   section et les folios contre la pliure, alors qu'ils sont en marge
   EXTÉRIEURE.

   Usage  : node render-pages-web.cjs [largeurPage]
   Sortie : pages-web/p01.jpg … p48.jpg + pages-web/manifest.json
   ============================================================= */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const RACINES_SHARP = [
  path.join(__dirname, "node_modules", "sharp"),
  "C:/Users/willi/Bookforge/packages/fabrication/node_modules/sharp",
];
const sharp = (() => {
  for (const r of RACINES_SHARP) if (fs.existsSync(r)) return require(r);
  throw new Error("[render-pages-web] sharp introuvable");
})();

const DIR = __dirname;
const SRC = "file:///" + path.join(DIR, "index.html").replace(/\\/g, "/");
const OUT = path.join(DIR, "pages-web");

// Largeur d'affichage d'UNE page. On capture au double : un texte de catalogue
// rendu à 1× bave sur écran à forte densité.
const LARGEUR_PAGE = parseInt(process.argv[2] || "1000", 10);
const FACTEUR = 2;

const MM = 96 / 25.4; // px CSS par mm
const BLEED_MM = 3;

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 1200 },
    deviceScaleFactor: 2.4,
  });
  const page = await ctx.newPage();
  await page.goto(SRC, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  // Les repères de coupe sont un outil d'atelier : ils n'ont rien à faire
  // dans le feuilletoir public.
  await page.evaluate(() => {
    document.querySelectorAll(".trim, .foldline, .screen-only").forEach((e) => e.remove());
  });

  // ⚠️ `page.screenshot({clip})` ne capture que la FENÊTRE : dès la page 2 le
  // cadre demandé tombe hors de l'image et Playwright refuse. On capture donc
  // chaque page comme ÉLÉMENT — Playwright la fait défiler lui-même — puis on
  // découpe le fond perdu avec sharp, en proportion de la largeur réelle de
  // l'image plutôt qu'en pixels calculés à la main.
  const elements = await page.$$(".page");
  if (!elements.length) throw new Error("[render-pages-web] aucune page trouvée");

  const manifeste = [];
  for (let i = 0; i < elements.length; i++) {
    const n = i + 1;
    const num = String(n).padStart(2, "0");

    const brutAvecFondPerdu = await elements[i].screenshot({ type: "png" });
    const meta = await sharp(brutAvecFondPerdu).metadata();
    const marge = Math.round((meta.width * BLEED_MM) / 216); // 216 mm = page + fond perdu
    const brut = await sharp(brutAvecFondPerdu)
      .extract({
        left: marge,
        top: marge,
        width: meta.width - 2 * marge,
        height: meta.height - 2 * marge,
      })
      .png()
      .toBuffer();

    const nom = `p${num}.jpg`;
    const info = await sharp(brut)
      .resize({ width: LARGEUR_PAGE * FACTEUR, withoutEnlargement: true })
      .jpeg({ quality: 78, progressive: true, mozjpeg: true })
      .toFile(path.join(OUT, nom));

    const premiere = n === 1;
    const derniere = n === elements.length;
    manifeste.push({
      fichier: nom,
      // la 1re et la 4e de couverture ne portent pas de folio
      numero: premiere || derniere ? "" : num,
      cote: premiere ? "couverture" : derniere ? "dos de couverture" : n % 2 === 0 ? "gauche" : "droite",
      ...(premiere || derniere ? { seule: true } : {}),
      l: info.width,
      h: info.height,
    });
    process.stdout.write(`\r  ${n}/${elements.length} pages rendues`);
  }
  console.log("");

  await browser.close();

  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify({ largeurPage: LARGEUR_PAGE, pages: manifeste }, null, 1),
    "utf8",
  );

  const poids = manifeste.reduce((a, m) => a + fs.statSync(path.join(OUT, m.fichier)).size, 0);
  const p1 = manifeste[0];
  console.log(
    `[render-pages-web] ${manifeste.length} images, ${(poids / 1048576).toFixed(1)} Mo, ` +
      `${p1.l}×${p1.h} px (ratio ${(p1.h / p1.l).toFixed(4)} — A4 = 1.4143)`,
  );
  console.log(`  fond perdu de ${BLEED_MM} mm découpé : format fini 210 × 297 mm`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
