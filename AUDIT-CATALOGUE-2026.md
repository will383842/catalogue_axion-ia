# Audit du catalogue de formations Axion-IA — vue impression (Exaprint / Vistaprint)

_Date : 2026-07-17 · Cible : catalogue A4 fermé / A3 ouvert, remis à un imprimeur pour tirage + PDF._
_Fichier audité : `handoff_catalogue_axion_ia/Couverture Catalogue Axion-IA.dc.html` (5 pages A4, 1704×2410 px)._
_Source produit/marque : projet `Axion-IA/axionia`._

---

## Verdict global

Le fichier actuel est une **belle maquette web** (Design Component, HTML/CSS soigné), mais **il n'est ni prêt pour l'impression ni encore un vrai « catalogue de formations »**. Trois familles de problèmes :

1. **Production impression** — format/pagination incompatibles avec « A4 fermé / A3 ouvert », aucun fond perdu, résolution ~206 dpi, couleurs en RVB, fichier non exportable en l'état.
2. **Conformité / juridique** — témoignages et note « 4,9/5 » **fabriqués**, cas « résultats » non prouvés, badge Qualiopi + « finançable 100% » qui contredisent la propre doctrine de conformité du projet.
3. **Fond** — un catalogue de formations **qui ne contient aucune formation, aucun tarif** ; page 5 vide ; pas de 4e de couverture / contact ; marque (couleurs + typo) divergente du site.

Rien n'est perdu : la base graphique est bonne. Mais il faut le traiter comme un **v2 à reconstruire sur des rails imprimeur**, pas comme un fichier à envoyer tel quel.

---

## A. Bloquants « production impression » (à corriger avant tout imprimeur)

### A1. Format & pagination incompatibles — LE point n°1
« A4 fermé / A3 ouvert » = **une feuille A3 pliée en deux → 4 pages A4** (dépliant), ou un **livret piqué à cheval** dont le nombre de pages est **un multiple de 4** (4, 8, 12…).
Le fichier a **5 pages** → ne tombe ni sur 4 ni sur 8. Impossible à imposer tel quel.
- **Décision à prendre** : dépliant **4 pages** (1 A3) ou **livret 8 pages** (2 A3). Vu tout ce qui manque (offre, tarifs, contact), je recommande **8 pages**.
- Le pli central (A3 ouvert) crée une **double-page continue** : à exploiter comme une seule grande zone (ex. la grille des formations), ce que la maquette actuelle ignore (pages isolées).
- Livraison à l'imprimeur = **pages en ordre de lecture** (1→8), c'est l'imprimeur qui impose le pliage. Ne pas livrer déjà imposé sauf demande.

### A2. Fond perdu (bleed) absent — liseré blanc garanti
Le fond crème `#e8d2b8` va **bord à bord**, mais la page fait exactement 210×297 mm, **0 mm de débord**. À la coupe (tolérance ±1 mm), un **filet de papier blanc** apparaîtra sur les bords.
- Exiger **3 mm de fond perdu** sur chaque bord (page de travail 216×303 mm). À l'échelle du fichier : 3 mm ≈ **24 px**, 5 mm ≈ 41 px.
- Prévoir aussi une **marge de sécurité** (~5 mm) : aucun texte/logo/QR à moins de 5 mm du bord de coupe. Plusieurs éléments (logos outils, QR, pied de page) frôlent aujourd'hui les bords.

### A3. Résolution / DPI sous le standard
La page fait **1704×2410 px pour un A4 = 206 dpi** (standard impression : **300 dpi** → il faudrait 2480×3508 px). Les photos affichées sont à **~208 dpi** à leur taille (photo de couverture ≈ 188 mm de large pour une source ~1536 px).
- **Texte & aplats** : ne PAS rasteriser. Exporter en **PDF vectoriel** → le texte et les formes CSS restent nets à l'infini. C'est le levier clé.
- **Photos** : régénérer/upscaler à **≥ 300 dpi** à la taille d'affichage finale (couverture ~2220 px de large mini ; portraits/vignettes OK car très réduits).
- Logos raster (`axion-ia-logo.png` 657×293, `qualiopi-logo.png` 691×400) : idéalement en **vectoriel (SVG/PDF/EPS)** pour une netteté parfaite.

