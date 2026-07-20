/* =============================================================
   CHECK-OVERFLOW — détecte le texte rogné par le bas de page

   Les pages ont une hauteur fixe (303 mm) et `overflow:hidden`.
   Quand le contenu dépasse, il est coupé SILENCIEUSEMENT : à
   l'écran comme au PDF, la dernière ligne est tranchée en deux
   sans aucune erreur. C'est invisible tant qu'on ne regarde pas
   la page en question.

   Ce script ouvre index.html et compare, pour chaque `.page`,
   la hauteur réelle du contenu à la hauteur disponible, puis
   nomme l'élément fautif.

   Usage :
       node check-overflow.cjs [chemin.html]   (défaut : index.html)
   Accepte un fichier en argument : sert donc aussi pour les flyers.
   Exit code 1 si une page déborde.
   ============================================================= */
const path = require('path');
const { chromium } = require('playwright');

const target = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, 'index.html');
const fileUrl = 'file:///' + target.replace(/\\/g, '/');
const TOLERANCE = 1; // px — arrondis de rendu

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  const pages = await page.evaluate((TOL) => {
    // éléments qui débordent volontairement (fond perdu, repères de coupe)
    const BLEED = ['page__bg', 'trim', 'foldline', 'screen-only'];
    const out = [];

    const label = (el) => ({
      cls: (el.className || '').toString().split(/\s+/).filter(Boolean).slice(0, 2).join('.')
        || el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
    });

    document.querySelectorAll('.page').forEach((pg, i) => {
      const pr = pg.getBoundingClientRect();
      const culprits = [];

      // 1) contenu qui dépasse le bord bas de la page
      pg.querySelectorAll('*').forEach((el) => {
        if (BLEED.some((c) => el.classList.contains(c))) return;
        if (getComputedStyle(el).position === 'absolute') return; // footer, pastilles
        const r = el.getBoundingClientRect();
        if (!r.height) return;
        const past = r.bottom - pr.bottom;
        if (past > TOL) culprits.push({ past: Math.round(past), kind: 'page', ...label(el) });
      });

      // 2) conteneurs qui masquent leur propre débordement (overflow:hidden)
      //    — c'est le cas le plus vicieux : la page a l'air correcte, mais une
      //    carte tranche son texte en interne.
      const scan = pg.matches('.page') ? [pg, ...pg.querySelectorAll('*')] : [];
      scan.forEach((el) => {
        if (BLEED.some((c) => el.classList.contains(c))) return;
        const st = getComputedStyle(el);
        if (!/hidden|clip/.test(st.overflowY) && !/hidden|clip/.test(st.overflow)) return;
        const past = el.scrollHeight - el.clientHeight;
        if (past > TOL) culprits.push({ past: Math.round(past), kind: 'clip', ...label(el) });
      });

      culprits.sort((a, b) => b.past - a.past);
      out.push({ n: i + 1, worst: culprits[0] || null, count: culprits.length });
    });
    return out;
  }, TOLERANCE);

  await browser.close();

  const bad = pages.filter((p) => p.worst);
  const mm = (px) => (px * 25.4 / 96).toFixed(1);

  console.log('Page'.padEnd(7), 'Rogné'.padEnd(16), 'Cause'.padEnd(7), 'Élément');
  console.log('-'.repeat(84));
  if (!bad.length) {
    console.log('(aucun)');
  }
  for (const p of bad) {
    const w = p.worst;
    console.log(
      String(p.n).padStart(4).padEnd(7),
      `${w.past} px (${mm(w.past)} mm)`.padEnd(16),
      (w.kind === 'clip' ? 'carte' : 'page').padEnd(7),
      `.${w.cls} — « ${w.text}… »`,
    );
  }
  console.log('-'.repeat(78));
  console.log(
    bad.length
      ? `✗ ÉCHEC : ${bad.length} page(s) rognée(s) — le texte est coupé à l'impression.`
      : `✓ OK : aucune des ${pages.length} pages ne déborde.`,
  );
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
