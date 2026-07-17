# Catalogue de formations IA — Axion-IA (2026-2027)

Catalogue **20 pages**, format A4 fermé / A3 ouvert (livret piqué à cheval), prêt pour l'impression (Exaprint / Vistaprint).

## Contenu du dépôt

| Élément | Description |
|---|---|
| `catalogue-axion-ia-v2/index.html` | **Source de vérité** — HTML autonome, s'ouvre au double-clic dans un navigateur |
| `catalogue-axion-ia-v2/build.cjs` | Pipeline de build : Playwright → PDF RGB + JPEG 300 dpi, puis Ghostscript → PDF CMJN + soft-proofs |
| `catalogue-axion-ia-v2/preview.cjs` | Aperçu rapide de pages précises : `node preview.cjs 1 15 16` |
| `catalogue-axion-ia-v2/assets/` | Logo, Qualiopi, photos |
| `catalogue-axion-ia-v2/qr-*.svg` | QR codes vectoriels (formations, appel, LinkedIn) |
| `catalogue-axion-ia-v2/export/` | **Livrables** : `catalogue-axion-ia-CMYK.pdf` (imprimeur), `-RGB.pdf` (écran), `page-01..20.jpg` (300 dpi) |
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

## Caractéristiques d'impression

- Format de travail **216 × 303 mm** (A4 210 × 297 + **3 mm de fond perdu**)
- **CMJN** (conversion Ghostscript ; profil FOGRA39 / texte K-only à affiner côté imprimeur si besoin)
- Polices embarquées (Manrope + Fraunces), QR vectoriels
- Marque : ivoire `#faf8f3` + bleu `#1a4dd9` + terracotta `#c24a1b` + mocha `#2a2520`

## À compléter avant impression finale

Avis clients réels (p. 19), mentions légales (p. 20 : SIRET, n° NDA, adresse, organisme certificateur), téléphone, photos HD, puis **BAT / épreuve papier**.