### A4. Colorimétrie RVB → CMJN
Toutes les couleurs sont en **RVB écran** (`#c24a1b`, `#ffc93c`, `#241b16`…). À l'impression **CMJN**, le terracotta et le jaune **vireront** (les orangés/jaunes lumineux sont hors gamut CMJN).
- Définir les **cibles CMJN (ou Pantone)** des couleurs signature avant export : terracotta `#c24a1b` ≈ C0 M70 J88 N12 (à valider sur nuancier / avec un Pantone type 7599 C), jaune, mocha.
- Fournir un fichier **CMJN** à l'imprimeur (pas RVB) pour maîtriser le rendu, surtout sur les grands aplats terracotta.

### A5. Le fichier n'est pas exportable en l'état
- Dimensions en **px**, pas en **mm** ; **aucun `@page`** (size/margin), **aucun fond perdu**, **police via CDN Google Fonts**.
- Un « print to PDF » Chrome brut donnera un PDF à mauvais format, sans bleed, potentiellement avec substitution de police si hors-ligne.
- **Deux voies possibles** :
  - **Voie rapide (garder le HTML)** : réécrire en unités mm, ajouter `@page { size:216mm 303mm; margin:0 }`, dessiner le fond perdu, **auto-héberger la police** (embarquée), exporter en PDF puis **convertir en CMJN** (Acrobat/Ghostscript) — et **contrôler le PDF** (PDF/X-1a ou X-4).
  - **Voie pro (recommandée pour un vrai catalogue)** : reconstruire sous **InDesign** ou **Affinity Publisher** → gabarits, fond perdu, CMJN, export PDF/X natif. Plus fiable pour un document destiné à durer et à être réimprimé.

