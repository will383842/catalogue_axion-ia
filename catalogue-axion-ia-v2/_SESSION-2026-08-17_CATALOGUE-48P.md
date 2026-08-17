# Session 2026-08-17 — Catalogue Axion-IA : de 24 à 48 pages

> Journal tenu **au fil de l'eau**. Si Claude Code se ferme, tout repart d'ici.
> Reconstruire l'état réel par `git log` et `git status`, **jamais** par ce que
> la conversation croyait avoir fait.

---

## 0. Où sont les choses

| Quoi | Où |
|---|---|
| **Source figée, 24 pages d'origine** | `catalogue-axion-ia-v2/pages-source.html` — jamais écrite par le build |
| **Sortie, 48 pages** | `catalogue-axion-ia-v2/index.html` — régénérable, ne pas éditer à la main |
| **PDF livré** | `catalogue-axion-ia-v2/export/catalogue-web.pdf`, copié dans `C:\Users\willi\Downloads\catalogue-axion-ia-48p.pdf` |
| **Dépôt** | `C:\Users\willi\Documents\Projets\Catalogue_formations_Axion_IA` (git, branche `main`) |
| **Contenu des 12 prestations de conseil** | `../catalogue-kdp/coaching-audit-data.json` |
| **Vérité des prix** | `C:\Users\willi\Documents\Projets\Axion-IA\axionia\src\content\pricing.ts` |
| **Console QR** | `https://axion-ia.com/fr/admin-xfz5hk0j7hrk/qr-codes` |

## 1. La chaîne de build, dans l'ordre

```bash
cd C:\Users\willi\Documents\Projets\Catalogue_formations_Axion_IA\catalogue-axion-ia-v2
node build-conseil.cjs      # lit pages-source.html → écrit index.html (48 p.)
node renumber.cjs           # folios + sommaire, dérivés de l'ordre réel
node check-overflow.cjs     # AUCUNE page ne doit être rognée
node scan-qr.cjs            # décodage + résolution en prod — rouge aujourd'hui, voir §4
node build-webpdf.cjs       # PDF + /PageLayout doubles pages (enchaîné)
```

**Idempotent** : deux passes complètes donnent le même `index.html` à l'octet près.

### Fichiers créés cette session

| Fichier | Rôle |
|---|---|
| `build-conseil.cjs` | assemble les 48 pages, génère les 28 pages nouvelles |
| `renumber.cjs` | folios + sommaire dérivés, garde multiple de 4 |
| `lib-qr.cjs` | socle QR : génération, relecture au décodeur, résolution prod |
| `pdf-doubles-pages.cjs` | `/PageLayout /TwoPageRight` en mise à jour incrémentale |
| `maj-logo.cjs` | installe et recadre le logo officiel |
| `pages-source.html` | les 24 pages d'origine, figées |

---

## 2. Ce qui est fait et vérifié

- **48 pages**, multiple de 4 (contrainte piqué à cheval). Ordre : formations →
  séminaire → coaching → audit → implémentation ; Visibilité en 4e de couverture.
- **Aucune page rognée** (`check-overflow`, les 48).
- **22 QR** relus au décodeur, tous lisibles.
- **Bandes de section** pleine hauteur sur la tranche extérieure — 29 bandes,
  toutes du bon côté (droite sur impaires, gauche sur paires).
- **PDF en doubles pages** : p.1 seule · (2-3) … (46-47) · p.48 seule.
  Chaîne xref revalidée : 2 sections, 12 420 objets, tous les offsets vérifiés.
- **Logo officiel** installé (`logo_entièrement détouré.png`), recadré sur ses
  pixels opaques → 1227×517, 779 dpi à 40 mm.
- **Couverture réécrite** : « Catalogue de prestations IA en entreprise » /
  « Former. Auditer. Construire. » / les 5 familles nommées / « 34 prestations
  IA · 5 familles ». Elle ne vendait qu'une famille sur cinq.
- **Mention OPCO « sans avance »** dans le pied des 11 pages formation.
- **Mentions légales réelles** (SIREN 108 018 631, SIRET 108 018 631 00011,
  TVA FR51 108 018 631, siège Grenoble). Plus aucun zéro de remplissage.
- **6 emplacements de témoignage** numérotés, un QR chacun, **aucun texte**.
- **5 renvois de page périmés** de la version 24 pages, corrigés.

## 3. Défauts trouvés et corrigés en route

