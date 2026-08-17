/* =============================================================
   CHECK-FEUILLETOIR — le feuilletoir apparie-t-il comme le livre relie ?

   POURQUOI CETTE GARDE EXISTE

   `check-ordre.cjs` verifie le MANIFESTE : 48 images, dans l'ordre, cote
   gauche/droite correct. Tout etait vert. Mais le manifeste n'est qu'une
   liste : il ne dit rien de ce que le LECTEUR voit quand il navigue.

   Le saut direct (« aller a la page 45 ») affichait **45|46**. Un appariement
   que le livre n'a pas : en piqure a cheval, 45 se lit avec 44, et 46 avec 47.

   La cause : le calage se faisait sur la parite de l'INDEX en la traitant
   comme celle du FOLIO. `PAGES[0]` est la page 1, donc une double commence a
   un index IMPAIR. Le test etait ecrit pour le feuilletoir KDP, ou les
   couvertures sont des entrees separees et ou la parite est inversee.

   🔑 Verifier une LISTE ne verifie pas la NAVIGATION qui la parcourt.

   Ce controle rejoue les trois chemins qu'un lecteur emprunte vraiment :
     1. le saut direct, pour CHAQUE page de 1 a N
     2. la marche avant, du debut a la fin
     3. la marche arriere, de la fin au debut
   et exige que les trois donnent le meme decoupage en doubles.

   Il lit le HTML PRODUIT, pas le generateur : ce qui est publie fait foi.

   Usage : node check-feuilletoir.cjs [chemin/index.html]
   ============================================================= */
const fs = require("fs");
const path = require("path");

const cible = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "export", "feuilletoir", "index.html");
const html = fs.readFileSync(cible, "utf8");

let ko = 0;
const dire = (ok, msg) => {
  if (!ok) ko++;
  console.log(`${ok ? "✅" : "🔴"} ${msg}`);
};

// ── 1. Recuperer le tableau PAGES tel qu'il est ecrit dans la page ──────────
const mPages = html.match(/var PAGES\s*=\s*(\[[\s\S]*?\]);/);
if (!mPages) {
  console.log("🔴 tableau PAGES introuvable dans le feuilletoir");
  process.exit(1);
}
const PAGES = JSON.parse(mPages[1]);
const N = PAGES.length;
console.log(`=== ${N} pages dans le feuilletoir ===\n`);

// ── 2. L'appariement de reference, celui du livret relie ────────────────────
//   [1] (2|3) (4|5) … (N-2|N-1) [N]
// En index : [0] (1,2) (3,4) … (N-3,N-2) [N-1]
const ATTENDU = new Map(); // index de gauche → libelle
ATTENDU.set(0, "couverture seule");
for (let k = 1; k <= N - 3; k += 2) ATTENDU.set(k, `${k + 1}|${k + 2}`);
ATTENDU.set(N - 1, "dos seul");

console.log("=== 1. APPARIEMENT DE RÉFÉRENCE ===\n");
dire(N % 2 === 0, `${N} pages — un livret se compose en pages paires`);
dire(N % 4 === 0, `${N} pages — piqûre à cheval : multiple de 4`);
console.log(`   [1]  2|3  4|5 … ${N - 2}|${N - 1}  [${N}]`);

// Les deux seules pages « seules » doivent etre la 1re et la derniere.
const seules = PAGES.map((p, k) => (p.s ? k : -1)).filter((k) => k >= 0);
dire(
  seules.length === 2 && seules[0] === 0 && seules[1] === N - 1,
  seules.length === 2 && seules[0] === 0 && seules[1] === N - 1
    ? "exactement 2 pages seules : la 1re et la 4e de couverture"
    : `pages seules aux index ${seules.join(", ") || "aucun"} — attendu 0 et ${N - 1}`,
);

// ── 3. Le SAUT DIRECT, pour chaque page imprimee ────────────────────────────
// On rejoue la regle telle qu'elle est ECRITE dans la page publiee.
const mSaut = html.match(/if \(!MOBILE\(\) && !seule\(k\) && k % 2 === (\d)\) k -= 1;/);
console.log("\n=== 2. SAUT DIRECT « aller à la page N » ===\n");
if (!mSaut) {
  dire(false, "règle de calage du saut introuvable — le code a changé, relire allerA()");
} else {
  const parite = +mSaut[1];
  const seule = (k) => !!(PAGES[k] && PAGES[k].s);
  const indexDe = (n) => PAGES.findIndex((p) => p.n && parseInt(p.n, 10) === n);

  const faux = [];
  for (let n = 1; n <= N; n++) {
    const k0 = indexDe(n);
    if (k0 < 0) continue; // les couvertures ne portent pas de folio : pas de cible
    let k = k0;
    if (!seule(k) && k % 2 === parite) k -= 1;
    if (!ATTENDU.has(k)) {
      faux.push(`p.${n} → double commençant à l'index ${k}, qui n'est le début d'aucune double`);
      continue;
    }
    // la page demandee doit etre DANS la double affichee
    const dans = k === k0 || k + 1 === k0;
    if (!dans) faux.push(`p.${n} → affiche ${ATTENDU.get(k)}, qui ne la contient pas`);
  }
  dire(
    faux.length === 0,
    faux.length
      ? `${faux.length} saut(s) faux :\n     ` + faux.slice(0, 6).join("\n     ") +
        (faux.length > 6 ? `\n     … et ${faux.length - 6} autres` : "")
      : `les ${N - 2} sauts directs tombent sur la double qui contient la page`,
  );
}