### A6. QR codes externes et raster
Les QR viennent de `api.qrserver.com` (raster, dépendance réseau **au moment de l'export**). Deux risques : échec de génération si hors-ligne, et **QR raster**.
- **Générer les QR en vectoriel (SVG) et localement**, embarqués dans le fichier.
- ⚠️ Le QR « avis » pointe vers `/fr/avis` qui, côté site, affiche aujourd'hui **« Soyez le premier à laisser un avis »** (base vide). Un QR imprimé vers une page vide = mauvais effet. Idem vérifier que `/fr/formations` **affiche bien l'offre** (catalogue potentiellement gaté « Phase B »).

---

## B. Bloquants juridiques / conformité (avant diffusion papier)

> ⚠️ Ces points sont sensibles car le **projet lui-même** contient une doctrine de conformité (directive Omnibus / DGCCRF, règles Qualiopi, `doctrine-check.ts`). Le catalogue **viole cette doctrine sur plusieurs points**.

### B1. Témoignages fictifs + « 4,9/5 avis clients » = fabriqués
Les 6 avis (Marie D., Julien T. « Fonction, Entreprise », Sophie L.…) et la note **« 4,9/5 avis clients »** en couverture sont **inventés**. Côté produit, **aucun avis réel n'existe** (base vide, page `/avis` = « Soyez le premier à laisser un avis »).
- Imprimer de **faux avis + une fausse note** = pratique commerciale trompeuse (**directive Omnibus, sanctionnée par la DGCCRF**) — et contredit la méthodologie « avis vérifiés » revendiquée par le site.
- **Action** : retirer la note « 4,9/5 » et les témoignages **tant qu'il n'y a pas d'avis réels vérifiés**. Les remplacer par de vrais avis (avec consentement) quand ils existeront, ou par une page « méthodologie / engagement qualité ».

### B2. Cas concrets = résultats non prouvés
Les 8 cas Avant/Après (« +22% de RDV », « -30% d'appels SAV », « délai ÷ 2 »…) sont des **exemples illustratifs**, pas des résultats clients mesurés.
- **Action** : reformuler en **« exemples-types / cas d'usage »** (« ce qu'on peut viser », au conditionnel), OU sourcer sur de vrais clients. Ne pas présenter des chiffres inventés comme des résultats obtenus.

### B3. Badge Qualiopi
Le projet **gate** Qualiopi (« Phase B ») car **revendiquer la certification avant de l'avoir est illégal**, et le **n° de certificat ne doit jamais être affiché** (règle respectée).
- **Action** : n'imprimer le logo Qualiopi **que si la certification est effectivement obtenue**. Si oui, la **mention marque obligatoire** doit accompagner le logo : _« La certification qualité a été délivrée au titre de la catégorie ACTIONS DE FORMATION. »_
- **À confirmer avec vous** : Axion-IA est-elle **déjà certifiée Qualiopi** et **déclarée organisme de formation** (NDA obtenu) ? Le code suggère que non au moment de son écriture.

### B4. « Finançable jusqu'à 100% via votre OPCO »
La doctrine du projet **interdit** « financé à 100% / gratuit » et impose le registre **« prise en charge possible selon votre situation »**.
- **Action** : reformuler en _« Prise en charge possible par votre OPCO — selon votre situation »_. Ne pas promettre 100% automatique.
- **CPF** : le projet est **explicitement non éligible CPF** (termes « CPF / Mon Compte Formation » interdits). Ne jamais l'ajouter au catalogue.

### B5. Logos des outils IA (ChatGPT, Claude, Gemini…)
Marques déposées, importées via les slots. En **catalogue commercial imprimé**, prudence : utiliser les **kits presse officiels**, ne pas suggérer un **partenariat** inexistant, respecter les guidelines de chaque marque. Une rangée de logos concurrents peut aussi brouiller le message.

### B6. Mentions légales — emplacement à réserver
_(Vous les fournirez plus tard — noté.)_ Prévoir dès la maquette un **bloc mentions** (4e de couv ou pied) : raison sociale **Axion-IA SAS**, SIRET, **NDA** (« Déclaration d'activité enregistrée auprès du préfet… ne vaut pas agrément de l'État »), **exonération TVA art. 261-4-4° du CGI**, adresse (Grenoble), + mention marque Qualiopi si applicable.

---

## C. Contenu / fond — le catalogue ne remplit pas sa fonction

### C1. ❗ Aucune formation listée
C'est un **« catalogue de formations » sans formations**. Le cœur manque. Le produit réel comporte **17 formations** en 3 gammes :
- **IA standard** (12) : IA Express 4h, L'Art du Prompt N2 4h, IA & Sécurité 4h, IA & Conformité 4h (AI Act, « à la une »), IA Fondamentaux 1j, IA & Commercial 1j, IA au bureau 1j, IA sur le terrain 1j, Automatisations IA Découverte 1j, IA Intégration métier 2j, IA & Commercial avancé 2j, IA Transformation d'équipe 3j.
- **Agents & Automatisations** (2) : 2j, 3j (groupes ≤12).
- **Claude** (3, formateur certifié) : Découverte 1j, Créateur 2j, Architecte 3j.
- **Action** : ajouter **la grille des formations** (nom, durée, format intra présentiel/distanciel, public) — idéalement sur la **double-page centrale A3**.

### C2. ❗ Aucun tarif
Le produit a une grille tarifaire claire (€ HT / groupe). Ex. IA standard : 4h 1 200 €, 1j 1 900 €, 2j 3 600 €, 3j 4 900 € (tarif petit groupe) ; gamme Claude +20% ; 1-to-1 dès 990 €/j ; Audit dès 1 190 €.
- **Action** : afficher au moins **« à partir de »** par gamme/durée, ou une **matrice**. Un catalogue sans prix oblige le prospect à un aller-retour.

### C3. Page 5 « Comment ça marche » vide
Titre + pied en place, **corps vide**.
- **Action** : rédiger le **parcours en étapes** : ① Contact / appel découverte 30 min (Calendly `/appel`) → ② Audit IA & cadrage → ③ Montage OPCO → ④ Formation sur vos vrais dossiers → ⑤ Suivi J+30 & mesure → ⑥ Visibilité offerte (podcast/interview/page).

### C4. Pas de 4e de couverture / bloc contact
Aucune coordonnée claire nulle part (juste des QR). Pour un imprimé, la **4e de couverture** doit porter : `contact@axion-ia.com`, téléphone, **réserver un appel** (`/appel`), Grenoble, LinkedIn, QR site, CTA.
- ⚠️ Le repo n'a **pas de numéro de téléphone** — à fournir (ou n'afficher qu'email + prise de RDV).

### C5. Baseline de marque absente
La signature réelle manque : **« De l'idée à l'impact. Un seul partenaire IA. »** / **« Le cabinet IA opérationnel qui vous dit par où commencer. »** À placer en couverture/4e de couv.

### C6. Sommaire
Pour un livret 8 pages, ajouter un **mini-sommaire** (p.2) : Pourquoi se former · Nos formations · Tarifs & financement · Cas d'usage · Comment ça marche · Contact.

---

## D. Marque / direction artistique (cohérence avec le site)

### D1. Palette divergente
Le catalogue est **terracotta + crème `#e8d2b8`**, quasi monochrome. La marque réelle (site) = **ivoire `#faf8f3`** + **bleu éditorial `#1a4dd9` (couleur primaire)** + **terracotta `#c24a1b` en accent** + **mocha `#2a2520`** pour les sections sombres.
- Le catalogue **oublie le bleu primaire** et sursature le fond. Résultat : il ne « ressemble » pas au site. **Réaligner** sur ivoire + bleu + terracotta accent + mocha.

### D2. Typographie divergente
Catalogue en **Inter**. Marque = **Manrope** (sans) + **Fraunces** (serif display italique, la signature éditoriale des titres) + Inconsolata (mono).
- En restant sur Inter, le catalogue **perd l'identité éditoriale** (titres Fraunces). Repasser sur **Manrope/Fraunces** (et les **auto-héberger** pour l'impression).

