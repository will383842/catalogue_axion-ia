const SLUGS = ["cat-catalogue","cat-coaching","cat-c01","cat-c02","cat-c03","cat-audit","cat-a01","cat-a02","cat-a03","cat-a04","cat-implementation","cat-i01","cat-i02","cat-i03","cat-i04","cat-i05","cat-avis-1"];
(async () => {
  let ko = 0;
  for (const s of SLUGS) {
    const r = await fetch(`https://axion-ia.com/qr/${s}`, { redirect: "manual" });
    const dest = r.headers.get("location");
    let st = "?";
    try { st = (await fetch(dest, { redirect: "manual" })).status; } catch { st = "ERR"; }
    const ok = st === 200;
    if (!ok) ko++;
    console.log(`${ok ? "✅" : "🔴"} ${s.padEnd(20)} → ${String(st).padEnd(4)} ${dest.replace("https://axion-ia.com", "")}`);
  }
  console.log(ko ? `\n🔴 ${ko} destination(s) qui ne répondent pas 200` : `\n✅ toutes les destinations répondent 200`);
})();