// ── 4. LA MARCHE AVANT et ARRIÈRE ───────────────────────────────────────────
// `pas()` avance de 1 quand la page courante OU sa voisine est seule, de 2 sinon.
console.log("\n=== 3. MARCHE AVANT ET ARRIÈRE ===\n");
const seule = (k) => !!(PAGES[k] && PAGES[k].s);
const pas = (i) => (seule(i) || seule(i + 1) ? 1 : 2);

const avant = [];
for (let i = 0; i < N; ) {
  avant.push(i);
  const p = pas(i);
  if (i + p >= N) break;
  i += p;
}
const horsAvant = avant.filter((k) => !ATTENDU.has(k));
dire(
  horsAvant.length === 0,
  horsAvant.length
    ? `la marche avant s'arrête sur ${horsAvant.length} position(s) qui ne sont pas des débuts de double : ${horsAvant.join(", ")}`
    : `la marche avant parcourt ${avant.length} vues, toutes des débuts de double`,
);
dire(
  avant.length === ATTENDU.size,
  avant.length === ATTENDU.size
    ? `${avant.length} vues — autant que de doubles attendues`
    : `${avant.length} vues pour ${ATTENDU.size} doubles attendues : une vue est sautée ou dupliquée`,
);
dire(
  avant[avant.length - 1] === N - 1,
  avant[avant.length - 1] === N - 1
    ? "la marche avant atteint bien la 4e de couverture"
    : `la marche avant s'arrête à l'index ${avant[avant.length - 1]}, la 4e de couverture (${N - 1}) est INATTEIGNABLE`,
);

// Arriere : on rejoue la regle telle qu'elle est ECRITE dans la page publiee,
// jamais une regle que ce controle aurait reinventee. Un controle qui simule sa
// propre idee du code ne teste que lui-meme.
const mArr = html.match(/function pasArriere\(\) \{ return \(MOBILE\(\) \|\| seule\(i - 1\) \|\| seule\(i - 2\)\) \? 1 : 2; \}/);
const pasArr = mArr
  ? (i) => (seule(i - 1) || seule(i - 2) ? 1 : 2)
  : (i) => (seule(i) || seule(i + 1) ? 1 : 2); // ancienne version : `pas()` reutilise a l'envers
if (!mArr) console.log("   ⚠️  pasArriere() absent : la marche arrière réutilise le pas AVANT");
// Miroir exact de precedent() : il s'arrete sur `i <= 0` et borne par
// Math.max(0, ...). Simuler autrement fabrique un 0 en double.
const arriere = [];
let iA = N - 1;
while (iA > 0) {
  arriere.push(iA);
  iA = Math.max(0, iA - pasArr(iA));
}
arriere.push(0);
arriere.reverse();
const memeChemin = JSON.stringify(arriere) === JSON.stringify(avant);
dire(
  memeChemin,
  memeChemin
    ? "la marche arrière repasse exactement par les mêmes vues"
    : `aller et retour divergent :\n     aller  ${avant.join(",")}\n     retour ${arriere.join(",")}`,
);

// ── 5. Le libellé annoncé correspond-il aux pages montrées ? ────────────────
console.log("\n=== 4. LIBELLÉS ===\n");
// Retirer les COMMENTAIRES avant de chercher : celui qui documente ce piege
// contient « couv1.jpg », et le controle se declarait rouge sur sa propre
// explication. Un test statique trouve ses propres commentaires.
const sansCommentaires = html
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/^\s*\/\/.*$/gm, " ")
  .replace(/\/\*[\s\S]*?\*\//g, " ");
const dosSurCouv = /couv1\.jpg|couv\d/.test(sansCommentaires);
dire(!dosSurCouv, dosSurCouv ? "un test porte sur un NOM DE FICHIER de couverture — piège KDP" : "aucun test sur un nom de fichier de couverture");

console.log(ko === 0 ? "\n=== ✅ feuilletoir vérifié — appariement conforme au livret ===" : `\n=== 🔴 ${ko} anomalie(s) ===`);
process.exit(ko === 0 ? 0 : 1);
