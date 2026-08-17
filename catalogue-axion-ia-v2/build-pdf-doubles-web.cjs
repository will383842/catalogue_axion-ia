/* =============================================================
   BUILD-PDF-DOUBLES-WEB — le PDF en doubles pages, pour la lecture en ligne.

   C'est le fichier servi à `axion-ia.com/catalogue/catalogue-axion-ia.pdf`.

   TROIS PDF, TROIS USAGES — ne pas les confondre :

     catalogue-axion-ia-CMYK.pdf            l'imprimeur. Pages une à une, dans
                                            l'ordre, en quadri, AVEC fond perdu.
                                            C'est lui qui fait l'imposition.
     catalogue-web.pdf                      le PDF à envoyer par mail. Pages une
                                            à une, /PageLayout laissant le
                                            lecteur afficher les doubles.
     catalogue-doubles-web.pdf  ← CE FICHIER  la lecture en ligne. Chaque page
                                            EST une double, sans fond perdu ni
                                            repère : ce que verra le lecteur
                                            du livret plié, rien de plus.

   POURQUOI PAS LE FICHIER DE RELECTURE (`build-planches.cjs`)

   Celui-là garde volontairement les traits de coupe et les 3 mm de fond perdu :
   il sert à contrôler l'objet imprimé. Sur le web, ces marques n'ont aucun sens
   et le fond perdu montre une page plus grande que l'objet réel. Ici on rogne.

   APPARIEMENT — celui du piqué à cheval :
       [1 seule]  (2|3)  (4|5) … (46|47)  [48 seule]
   Les paires à gauche, les impaires à droite. Bandes de section et folios sont
   en marge extérieure : à contretemps ils tomberaient contre la pliure.

   Usage : node build-pdf-doubles-web.cjs
   ============================================================= */
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const DIR = __dirname;
const SRC = "file:///" + path.join(DIR, "index.html").replace(/\\/g, "/");
const DEST = path.join(DIR, "export", "catalogue-doubles-web.pdf");

const L = 210, H = 297; // format FINI, fond perdu rogné

(async () => {
  const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage();
  await page.goto(SRC, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  const stats = await page.evaluate(({ L, H }) => {
    document.querySelectorAll(".trim, .foldline, .screen-only").forEach((e) => e.remove());

    const pages = [...document.querySelectorAll(".page")];
    if (pages.length % 2 !== 0) throw new Error(`${pages.length} pages : un livret est pair`);

    // Rogner le fond perdu SANS toucher au contenu : on garde la page à sa
    // taille de composition et on la décale de -3 mm dans une fenêtre de
    // 210 × 297 qui masque le débord. Redimensionner la page déplacerait tout.
    const enFenetre = (p) => {
      const f = document.createElement("div");
      f.style.cssText = `width:${L}mm;height:${H}mm;overflow:hidden;position:relative;flex:none`;
      p.style.margin = "-3mm 0 0 -3mm";
      p.style.boxShadow = "none";
      f.appendChild(p);
      return f;
    };

    const planches = [[pages[0]]];
    for (let i = 1; i < pages.length - 1; i += 2) planches.push([pages[i], pages[i + 1]]);
    planches.push([pages[pages.length - 1]]);

    const deck = document.querySelector(".deck");
    const neuf = document.createElement("div");
    neuf.className = "deck";
    planches.forEach((pp, idx) => {
      // Les couvertures sont CENTRÉES sur la planche, pas calées d'un côté par
      // une page blanche. Une 1re de couverture ne se présente pas avec une
      // page vide à sa gauche : elle se présente seule, au milieu. Idem pour
      // le dos. Les doubles intérieures, elles, occupent toute la largeur.
      const seule = pp.length === 1;
      const ligne = document.createElement("div");
      ligne.style.cssText =
        `display:flex;${seule ? "justify-content:center;" : ""}` +
        `width:${L * 2}mm;height:${H}mm;page-break-after:always;break-after:page;background:#fff`;
      pp.forEach((p) => ligne.appendChild(enFenetre(p)));
      neuf.appendChild(ligne);
    });
    deck.replaceWith(neuf);

    const st = document.createElement("style");
    st.textContent = `@page{size:${L * 2}mm ${H}mm;margin:0}
      body{background:#fff}
      .deck{display:block;gap:0;padding:0}
      .page{page-break-after:auto!important;break-after:auto!important;box-shadow:none!important}`;
    document.head.appendChild(st);

    return { planches: planches.length, pages: pages.length };
  }, { L, H });

  await page.waitForTimeout(800);
  await page.pdf({ path: DEST, printBackground: true, preferCSSPageSize: true });
  await browser.close();

  const mo = (fs.statSync(DEST).size / 1048576).toFixed(1);
  console.log(`PDF doubles pages (web) : ${stats.planches} planches pour ${stats.pages} pages — ${mo} Mo`);
  console.log(`  format ${L * 2} × ${H} mm, fond perdu rogné, sans repère de coupe`);
  console.log(`  ${DEST}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
