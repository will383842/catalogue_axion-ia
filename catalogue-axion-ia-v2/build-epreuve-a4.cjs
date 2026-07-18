// Épreuve "maison" A4 exact (210×297, SANS fond perdu) — pour impression test
// sur imprimante de bureau, une feuille A4 par page. Crope 3 mm sur chaque bord
// du master RGB (= ce que fera le massicot de l'imprimeur). NE PAS envoyer à
// l'imprimeur : lui a besoin du master 216×303 avec fond perdu.
const { execFileSync } = require("child_process");
const fs = require("fs");

const GS = ["C:/Users/willi/gs10040/bin/gswin64c.exe"]
  .find((p) => fs.existsSync(p)) || "gswin64c";
const SRC = "export/catalogue-axion-ia-RGB.pdf";
const OUT = "export/catalogue-axion-ia-A4-epreuve-maison.pdf";
const BLEED_PT = 8.504; // 3 mm

execFileSync(GS, [
  "-o", OUT, "-sDEVICE=pdfwrite", "-dBATCH", "-dNOPAUSE",
  "-dDEVICEWIDTHPOINTS=595.276", "-dDEVICEHEIGHTPOINTS=841.890", "-dFIXEDMEDIA",
  "-c", `<</PageOffset [-${BLEED_PT} -${BLEED_PT}]>> setpagedevice`,
  "-f", SRC,
], { stdio: "inherit" });

console.log(`\nÉpreuve A4 (210×297, sans fond perdu) -> ${OUT}`);
console.log("Impression maison : « Taille réelle / 100 % » sur A4 (plus besoin de « Ajuster »).");
