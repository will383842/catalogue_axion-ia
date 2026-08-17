const SLUGS = ["cat-catalogue","cat-coaching","cat-c01","cat-c02","cat-c03","cat-audit","cat-a01","cat-a02","cat-a03","cat-a04","cat-implementation","cat-i01","cat-i02","cat-i03","cat-i04","cat-i05","cat-avis-1","cat-avis-2","cat-avis-3","cat-avis-4","cat-avis-5","cat-avis-6"];
(async () => {
  const faits = [], manquants = [];
  for (const s of SLUGS) {
    try {
      const r = await fetch(`https://axion-ia.com/qr/${s}`, { redirect: "manual" });
      (r.status === 302 ? faits : manquants).push(s);
    } catch { manquants.push(s); }
  }
  console.log(`créés   (${faits.length}/22) : ${faits.join(" ") || "—"}`);
  console.log(`restants(${manquants.length}/22) : ${manquants.join(" ") || "aucun ✅"}`);
})();
