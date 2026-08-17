/* =============================================================
   BUILD-PLANCHES — PDF de VÉRIFICATION, en doubles pages réelles.

   POURQUOI, EN PLUS DU PDF NORMAL

   Le PDF livré porte `/PageLayout /TwoPageRight` : les lecteurs de bureau
   AFFICHENT les doubles pages. Mais c'est une préférence — un lecteur réglé
   à la main sur « une seule page » l'ignore, et on ne contrôle rien.

   Ici, chaque page du PDF EST une planche : deux pages A4 côte à côte,
   physiquement. Rien ne dépend du lecteur. C'est le document sur lequel on
   vérifie ce que le lecteur verra une fois le livret plié :

       planche 1  :  [        1 ]   ← 1re de couverture, seule à droite
       planche 2  :  [ 2  |  3 ]
       …
       planche 24 :  [46  | 47 ]
       planche 25 :  [48        ]   ← 4e de couverture, seule à gauche

   C'est exactement le feuilletage d'un livret piqué à cheval : la page 1 est
   un recto isolé, et 2|3, 4|5 … se font face une fois le cahier plié.
   Une fiche importante qui tombe sur une page de gauche isolée perd sa force :
   c'est ce que ce fichier permet de voir.

   ⚠️ NE PAS ENVOYER CE FICHIER À L'IMPRIMEUR. L'imprimeur veut les pages une
   à une, dans l'ordre (`catalogue-axion-ia-CMYK.pdf`) ; c'est lui qui fait
   l'imposition. Ce PDF-ci sert à relire, pas à produire.

   Usage : node build-planches.cjs
   Sortie : export/catalogue-planches-verification.pdf
   ============================================================= */
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const DIR = __dirname;
const SRC = "file:///" + path.join(DIR, "index.html").replace(/\\/g, "/");
const DEST = path.join(DIR, "export", "catalogue-planches-verification.pdf");

// Page de travail : 216 × 303 mm (A4 + 3 mm de fond perdu par côté).
const L = 216, H = 303;

(async () => {
  const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage();
  await page.goto(SRC, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);

  const total = await page.evaluate(() => document.querySelectorAll(".page").length);
  if (total % 2 !== 0) {
    console.error(`🔴 ${total} pages : un livret se compose en pages paires.`);
    process.exit(1);
  }

  // Regroupe les pages par planches, en respectant la piqûre à cheval :
  // la 1re seule, puis (2,3) (4,5) …, puis la dernière seule.
  const stats = await page.evaluate(
    ({ L, H }) => {
      const pages = [...document.querySelectorAll(".page")];
      const deck = document.querySelector(".deck");

      const planches = [[pages[0]]];
      for (let i = 1; i < pages.length - 1; i += 2) planches.push([pages[i], pages[i + 1]]);
      planches.push([pages[pages.length - 1]]);

      // On reconstruit le deck : une planche = une rangée de 2 emplacements,
      // l'emplacement vide gardant sa largeur pour que la page seule reste
      // du bon côté (à droite pour la couverture, à gauche pour le dos).
      const neuf = document.createElement("div");
      neuf.className = "deck";
      planches.forEach((pp, idx) => {
        const ligne = document.createElement("div");
        ligne.style.cssText = `display:flex;width:${L * 2}mm;height:${H}mm;page-break-after:always;break-after:page`;
        const vide = () => {
          const d = document.createElement("div");
          d.style.cssText = `width:${L}mm;height:${H}mm;background:#8a8378`;
          return d;
        };
        if (idx === 0) ligne.appendChild(vide());
        pp.forEach((p) => {
          p.style.boxShadow = "none";
          ligne.appendChild(p);
        });
        if (idx === planches.length - 1) ligne.appendChild(vide());
        neuf.appendChild(ligne);
      });
      deck.replaceWith(neuf);

      // Le trait de coupe reste utile ici : on relit, on n'imprime pas.
      const st = document.createElement("style");
      st.textContent = `@page{size:${L * 2}mm ${H}mm;margin:0}
        body{background:#8a8378}
        .deck{display:block;gap:0;padding:0}
        .page{page-break-after:auto!important;break-after:auto!important}`;
      document.head.appendChild(st);

      return { planches: planches.length, pages: pages.length };
    },
    { L, H },
  );

  await page.waitForTimeout(600);
  await page.pdf({ path: DEST, printBackground: true, preferCSSPageSize: true });
  await browser.close();

  const mo = (fs.statSync(DEST).size / 1048576).toFixed(1);
  console.log(`Planches de vérification : ${stats.planches} planches pour ${stats.pages} pages — ${mo} Mo`);
  console.log(`  ${DEST}`);
  console.log(`  planche 1 : couverture seule à droite · planche ${stats.planches} : 4e de couverture seule à gauche`);
  console.log(`  ⚠️ document de RELECTURE — ne pas envoyer à l'imprimeur`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
