/* =============================================================
   PDF-DOUBLES-PAGES — affiche le PDF en doubles pages, couvertures seules.

   CE QUE ÇA FAIT

   Ajoute `/PageLayout /TwoPageRight` au catalogue du PDF. Les lecteurs qui
   l'honorent affichent alors :

       [ 1 ]        seule, à droite   ← 1re de couverture
       [ 2 | 3 ]    double
       [ 4 | 5 ]    double
        …
       [46 | 47]    double
       [48]         seule             ← 4e de couverture

   C'est exactement le feuilletage réel d'un livret piqué à cheval : la page 1
   est un recto isolé, et les paires (2,3), (4,5)… se font physiquement face.
   `TwoPageRight` — et non `TwoPageLeft` — est ce qui place les pages IMPAIRES
   à droite ; l'inverse donnerait des doubles pages qui n'existent pas dans
   l'objet imprimé.

   CE QUE ÇA NE FAIT PAS, ET POURQUOI

   Un PDF ne peut pas se comporter différemment selon l'appareil : il n'y a pas
   de média-requête dans le format. `/PageLayout` est une PRÉFÉRENCE que le
   lecteur applique s'il le peut. En pratique les lecteurs de bureau (Acrobat,
   Aperçu, Chrome, Edge) l'honorent ; les lecteurs mobiles retombent d'eux-mêmes
   sur une page à la fois, faute de largeur. Le résultat demandé est donc obtenu,
   mais par le lecteur, pas par le fichier — et un lecteur de bureau réglé
   manuellement sur « une seule page » restera sur une seule page.

   Pour un vrai comportement responsive, c'est le feuilletoir web qu'il faut
   (axion-ia.com/catalogue), pas le PDF.

   COMMENT

   Par MISE À JOUR INCRÉMENTALE : on réécrit l'objet catalogue à la fin du
   fichier, suivi d'une nouvelle table xref et d'un trailer qui pointe l'ancienne
   par /Prev. Aucun octet existant n'est modifié, donc aucun décalage d'offset —
   et surtout on ne repasse pas le PDF dans Ghostscript, qui casserait la table
   ToUnicode et rendrait le copier-coller illisible (cf. build-webpdf.cjs).

   Usage : node pdf-doubles-pages.cjs [chemin.pdf]   (défaut : export/catalogue-web.pdf)
   ============================================================= */
const fs = require("fs");
const path = require("path");

const cible = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "export", "catalogue-web.pdf");

const buf = fs.readFileSync(cible);
const s = buf.toString("latin1");

// --- garde : on ne sait traiter que les xref classiques (pas les flux xref)
if (/\/Type\s*\/XRef/.test(s)) {
  console.error("🔴 ce PDF utilise un flux de références croisées — cas non traité ici.");
  process.exit(1);
}
if (/\/PageLayout/.test(s)) {
  console.log("· /PageLayout déjà présent, rien à faire.");
  process.exit(0);
}

// --- trailer courant
const trailer = s.slice(s.lastIndexOf("trailer"));
const root = trailer.match(/\/Root\s+(\d+)\s+(\d+)\s+R/);
const size = trailer.match(/\/Size\s+(\d+)/);
const info = trailer.match(/\/Info\s+(\d+)\s+(\d+)\s+R/);
const startxref = s.slice(s.lastIndexOf("startxref")).match(/startxref\s+(\d+)/);
if (!root || !size || !startxref) {
  console.error("🔴 trailer illisible (Root / Size / startxref).");
  process.exit(1);
}
const numRoot = Number(root[1]);

// --- dictionnaire du catalogue, tel qu'il est aujourd'hui
const reObj = new RegExp(`(?:^|[^0-9])${numRoot}\\s+0\\s+obj\\b`, "g");
let m, posObj = -1;
while ((m = reObj.exec(s))) posObj = m.index + m[0].indexOf(String(numRoot));
if (posObj === -1) {
  console.error(`🔴 objet catalogue ${numRoot} introuvable.`);
  process.exit(1);
}
const finObj = s.indexOf("endobj", posObj);
const corps = s.slice(posObj, finObj);
const dict = corps.slice(corps.indexOf("<<") + 2, corps.lastIndexOf(">>"));
if (!/\/Type\s*\/Catalog/.test(corps)) {
  console.error(`🔴 l'objet ${numRoot} n'est pas un /Catalog — on s'arrête.`);
  process.exit(1);
}

// --- mise à jour incrémentale
const eol = "\n";
let ajout = eol;
const offsetNouvelObjet = buf.length + ajout.length;
ajout += `${numRoot} 0 obj${eol}<<${dict.trim()}${eol}/PageLayout /TwoPageRight${eol}/PageMode /UseNone>>${eol}endobj${eol}`;

const offsetXref = buf.length + ajout.length;
// entrées de 20 octets exactement : 10 chiffres, espace, 5 chiffres, espace, n, espace, \n
const entree = (o) => String(o).padStart(10, "0") + " 00000 n \n";
ajout += `xref${eol}0 1${eol}0000000000 65535 f \n${numRoot} 1${eol}${entree(offsetNouvelObjet)}`;
ajout +=
  `trailer${eol}<</Size ${size[1]}${eol}/Root ${numRoot} 0 R` +
  (info ? `${eol}/Info ${info[1]} ${info[2]} R` : "") +
  `${eol}/Prev ${startxref[1]}>>${eol}startxref${eol}${offsetXref}${eol}%%EOF${eol}`;

fs.writeFileSync(cible, Buffer.concat([buf, Buffer.from(ajout, "latin1")]));

const ko = (fs.statSync(cible).size - buf.length);
console.log(`✅ ${path.basename(cible)} — /PageLayout /TwoPageRight ajouté (+${ko} octets)`);
console.log(`   objet catalogue ${numRoot} réécrit en mise à jour incrémentale, /Prev ${startxref[1]}`);
console.log(`   affichage : p.1 seule · (2-3) (4-5) … (46-47) · p.48 seule`);
