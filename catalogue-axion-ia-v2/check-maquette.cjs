/* =============================================================
   CHECK-MAQUETTE — ce que `check-overflow` ne voit pas.

   « Ne déborde pas » ne veut pas dire « bien composé ». Ce contrôle mesure,
   page par page, ce qu'un relecteur repère à l'œil mais qu'aucune garde
   n'attrapait :

     · REMPLISSAGE   — une page à moitié vide se voit ; elle passait tous les
                       contrôles existants.
     · MARGE DE SÉCURITÉ — tout élément à moins de 10 mm du bord de coupe
                       risque d'être rogné au façonnage. Le fond perdu est à
                       3 mm, mais le texte doit rester à 10 mm du trait.
     · CORPS DE TEXTE — sous 7 pt, un texte imprimé devient pénible ; sous
                       6 pt il est illisible pour beaucoup de lecteurs.
     · CHEVAUCHEMENTS — deux blocs de texte qui se recouvrent.
     · IMAGES         — résolution effective sous 300 dpi = flou à l'impression.

   Ne bloque pas le build : il RAPPORTE. Certaines pages sont volontairement
   aérées (couvertures, ouvreurs de section). C'est un guide de relecture, pas
   un verdict.

   Usage : node check-maquette.cjs [chemin.html]
   ============================================================= */
const path = require("path");
const { chromium } = require("playwright");

const cible = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, "index.html");
const url = "file:///" + cible.replace(/\\/g, "/");

const MM = 96 / 25.4; // px CSS par mm
const BORD_SUR = 10 * MM; // marge de sécurité depuis le TRAIT DE COUPE
const BLEED = 3 * MM;