| Défaut | Nature |
|---|---|
| `scan-qr.cjs` et `convert-qr-dynamic.cjs` chargeaient sharp/qrcode depuis un **worktree supprimé** → la garde QR ne tournait plus du tout | préexistant |
| Le build **lisait et écrivait `index.html`** alors qu'il REMPLACE une page → relancé sur sa sortie, il perdait une page définitivement | introduit par moi |
| La bande de section héritait de `position:relative` d'une règle à 4 `:not()` → devenait un élément de flux, **19 pages rognées** | introduit par moi |
| Bloc « Nos engagements » **imprimé deux fois** sur les 5 fiches implémentation | introduit par moi |
| Folios et renvois écrits **en dur** dans chaque page | préexistant |

---

## 4. ⛔ CE QUI RESTE — reste Will

1. **22 slugs QR `cat-*` à créer** dans la console admin. Tant qu'ils manquent,
   ces QR sont imprimés **morts** (404). `scan-qr.cjs` rouge tant que ce n'est
   pas fait — c'est voulu. Liste dans la constante `QR` de `build-conseil.cjs`.
2. **Les 6 QR témoignages** pointent tous sur `/fr/avis` — à repointer un par un.
3. **Confirmer que la certification Qualiopi est délivrée.** Note de session du
   15/08 disant l'inverse. Irréversible une fois imprimé.
4. **Organisme certificateur Qualiopi** — à nommer, une seule fois, p.47.
5. **Fichiers d'impression périmés** : `catalogue-axion-ia-CMYK.pdf` et
   `-RGB.pdf` datent du 21 juillet et font encore **24 pages**. Contrôle
   d'encre (`check-tac.cjs`) non relancé.
6. **40 pages sur 48 jamais regardées visuellement.** « Ne déborde pas » ≠
   « bien composé ».

### Décisions Will — ne pas revenir dessus

- Les **17 logos clients page 2** : inchangés.
- Le **logo Qualiopi** : inchangé partout ; mention complète à un seul endroit.
- **Ni capital social, ni paragraphe déclaration d'activité** dans les mentions.
- **Aucun texte** sur les pages témoignages, seulement « Témoignage N » + QR.
- **Pas de doubles pages** pour coaching/audit : tout en pleine page simple.

---

## 5. Audit multi-agents — en cours

Run `wf_1a396362-ae5`. 107 agents, 4 étages : cartographie (4) → 6 lentilles
seniors → contre-expertise (2 vérificateurs par constat) → synthèse.

Journal : `C:\Users\willi\.claude\projects\C--Users-willi-Documents-Projets-Axion-IA\51299d4f-426b-4112-83a2-b0fd558c774e\subagents\workflows\wf_1a396362-ae5\journal.jsonl`
Lecture : `scratchpad/lire-audit.cjs`.

**Constats bloquants déjà remontés, non traités :**

- p.2 — 17 logos de grandes marques sans légende suivis de « et vous ? »
  → **décision Will : on laisse**.
- p.6/23/37 — « Dès 790 € HT » pour le 1-to-1 : achetable seulement en contrat
  6 mois (4 740 € réels), et le site annonce 990 €. **À traiter.**
- p.26/28/37 — prix d'audit imprimés en **ferme** alors que la SSOT les déclare
  tous « à partir de ». **À traiter.**
- Absence totale de **mention accessibilité handicap / référent handicap**.
- Absence des **modalités d'évaluation des acquis** et des **délais d'accès**
  sur les fiches formation (exigences Qualiopi + art. L.6353-1).
- Le **sommaire ignore 11 pages** ; les bandes de tranche s'arrêtent p.38.

---

## 6. Historique des commits

```
73d87ad  Mentions légales : retire le capital social et le paragraphe déclaration d'activité
b81aab7  Mentions légales réelles — plus aucun zéro de remplissage
83ec6cd  Couverture réécrite, logo officiel, mention OPCO sans avance, renvois réparés
f8dd2e5  Affiche le PDF en doubles pages, couvertures seules
7bde00b  Bandes de section, couvertures qui se répondent, tarifs et carte de l'offre
dcb5abb  Témoignages : six emplacements numérotés, aucun texte imprimé
d35d70b  Catalogue à 48 pages : coaching 1-to-1, audit, implémentation, témoignages
85e1b62  Répare les deux gardes QR, mortes depuis la suppression d'un worktree
```
