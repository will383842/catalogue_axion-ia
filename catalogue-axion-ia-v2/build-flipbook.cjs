/* =============================================================
   BUILD-FLIPBOOK — page web feuilletable du catalogue

   Génère export/flipbook.html : les 24 pages en aperçu allégé,
   inlinées en data URI (le CSP des artifacts bloque tout hôte
   externe, donc ni image ni police distante).

   Usage : node build-flipbook.cjs
   ============================================================= */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const DIR = __dirname;
const OUT = path.join(DIR, 'export');
const TMP = path.join(OUT, '_flip');
fs.mkdirSync(TMP, { recursive: true });
const fileUrl = 'file:///' + path.join(DIR, 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();
  // ~1060 px de large : net à l'écran, léger une fois en base64
  const ctx = await browser.newContext({ deviceScaleFactor: 1.0 });
  const page = await ctx.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);

  const els = await page.$$('.page');
  const imgs = [];
  for (let i = 0; i < els.length; i++) {
    const f = path.join(TMP, `p${String(i + 1).padStart(2, '0')}.jpg`);
    await els[i].screenshot({ path: f, type: 'jpeg', quality: 60 });
    imgs.push('data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64'));
  }
  await browser.close();

  const slides = imgs
    .map((src, i) => `<figure class="slide" id="p${i + 1}">
      <img src="${src}" alt="Catalogue Axion-IA — page ${i + 1} sur ${imgs.length}" loading="${i < 2 ? 'eager' : 'lazy'}">
    </figure>`)
    .join('\n    ');

  const html = `<title>Catalogue de formations IA — Axion-IA 2026·2027</title>
<style>
:root{
  --paper:#f7f1e4; --surface:#fffdf8; --edge:#ddcbaa;
  --ink:#221d18; --ink-2:#5c5147; --ink-3:#8a7c6c;
  --terra:#c24a1b; --shadow:rgba(60,44,28,.22);
}
@media (prefers-color-scheme:dark){
  :root{--paper:#181410;--surface:#231d17;--edge:#3b3128;--ink:#f3e9d8;--ink-2:#c0b09a;--ink-3:#8d7f6e;--terra:#e2703c;--shadow:rgba(0,0,0,.6)}
}
:root[data-theme="dark"]{--paper:#181410;--surface:#231d17;--edge:#3b3128;--ink:#f3e9d8;--ink-2:#c0b09a;--ink-3:#8d7f6e;--terra:#e2703c;--shadow:rgba(0,0,0,.6)}
:root[data-theme="light"]{--paper:#f7f1e4;--surface:#fffdf8;--edge:#ddcbaa;--ink:#221d18;--ink-2:#5c5147;--ink-3:#8a7c6c;--terra:#c24a1b;--shadow:rgba(60,44,28,.22)}

*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:ui-sans-serif,system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5}

header{max-width:1000px;margin:0 auto;padding:28px 20px 14px}
.eyebrow{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--terra);margin:0 0 8px}
h1{font-size:clamp(21px,3vw,28px);margin:0;letter-spacing:-.02em;text-wrap:balance}
header p{margin:8px 0 0;color:var(--ink-2);font-size:14px;max-width:62ch}

.viewer{position:relative;max-width:1000px;margin:0 auto;padding:0 20px}
.track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:18px;
  scrollbar-width:none;padding:10px 0 4px}
.track::-webkit-scrollbar{display:none}
.slide{flex:0 0 100%;scroll-snap-align:center;margin:0}
.slide img{width:100%;height:auto;display:block;border:1px solid var(--edge);
  box-shadow:0 16px 40px -20px var(--shadow);background:var(--surface)}

.bar{display:flex;align-items:center;justify-content:center;gap:14px;
  max-width:1000px;margin:0 auto;padding:14px 20px 4px}
button{font:inherit;font-size:14px;font-weight:600;color:var(--ink);background:var(--surface);
  border:1px solid var(--edge);border-radius:3px;padding:7px 15px;cursor:pointer}
button:hover:not(:disabled){border-color:var(--terra);color:var(--terra)}
button:disabled{opacity:.38;cursor:default}
button:focus-visible{outline:2px solid var(--terra);outline-offset:2px}
.count{font-size:14px;color:var(--ink-2);font-variant-numeric:tabular-nums;min-width:9ch;text-align:center}

footer{max-width:1000px;margin:0 auto;padding:22px 20px 60px;color:var(--ink-3);font-size:13px}
footer a{color:var(--terra)}
kbd{font:inherit;font-size:12px;border:1px solid var(--edge);border-radius:3px;padding:1px 5px;color:var(--ink-2)}
@media (prefers-reduced-motion:reduce){.track{scroll-behavior:auto}}
</style>

<header>
  <p class="eyebrow">Axion-IA · 2026-2027</p>
  <h1>Catalogue de formations IA</h1>
  <p>24 pages · 21 formations + 1 séminaire, par métier et par secteur. Faites défiler ou utilisez les flèches <kbd>←</kbd> <kbd>→</kbd>.</p>
</header>

<div class="bar">
  <button id="prev" aria-label="Page précédente">← Précédent</button>
  <span class="count"><span id="cur">1</span> / ${imgs.length}</span>
  <button id="next" aria-label="Page suivante">Suivant →</button>
</div>

<div class="viewer">
  <div class="track" id="track" tabindex="0" aria-label="Pages du catalogue">
    ${slides}
  </div>
</div>

<footer>
  Aperçu écran. Le PDF imprimeur (CMJN, fond perdu 3 mm) et la version web sont générés depuis la même source.
  Version téléchargeable : <a href="https://axion-ia.com/catalogue-formations-ia-axion-ia.pdf">axion-ia.com/catalogue-formations-ia-axion-ia.pdf</a>
</footer>

<script>
(function(){
  var track=document.getElementById('track'),cur=document.getElementById('cur'),
      prev=document.getElementById('prev'),next=document.getElementById('next'),
      slides=track.querySelectorAll('.slide'),n=slides.length,i=0;
  function go(k){i=Math.max(0,Math.min(n-1,k));slides[i].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});sync();}
  function sync(){cur.textContent=i+1;prev.disabled=i===0;next.disabled=i===n-1;}
  prev.addEventListener('click',function(){go(i-1)});
  next.addEventListener('click',function(){go(i+1)});
  document.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'){go(i-1)}else if(e.key==='ArrowRight'){go(i+1)}
  });
  var t;track.addEventListener('scroll',function(){
    clearTimeout(t);t=setTimeout(function(){
      i=Math.round(track.scrollLeft/(track.scrollWidth/n));sync();
    },90);
  });
  sync();
})();
</script>`;

  const out = path.join(OUT, 'flipbook.html');
  fs.writeFileSync(out, html);
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('flipbook.html :', (fs.statSync(out).size / 1048576).toFixed(2), 'Mo —', imgs.length, 'pages');
})().catch((e) => { console.error(e); process.exit(1); });
