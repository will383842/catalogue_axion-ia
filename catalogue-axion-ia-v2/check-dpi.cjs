/* =============================================================
   CHECK-DPI — audit de résolution effective des images du catalogue
   Ouvre index.html, mesure la taille affichée de chaque <img> et
   calcule les DPI effectifs à l'impression (object-fit:cover pris
   en compte : l'échelle retenue est celle du côté le plus étiré).
   Seuil imprimeur : 300 dpi. Usage :
       node check-dpi.cjs
   Exit code 1 si une photo passe sous 300 dpi.
   ============================================================= */
const path = require('path');
const { chromium } = require('C:/Users/willi/Documents/Projets/Axion-IA/axionia/node_modules/playwright');

const fileUrl = 'file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/');
const SEUIL = 300; // dpi minimum print

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  const imgs = await page.evaluate(() => {
    const out = [];
    for (const img of document.querySelectorAll('img')) {
      const r = img.getBoundingClientRect();
      if (!r.width || !r.height || !img.naturalWidth) continue;
      const fit = getComputedStyle(img).objectFit;
      const sx = r.width / img.naturalWidth;   // CSS px affichés par pixel image
      const sy = r.height / img.naturalHeight;
      // cover : mise à l'échelle uniforme par le côté le plus zoomé ; sinon pire axe
      const s = fit === 'cover' ? Math.max(sx, sy) : Math.max(sx, sy);
      out.push({
        src: img.getAttribute('src').replace('assets/', ''),
        natural: img.naturalWidth + 'x' + img.naturalHeight,
        printMm: (r.width * 25.4 / 96).toFixed(0) + 'x' + (r.height * 25.4 / 96).toFixed(0) + 'mm',
        dpi: Math.round(96 / s),
      });
    }
    return out;
  });
  await browser.close();

  // une ligne par asset : ne garder que le placement le plus exigeant (dpi min)
  const worst = new Map();
  for (const i of imgs) {
    if (!worst.has(i.src) || i.dpi < worst.get(i.src).dpi) worst.set(i.src, i);
  }

  let fail = false;
  console.log('Asset'.padEnd(24), 'Source px'.padEnd(12), 'Imprimé'.padEnd(10), 'DPI effectifs');
  console.log('-'.repeat(62));
  for (const i of [...worst.values()].sort((a, b) => a.dpi - b.dpi)) {
    const ok = i.dpi >= SEUIL;
    if (!ok) fail = true;
    console.log(i.src.padEnd(24), i.natural.padEnd(12), i.printMm.padEnd(10), i.dpi + (ok ? '  ✓' : '  ✗ < ' + SEUIL));
  }
  console.log('-'.repeat(62));
  console.log(fail ? '✗ ÉCHEC : au moins une image sous ' + SEUIL + ' dpi' : '✓ OK : toutes les images ≥ ' + SEUIL + ' dpi');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
