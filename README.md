# Catalogue de formations IA — Axion-IA (2026-2027)

Catalogue **24 pages**, format A4 fermé / A3 ouvert (livret piqué à cheval), prêt pour l'impression (Exaprint / Vistaprint).

Contenu : **21 formations + 1 séminaire** en 3 catégories (4 offres générales · 9 par métier · 8 par secteur), plus les coachings 1-to-1 et les audits. Prix publics par groupe.

## Contenu du dépôt

| Élément | Description |
|---|---|
| `catalogue-axion-ia-v2/index.html` | **Source de vérité** — HTML autonome, s'ouvre au double-clic dans un navigateur |
| `catalogue-axion-ia-v2/build.cjs` | Pipeline de build : Playwright → PDF RGB + JPEG 300 dpi, puis Ghostscript → PDF CMJN + soft-proofs |
| `catalogue-axion-ia-v2/preview.cjs` | Aperçu rapide de pages précises : `node preview.cjs 1 15 16` |
| `catalogue-axion-ia-v2/check-dpi.cjs` | Contrôle : toutes les images ≥ 300 dpi effectifs |
| `catalogue-axion-ia-v2/check-tac.cjs` | Contrôle : taux d'encre total du PDF CMJN, page par page |
| `catalogue-axion-ia-v2/assets/` | Logo, Qualiopi, photos |
| `catalogue-axion-ia-v2/qr-*.svg` | QR codes vectoriels — 5 slugs dynamiques : `formations`, `appel`, `linkedin`, `avis-catalogue-1`, `avis-catalogue-2` |
| `catalogue-axion-ia-v2/scan-qr.cjs` | Décode les QR du catalogue pour vérifier leur destination |
| `catalogue-axion-ia-v2/export/` | **Livrables** : `catalogue-axion-ia-CMYK.pdf` (imprimeur), `-RGB.pdf` (écran), `page-01..24.jpg` (300 dpi) |
| `AUDIT-CATALOGUE-2026.md` | Audit de la maquette v1 d'origine |
| `handoff_catalogue_axion_ia/` | Maquette v1 d'origine (Design Component) |

## Régénérer après une modification

Le PDF CMJN est un export généré — on n'édite jamais le PDF à la main.

1. Modifier `catalogue-axion-ia-v2/index.html` (ou les fichiers de `assets/`)
2. Relancer le build :
   ```bash
   cd catalogue-axion-ia-v2
   node build.cjs
   ```
   → régénère PDF RGB, **PDF CMJN**, JPEG 300 dpi et soft-proofs CMJN.
3. Contrôler avant d'envoyer à l'imprimeur :
   ```bash
   node check-dpi.cjs    # images ≥ 300 dpi effectifs
   node check-tac.cjs    # taux d'encre du PDF CMJN (exit 1 si > 320 %)
   ```
   `check-tac.cjs` accepte aussi un PDF en argument — il sert donc pour les flyers :
   `node check-tac.cjs ../../Prospectus_Axion_IA/export/prospectus-catalogue-CMYK.pdf`

## Caractéristiques d'impression

- Format de travail **216 × 303 mm** (A4 210 × 297 + **3 mm de fond perdu**)
- **CMJN** (conversion Ghostscript ; profil FOGRA39 / texte K-only à affiner côté imprimeur si besoin)
- **Taux d'encre (TAC) : 305 % max** (page 23), 0 % de surface au-delà — sous la limite offset couché ≈ 330 %. Vérifié par `check-tac.cjs`
- Polices embarquées (Manrope + Fraunces), QR vectoriels
- Marque : sable profond `#ece0c9` + bleu `#1a4dd9` + terracotta `#c24a1b` + mocha `#2a2520`

## QR dynamiques

Tous les QR imprimés pointent sur `/qr/<slug>` — une redirection 302 **modifiable après impression** depuis la console admin du site, avec compteur de scans. Les 5 slugs imprimés (`formations`, `appel`, `linkedin`, `avis-catalogue-1`, `avis-catalogue-2`) **ne doivent jamais être renommés ni supprimés**.

Les deux QR « avis » (p. 23) ont une destination **provisoire** (`/fr/avis`) : ils basculeront sur les vidéos interview et podcast une fois les tournages faits, sans réimprimer.

## À compléter avant impression finale

- **Mentions légales** (p. 24 : SIRET, n° NDA, adresse, organisme certificateur) et **téléphone** — à fournir par Will
- Destinations réelles des QR « avis », quand les vidéos seront tournées
- Optionnel : remplacer les photos Unsplash de substitution par de vraies photos client
- Puis **BAT / épreuve papier** chez l'imprimeur

> Pas d'avis clients inventés dans ce catalogue : la page 23 présente deux **teasers d'interview vidéo**, sans nom ni citation, puisqu'on ne connaît pas encore les personnes interviewées. Ne pas y ajouter de faux témoignages.
