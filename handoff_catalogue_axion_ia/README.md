# Catalogue Axion-IA — Handoff Claude Code

Catalogue de formations IA (5 pages, format A4) pour axion-ia.com.

## Contenu du dossier

- `Couverture Catalogue Axion-IA.dc.html` — le fichier principal (Design Component). S'ouvre directement dans un navigateur.
- `support.js` — runtime nécessaire au rendu du Design Component (ne pas modifier).
- `image-slot.js` — composant des zones d'images « glisser-déposer » (logos IA, photos de cas, QR interviews).
- `.image-slots.state.json` — images déjà déposées par l'utilisateur (logos IA, photos). Conserve les images dans le catalogue.
- `assets/` — logo Axion-IA, logo Qualiopi, photos d'équipe, photo du fondateur Williams.

## Lancer en local

Servir le dossier avec un serveur statique (les modules JS ne se chargent pas en `file://`) :

```bash
cd handoff_catalogue_axion_ia
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/Couverture%20Catalogue%20Axion-IA.dc.html
```

## Structure

5 pages empilées verticalement, chacune `1704 × 2410 px` (ratio A4 exact 1:1,4142) :

1. **Couverture** — logo, titre, photos, badges Qualiopi / financement OPCO / 4,9★, logos des outils IA, QR code, bloc « Nouveauté · Visibilité offerte » (podcast, interview, page entreprise).
2. **Pourquoi former vos équipes** — 6 cartes bénéfices + mot du fondateur Williams.
3. **Cas concrets** — 8 cas sectoriels avec Avant/Après.
4. **Témoignages** — avis clients + QR codes vers les interviews.
5. **Comment ça marche** — titre prêt, corps à compléter.

## Charte

- Terracotta `#c24a1b` (accent principal)
- Fond crème `#e8d2b8`
- Encre `#241b16`
- Jaune `#ffc93c` (surlignage)
- Police : Inter

## Notes

- Les vrais logos des outils IA (ChatGPT, Claude, Gemini…) sont importés par l'utilisateur via les zones `image-slot` — ce sont des marques déposées, à récupérer depuis les kits de presse officiels.
- Les QR codes utilisent `api.qrserver.com` (encodent directement l'URL, pas de redirection — pas de péremption).
- Page 5 « Comment ça marche » : en-tête + pied de page en place, corps vide à remplir.