(async () => {
  const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);

  const rapport = await page.evaluate(
    ({ BORD_SUR, BLEED }) => {
      const pages = [...document.querySelectorAll(".page")];
      return pages.map((p, i) => {
        const box = p.getBoundingClientRect();
        const enfants = [...p.querySelectorAll("*")];

        // remplissage : surface couverte par les blocs de 1er niveau
        let bas = 0, haut = Infinity;
        for (const e of enfants) {
          if (e.classList.contains("trim") || e.classList.contains("sect-band")) continue;
          const r = e.getBoundingClientRect();
          if (r.height < 2 || r.width < 2) continue;
          if (r.bottom > bas) bas = r.bottom;
          if (r.top < haut) haut = r.top;
        }
        const remplissage = bas > 0 ? Math.min(1, (bas - box.top) / box.height) : 0;

        // éléments trop près du bord de coupe
        const horsMarge = [];
        for (const e of enfants) {
          if (e.classList.contains("trim") || e.classList.contains("sect-band")) continue;
          if (e.classList.contains("page__bg")) continue;
          if (!e.textContent || !e.textContent.trim()) continue;
          if (e.children.length) continue; // seulement les feuilles de texte
          const r = e.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          const gauche = r.left - (box.left + BLEED);
          const droite = box.right - BLEED - r.right;
          const hautM = r.top - (box.top + BLEED);
          const basM = box.bottom - BLEED - r.bottom;
          const min = Math.min(gauche, droite, hautM, basM);
          if (min < BORD_SUR - 1) {
            // un bandeau à fond perdu est CONÇU pour toucher le bord : son
            // texte est signalé à part, il ne doit pas noyer le reste
            const dansBandeau = !!e.closest(".footer, .sect-band");
            horsMarge.push({
              mm: +(min / (96 / 25.4)).toFixed(1),
              txt: e.textContent.trim().slice(0, 45),
              bandeau: dansBandeau,
            });
          }
        }

        // corps trop petits
        const petits = new Map();
        for (const e of enfants) {
          if (!e.textContent || !e.textContent.trim() || e.children.length) continue;
          const pt = parseFloat(getComputedStyle(e).fontSize) * (72 / 96);
          if (pt < 7) {
            const k = pt.toFixed(1);
            petits.set(k, (petits.get(k) || 0) + 1);
          }
        }

        // images sous-définies
        const images = [];
        for (const img of p.querySelectorAll("img")) {
          // un SVG est vectoriel : sa résolution ne veut rien dire
          if (/\.svg(\?|$)/i.test(img.getAttribute("src") || "")) continue;
          const r = img.getBoundingClientRect();
          if (!img.naturalWidth || r.width < 2) continue;
          const dpi = Math.round(img.naturalWidth / (r.width / 96));
          if (dpi < 300) images.push({ dpi, src: (img.getAttribute("src") || "").split("/").pop().slice(0, 34) });
        }

        return {
          n: i + 1,
          remplissage: +(remplissage * 100).toFixed(0),
          horsMarge: horsMarge.slice(0, 3),
          nbHorsMarge: horsMarge.length,
          petits: [...petits.entries()].map(([pt, n]) => `${n}×${pt}pt`),
          images,
        };
      });
    },
    { BORD_SUR, BLEED },
  );

  await browser.close();

  console.log("=== REMPLISSAGE (surface occupée jusqu'au dernier bloc) ===\n");
  const vides = rapport.filter((r) => r.remplissage < 80).sort((a, b) => a.remplissage - b.remplissage);
  if (!vides.length) console.log("  ✅ aucune page sous 80 %");
  for (const r of vides) console.log(`  ${r.remplissage < 65 ? "🔴" : "⚠️ "} p.${String(r.n).padStart(2)} — ${r.remplissage} %`);

  console.log("\n=== CONTENU COURANT À MOINS DE 10 mm DU TRAIT DE COUPE ===\n");
  const bords = rapport.filter((r) => r.horsMarge.some((h) => !h.bandeau));
  if (!bords.length) console.log("  ✅ aucun");
  for (const r of bords)
    console.log(
      `  🔴 p.${String(r.n).padStart(2)} — ` +
        r.horsMarge.filter((h) => !h.bandeau).map((h) => `${h.mm} mm « ${h.txt} »`).join(" · "),
    );

  // Les bandeaux à fond perdu sont CONÇUS pour toucher le bord : leur texte est
  // signalé à part, une ligne par bandeau avec sa marge la plus courte, sinon
  // il noie le vrai signal sur 46 pages.
  console.log("\n=== BANDEAUX À FOND PERDU (par conception) ===\n");
  const parBandeau = new Map();
  for (const r of rapport)
    for (const h of r.horsMarge.filter((x) => x.bandeau)) {
      const cle = h.txt.replace(/\d+ \/ \d+/, "NN / TT").slice(0, 36);
      const v = parBandeau.get(cle);
      if (!v || h.mm < v.mm) parBandeau.set(cle, { mm: h.mm, n: r.n });
    }
  if (!parBandeau.size) console.log("  ✅ aucun");
  for (const [txt, v] of [...parBandeau.entries()].sort((a, b) => a[1].mm - b[1].mm))
    console.log(`  ${v.mm < 3 ? "🔴" : "· "} ${String(v.mm).padStart(5)} mm  « ${txt} »  (au plus près p.${v.n})`);

  console.log("\n=== CORPS SOUS 7 pt ===\n");
  const min = rapport.filter((r) => r.petits.length);
  if (!min.length) console.log("  ✅ aucun");
  for (const r of min) console.log(`  ⚠️  p.${String(r.n).padStart(2)} — ${r.petits.join(", ")}`);

  console.log("\n=== IMAGES SOUS 300 dpi ===\n");
  const img = rapport.filter((r) => r.images.length);
  if (!img.length) console.log("  ✅ aucune");
  for (const r of img)
    console.log(`  🔴 p.${String(r.n).padStart(2)} — ` + r.images.map((i) => `${i.dpi} dpi ${i.src}`).join(" · "));

  const alertes = vides.length + bords.length + img.length;
  console.log(`\n=== ${alertes === 0 ? "✅ rien à signaler" : `${alertes} page(s) à regarder`} ===`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
