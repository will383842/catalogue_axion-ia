/* =============================================================
   BUILD-WEBPDF — PDF web du catalogue (celui hébergé sur le site)

   ⚠️ NE PAS repasser ce PDF par Ghostscript.

   Ghostscript pdfwrite ré-encode les polices et perd la table
   ToUnicode sur une partie du texte : le PDF reste visuellement
   parfait, mais le copier-coller ressort du charabia
   (« Toute l'équipe » -> « /]lkHçYáIglPeH »). Ça dégrade
   l'accessibilité et l'indexation Google du PDF public.
   Testé : -dSubsetFonts=false n'y change rien.

   On garde donc le PDF de Playwright (texte propre) et on réduit
   le poids en ré-échantillonnant les images DANS la page, via
   canvas, avant l'impression. Les SVG (logos, QR) sont laissés
   intacts : vectoriels et déjà légers.

   Usage : node build-webpdf.cjs
   ============================================================= */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const DIR = __dirname;
const OUT = path.join(DIR, 'export');
const fileUrl = 'file:///' + path.join(DIR, 'index.html').replace(/\\/g, '/');
const DEST = path.join(OUT, 'catalogue-web.pdf');

const MAX_W = 1500; // px — largeur max des photos dans le PDF web
const QUALITY = 0.72;

(async () => {
  // --allow-file-access-from-files : sans ça, les images en file:// « teintent »
  // le canvas et toDataURL est refusé (SecurityError).
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);

  const stats = await page.evaluate(async ({ MAX_W, QUALITY }) => {
    const imgs = [...document.querySelectorAll('img')]
      .filter((i) => !/\.svg$/i.test(i.getAttribute('src') || ''));
    let done = 0;
    const seen = new Map(); // même fichier réutilisé -> une seule conversion

    for (const img of imgs) {
      const key = img.getAttribute('src');
      if (seen.has(key)) { img.src = seen.get(key); done++; continue; }
      if (!img.naturalWidth) continue;
      const scale = Math.min(1, MAX_W / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0, w, h);

      // Une image à transparence (logo Qualiopi, logo Axion-IA) convertie en
      // JPEG perd son canal alpha : le fond transparent devient NOIR. On teste
      // donc la présence d'alpha et on garde le PNG dans ce cas.
      let hasAlpha = false;
      try {
        const d = g.getImageData(0, 0, w, h).data;
        for (let k = 3; k < d.length; k += 4) { if (d[k] < 255) { hasAlpha = true; break; } }
      } catch (e) { hasAlpha = true; } // en cas de doute, on ne dégrade pas

      const url = hasAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', QUALITY);
      seen.set(key, url);
      img.src = url;
      done++;
    }
    // attendre que les nouvelles sources soient décodées
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : i.decode().catch(() => {}))));
    return { converted: done, unique: seen.size };
  }, { MAX_W, QUALITY });

  await page.waitForTimeout(1200);
  await page.pdf({ path: DEST, printBackground: true, preferCSSPageSize: true });
  await browser.close();

  const mb = (fs.statSync(DEST).size / 1048576).toFixed(1);
  console.log(`images ré-échantillonnées : ${stats.converted} (${stats.unique} fichiers uniques)`);
  console.log(`PDF web : ${path.basename(DEST)} — ${mb} Mo`);
  console.log('texte : issu de Playwright, non retraité (copier-coller intact)');
})().catch((e) => { console.error(e); process.exit(1); });
