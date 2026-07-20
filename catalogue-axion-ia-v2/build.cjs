/* =============================================================
   BUILD catalogue Axion-IA — pipeline complet
   1) Playwright  : index.html -> PDF RGB (vectoriel) + JPEG 300 dpi (aperçu net)
   2) Ghostscript : PDF RGB -> PDF CMJN (pour l'imprimeur)
   3) Ghostscript : PDF CMJN -> JPEG soft-proof (pour VOIR le rendu CMJN)
   Source de vérité = index.html. Après toute modif du HTML, relancer :
       node build.cjs
   ============================================================= */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const GS = 'C:/Users/willi/gs10040/bin/gswin64c.exe';
const DIR = __dirname;
const OUT = path.join(DIR, 'export');
const PROOF = path.join(OUT, 'apercu-cmyk');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(PROOF, { recursive: true });
const fileUrl = 'file:///' + path.join(DIR, 'index.html').replace(/\\/g, '/');
const RGB_PDF = path.join(OUT, 'catalogue-axion-ia-RGB.pdf');
const CMYK_PDF = path.join(OUT, 'catalogue-axion-ia-CMYK.pdf');

(async () => {
  const browser = await chromium.launch();

  // 1a) PDF RGB vectoriel (taille CSS 216×303 mm, fond perdu inclus)
  const c1 = await browser.newContext();
  const p1 = await c1.newPage();
  await p1.goto(fileUrl, { waitUntil: 'networkidle' });
  await p1.evaluate(() => document.fonts.ready);
  await p1.waitForTimeout(1200);
  await p1.pdf({ path: RGB_PDF, printBackground: true, preferCSSPageSize: true });
  console.log('1) PDF RGB   ->', path.basename(RGB_PDF));
  await c1.close();

  // 1b) JPEG 300 dpi (aperçu net à l'écran, RGB)
  const c2 = await browser.newContext({ deviceScaleFactor: 3.125 });
  const p2 = await c2.newPage();
  await p2.goto(fileUrl, { waitUntil: 'networkidle' });
  await p2.evaluate(() => document.fonts.ready);
  await p2.waitForTimeout(1200);
  const pages = await p2.$$('.page');
  for (let i = 0; i < pages.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    await pages[i].screenshot({ path: path.join(OUT, `page-${n}.jpg`), type: 'jpeg', quality: 92 });
  }
  console.log('   JPEG 300dpi RGB ->', pages.length, 'pages (page-XX.jpg)');
  await browser.close();

  // 2) PDF RGB -> PDF CMJN (Ghostscript, tout vectoriel préservé, polices ré-embarquées)
  execFileSync(GS, [
    '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dNOCACHE',
    '-sDEVICE=pdfwrite',
    '-dPDFSETTINGS=/prepress',
    '-dCompatibilityLevel=1.4',
    '-dColorConversionStrategy=/CMYK',
    '-dProcessColorModel=/DeviceCMYK',
    '-dConvertCMYKImagesToRGB=false',
    '-dAutoRotatePages=/None',
    '-dEmbedAllFonts=true', '-dSubsetFonts=true',
    '-dDownsampleColorImages=false', '-dDownsampleGrayImages=false', '-dDownsampleMonoImages=false',
    `-sOutputFile=${CMYK_PDF}`, RGB_PDF,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log('2) PDF CMJN  ->', path.basename(CMYK_PDF));

  // 3) PDF CMJN -> JPEG soft-proof (voir le rendu CMJN à l'écran)
  execFileSync(GS, [
    '-dSAFER', '-dBATCH', '-dNOPAUSE',
    '-sDEVICE=jpeg', '-r150', '-dJPEGQ=88', '-dUseCropBox',
    `-sOutputFile=${path.join(PROOF, 'page-%02d.jpg')}`, CMYK_PDF,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log('3) Aperçus CMJN ->', 'export/apercu-cmyk/page-XX.jpg');

  // Récap
  const mb = f => (fs.statSync(f).size / 1048576).toFixed(1) + ' Mo';
  console.log('\n=== Livrables ===');
  console.log('  PDF CMJN (imprimeur) :', path.basename(CMYK_PDF), mb(CMYK_PDF));
  console.log('  PDF RGB  (écran)     :', path.basename(RGB_PDF), mb(RGB_PDF));
  console.log('  JPEG 300dpi RGB      : export/page-01..20.jpg');
  console.log('  Aperçus CMJN         : export/apercu-cmyk/page-01..20.jpg');
})().catch(e => { console.error(e); process.exit(1); });
