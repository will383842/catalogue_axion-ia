/* =============================================================
   CHECK-TAC — audit du taux d'encre total (Total Area Coverage)
   du PDF CMJN, page par page.

   Le TAC = somme des 4 encres (C+M+J+N) sur un même point. Les
   grands aplats sombres (mocha #2a2520) convertis sans profil ICC
   peuvent dépasser la limite de l'imprimeur : l'encre ne sèche pas,
   maculage et décalque au façonnage.

   Limites usuelles : offset couché ~330 %, non couché ~300 %,
   presse numérique ~300 %. Seuil retenu ici : 320 % (marge).

   Méthode : Ghostscript rend le PDF CMJN en PAM 32 bits (4 octets
   par pixel = C,M,J,N) à 72 dpi, puis on somme les 4 canaux.
   72 dpi suffit : on cherche des aplats, pas du détail fin.

   Usage :
       node check-tac.cjs [chemin.pdf]     (défaut : export/catalogue-axion-ia-CMYK.pdf)
   Exit code 1 si une page dépasse le seuil.
   ============================================================= */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

const GS = 'C:/Users/willi/gs10040/bin/gswin64c.exe';
const SEUIL = 320; // % d'encre max toléré
const PDF = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, 'export', 'catalogue-axion-ia-CMYK.pdf');

if (!fs.existsSync(PDF)) {
  console.error('PDF introuvable :', PDF, '\n(lancer `node build.cjs` d\'abord)');
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tac-'));
try {
  // 1) Rendu CMJN brut, une image PAM par page
  execFileSync(GS, [
    '-q', '-dSAFER', '-dBATCH', '-dNOPAUSE',
    '-sDEVICE=pamcmyk32', '-r72', '-dUseCropBox',
    `-sOutputFile=${path.join(tmp, 'p-%03d.pam')}`, PDF,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });

  const files = fs.readdirSync(tmp).filter(f => f.endsWith('.pam')).sort();
  if (!files.length) throw new Error('Ghostscript n\'a produit aucune page.');

  let fail = false;
  const rows = [];

  for (const f of files) {
    const buf = fs.readFileSync(path.join(tmp, f));
    // En-tête PAM : lignes texte terminées par "ENDHDR\n", puis données brutes
    const start = buf.indexOf('ENDHDR\n') + 7;
    const hdr = buf.slice(0, start).toString('latin1');
    const w = +/WIDTH (\d+)/.exec(hdr)[1];
    const h = +/HEIGHT (\d+)/.exec(hdr)[1];
    const total = w * h;

    let max = 0;
    let over = 0;
    for (let p = start; p < start + total * 4; p += 4) {
      const t = buf[p] + buf[p + 1] + buf[p + 2] + buf[p + 3]; // 0..1020 = 0..400 %
      if (t > max) max = t;
      if (t > SEUIL * 255 / 100) over++;
    }

    const pct = max / 255 * 100;
    const overPct = over / total * 100;
    const ok = pct <= SEUIL;
    if (!ok) fail = true;
    rows.push({ page: +/(\d+)/.exec(f)[1], pct, overPct, ok });
  }

  rows.sort((a, b) => b.pct - a.pct); // pires pages en premier

  console.log('Page'.padEnd(8), 'TAC max'.padEnd(10), `% surface > ${SEUIL} %`);
  console.log('-'.repeat(42));
  for (const r of rows) {
    console.log(
      String(r.page).padStart(4).padEnd(8),
      (r.pct.toFixed(0) + ' %').padEnd(10),
      r.overPct.toFixed(2) + ' %' + (r.ok ? '  ✓' : '  ✗ dépasse ' + SEUIL + ' %'),
    );
  }
  console.log('-'.repeat(42));
  const pire = rows[0];
  console.log(
    fail
      ? `✗ ÉCHEC : page ${pire.page} monte à ${pire.pct.toFixed(0)} % d'encre (> ${SEUIL} %).\n` +
        '  Corriger l\'aplat le plus sombre (mocha) ou demander une séparation profilée FOGRA39 à l\'imprimeur.'
      : `✓ OK : TAC max ${pire.pct.toFixed(0)} % (page ${pire.page}), sous le seuil de ${SEUIL} %.`,
  );
  process.exit(fail ? 1 : 0);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
