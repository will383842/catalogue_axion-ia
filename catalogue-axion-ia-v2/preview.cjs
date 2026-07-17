/* Aperçu rapide de pages précises : node preview.cjs 1 15 16  (index 1-based) */
const { chromium } = require('C:/Users/willi/Documents/Projets/Axion-IA/axionia/node_modules/playwright');
const path = require('path');
const wanted = process.argv.slice(2).map(Number);
const fileUrl = 'file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ deviceScaleFactor: 2.2 });
  const p = await ctx.newPage();
  await p.goto(fileUrl, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1200);
  const pages = await p.$$('.page');
  const idx = wanted.length ? wanted : pages.map((_, i) => i + 1);
  for (const n of idx) {
    if (!pages[n - 1]) { console.log('page', n, 'absente (total', pages.length + ')'); continue; }
    const f = `export/_preview-${String(n).padStart(2, '0')}.jpg`;
    await pages[n - 1].screenshot({ path: f, type: 'jpeg', quality: 90 });
    console.log('->', f);
  }
  console.log('total pages =', pages.length);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