### D3. Ton anxiogène
L'encart noir (« l'écart sera **impossible à rattraper** », « **35 M€ ou 7% du CA** » en gros) joue sur la **peur/urgence**. C'est peu aligné avec le positionnement « **cabinet opérationnel qui vous dit par où commencer** » (rassurant, concret).
- **Action** : garder l'argument (retard concurrentiel, AI Act) mais **adoucir le registre** — bénéfice concret plutôt que menace.

---

## E. Détails / finitions

- **Contraste** : texte `#8a7266` sur crème, en corps 13–14 px → lisibilité **limite** à l'impression. Foncer le gris (viser `#5a4f44` de la marque) et éviter le corps < 9 pt.
- **Titre couverture** 92 px `white-space:nowrap` (« Catalogue de formations IA✦ ») → **vérifier le non-débordement** au rendu réel.
- **Répétition** « Tourné en studio dans votre ville » sur chaque avis → alléger.
- **Cohérence lexicale** : « 1 to 1 » (couverture) vs service « un-à-un » (route `/un-a-un`) → harmoniser.
- **QR /fr/avis & /fr/formations** : re-vérifier les cibles (pages non vides) avant impression — un QR imprimé ne se corrige pas.
- **id `tool-logo-9`** au milieu des 1→6 (cosmétique, sans impact visuel).

---

## Proposition de structure (livret 8 pages, A4 fermé / A3 ouvert)

| Page | Contenu |
|---|---|
| **1 – Couverture** | Logo, titre, baseline marque, badges (Qualiopi *si certifié*, OPCO reformulé), photo, QR site. **Sans** « 4,9/5 ». |
| **2** | Sommaire + « Pourquoi se former à l'IA » (condensé) + mot du fondateur Williams. |
| **3–4 (double-page A3 centrale)** | **LA GRILLE DES 17 FORMATIONS** par gamme (IA standard / Agents / Claude), durées, format, public. Le cœur du catalogue. |
| **5** | **Tarifs & financement** (matrice € HT/groupe ou « à partir de » + prise en charge OPCO/France Travail reformulée). |
| **6** | **Cas d'usage** sectoriels (reformulés « exemples-types »). |
| **7** | **Comment ça marche** (parcours en étapes) + « Visibilité offerte » (podcast/interview/page). |
| **8 – 4e de couverture** | Avis **réels** (ou engagement qualité) + **contact** (email, RDV `/appel`, Grenoble, LinkedIn, QR) + **mentions légales**. |

Imposition (piqûre à cheval, 2 feuilles A3) : livrer **pages 1→8 en ordre de lecture**, l'imprimeur impose.

---

## Plan d'action priorisé

**P0 — décisions à trancher (bloquent tout le reste)**
1. **4 pages ou 8 pages ?** (je recommande 8).
2. **Qualiopi obtenu ? NDA obtenu ?** (détermine badge + mentions).
3. **Avis réels disponibles ?** (sinon on retire témoignages + note).
4. **Voie de production : garder HTML** (+ pipeline CMJN/bleed) **ou rebuild InDesign/Affinity ?**

**P1 — conformité (avant impression)**
Retirer/reformuler : faux avis & « 4,9/5 », cas « résultats »→exemples, « 100% »→« prise en charge possible », badge Qualiopi conditionnel, logos IA (kits presse).

**P2 — contenu**
Ajouter la grille des 17 formations + tarifs + « comment ça marche » + 4e de couv contact + baseline.

**P3 — marque**
Réaligner palette (ivoire + bleu + terracotta + mocha) et typo (Manrope + Fraunces).

**P4 — technique impression**
Format en mm + fond perdu 3 mm + marge sécurité 5 mm + CMJN + polices embarquées + QR vectoriels locaux + export **PDF/X-1a ou X-4** + photos ≥ 300 dpi. Puis **BAT / épreuve papier** avant tirage.

---

_Fin de l'audit._
