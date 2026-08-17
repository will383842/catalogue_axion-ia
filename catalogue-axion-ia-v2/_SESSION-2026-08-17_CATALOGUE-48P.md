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
| **PDF livré** | `export/catalogue-web.pdf` → `Downloads\catalogue-axion-ia-48p.pdf` |
| **PDF imprimeur CMJN** | `export/catalogue-axion-ia-CMYK.pdf` → `Downloads\catalogue-axion-ia-CMJN-imprimeur.pdf` |
| **PDF de relecture, planches doubles** | `export/catalogue-planches-verification.pdf` → `Downloads\catalogue-axion-ia-PLANCHES-verification.pdf` — **ne pas envoyer à l'imprimeur** |
| **Dépôt catalogue** | `C:\Users\willi\Documents\Projets\Catalogue_formations_Axion_IA` (git, branche `main`) |
| **Contenu des 12 prestations de conseil** | `../catalogue-kdp/coaching-audit-data.json` |
| **Vérité des prix** | `C:\Users\willi\Documents\Projets\Axion-IA\axionia\src\content\pricing.ts` |
| **Console QR** | console admin → **QR codes & liens** (URL à préfixe secret, non consignée ici) |
| **Publication en ligne** | PR **#689** sur `will383842/axion-ia`, branche `feat/catalogue-a4-48-pages`, worktree isolé `Projets/axionia-wt-catalogue48` |

## 1. La chaîne de build, dans l'ordre

```bash
cd C:\Users\willi\Documents\Projets\Catalogue_formations_Axion_IA\catalogue-axion-ia-v2
node build-conseil.cjs      # lit pages-source.html → écrit index.html (48 p.)
node renumber.cjs           # folios + sommaire, dérivés de l'ordre réel
node check-overflow.cjs     # AUCUNE page ne doit être rognée
node scan-qr.cjs            # décodage + résolution en prod — VERT
node probe-dest.cjs         # chaque destination de QR répond-elle 200 ?
node build-webpdf.cjs       # PDF + /PageLayout doubles pages (enchaîné)
node build-planches.cjs     # PDF de RELECTURE en planches doubles réelles
node check-harmonie.cjs     # A4 vs livre KDP : prix, titres, décomptes
node check-maquette.cjs     # remplissage, marges de coupe, corps, dpi des images
node check-ordre.cjs        # folios, manifeste, appariement, sequence editoriale
node check-renvois.cjs      # chaque « p. NN » verifie contre le CONTENU cite
node render-pages-web.cjs   # 48 images pour le feuilletoir, fond perdu rogne
node build-feuilletoir.cjs  # export/feuilletoir/ : index.html + pages-web/
node build-pdf-doubles-web.cjs  # 25 planches 420x297, pour la lecture en ligne
node build.cjs              # PDF RGB + CMJN imprimeur + JPEG 300 dpi + soft-proofs
node check-tac.cjs          # taux d'encre du CMJN, page par page
node check-dpi.cjs          # toutes les images ≥ 300 dpi effectifs
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
| `check-renvois.cjs` | renvois verifies contre le contenu cite + images existantes |

---

## 2. Ce qui est fait et vérifié

- **48 pages**, multiple de 4 (contrainte piqué à cheval). Ordre : formations →
  séminaire → coaching → audit → implémentation ; Visibilité en 4e de couverture.
- **Aucune page rognée** (`check-overflow`, les 48).
- **35 QR** relus au décodeur, tous lisibles.
- **Les 22 slugs `cat-*` sont CRÉÉS en production** (2026-08-17), classés
  « Catalogue A4 · p.NN — … ». `scan-qr.cjs` est VERT : 27 slugs vivants,
  0 anomalie. `probe-dest.cjs` confirme que les 17 destinations répondent 200.
- **Bandes de section** pleine hauteur sur la tranche extérieure — 29 bandes,
  toutes du bon cote (droite sur impaires, gauche sur paires). **30 apres**
  correction de la plage p.6.
- **PDF en doubles pages** : p.1 seule · (2-3) … (46-47) · p.48 seule.
  Chaîne xref revalidée : 2 sections, 12 420 objets, tous les offsets vérifiés.
- **Logo officiel** installé (`logo_entièrement détouré.png`), recadré sur ses
  pixels opaques → 1227×517, 779 dpi à 40 mm.
- **Couverture reecrite** : « Catalogue de prestations IA en entreprise » /
  « L'IA, de l'idee a l'impact. » / « Former · Accompagner · Auditer ·
  Implementer — un seul partenaire ». Elle ne vendait qu'une famille sur
  quatre. Le bloc de decompte a ete RETIRE a la demande de Will (« trop
  lourd pour une couverture ») et remplace par une invitation a ouvrir :
  « Par ou commencer ? La reponse page 6. »
- **Mention OPCO « sans avance »** dans le pied des 11 pages formation.
- **Mentions légales réelles** (SIREN 108 018 631, SIRET 108 018 631 00011,
  TVA FR51 108 018 631, siège Grenoble). Plus aucun zéro de remplissage.
- **6 emplacements de témoignage** numérotés, un QR chacun, **aucun texte**.
- **8 renvois de page perimes** de la version 24 pages, corriges — 5 au
  balayage initial, **3 de plus trouves en relisant a l'oeil** (§ 5bis-ter).
- **Harmonie A4 ↔ livre KDP vérifiée** (`check-harmonie.cjs`) : 0 divergence sur
  les décomptes (21 + 1 + 12), les 5 prix de formation, les 10 prix de conseil,
  les 12 titres de prestation ; aucun montant orphelin.
- **Sommaire réparé** : cinq renvois sur douze pointaient à côté après la
  réorganisation. Chaque entrée porte désormais un MARQUEUR vérifié au build
  (`renvois vérifiés : 12/12`). La garde des renvois existait mais ne
  contrôlait qu'une des DEUX listes.
- **Bande de section réparée** : son libellé était à **1,1 mm du trait de
  coupe**, donc rogné au façonnage. Bande élargie à 13 mm, retrait 4,5 mm →
  le texte revient à 3,9 mm. Trouvé par `check-maquette.cjs`.
- **Feuilletoir web + PDF doubles pages** livres, testes en navigateur :
  couverture seule et centree, double 02|03, folios en marge exterieure,
  aucune erreur. Structure de deploiement `export/feuilletoir/`.
- **Ordre verifie de bout en bout** (`check-ordre.cjs`) : folios, manifeste,
  appariement `[1] (2|3) ... (46|47) [48]`, cote des bandes, 15 reperes
  editoriaux. Tout en ordre.
- **Audit rendu** : 107 agents, 48 constats, 45 retenus. 3 reprises appliquées
  (niveau d'audit fantôme « Flash terrain » p.7, renvoi circulaire p.18, prix
  d'appel 790 € impayable p.6). Synthèse : `scratchpad/AUDIT-SYNTHESE.md`.

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

0. 🔴 **CHANGER LE PRÉFIXE DE LA CONSOLE D'ADMINISTRATION.** J'ai publié son URL
   sur un dépôt public (§ 5sexies). Retirée de l'état courant, mais **toujours
   lisible dans l'historique, au commit `42ecac3`**. Aucune opération sur le
   dépôt ne rattrape ça : seul le changement de préfixe le fait.
0bis. **Trancher les pages blanches** si ma lecture est fausse (§ 5quater) : j'ai
   compris la demande comme portant sur l'affichage — couverture seule et
   centrée, ce qui est livré. Deux blanches PHYSIQUES coûteraient soit la page
   QR + la fusion des témoignages, soit 4 pages de papier.
1. ~~22 slugs QR `cat-*` à créer~~ — **FAIT le 2026-08-17.** Créés via l'action
   serveur du formulaire admin ; le champ « Catégorie » est une énumération
   FERMÉE de 4 valeurs, donc pas de sous-onglet dédié possible sans toucher au
   code d'`axionia` : le classement passe par le libellé « Catalogue A4 · p.NN ».
2. **Les 6 QR témoignages** pointent tous sur `/fr/avis` — à repointer un par un
   quand les interviews seront tournées. C'est précisément ce que permet la
   redirection dynamique : aucune réimpression.
3. **Confirmer que la certification Qualiopi est délivrée.** Note de session du
   15/08 disant l'inverse. Irréversible une fois imprimé.
4. **Organisme certificateur Qualiopi** — à nommer, une seule fois, p.47.
5. ~~Fichiers d'impression périmés~~ — **RÉGÉNÉRÉS** en 48 pages le 2026-08-17.
   CMJN 25,2 Mo, RGB 15,4 Mo, 48 JPEG 300 dpi + soft-proofs CMJN.
   `check-tac.cjs` : **TAC max 305 % (p.48), sous le seuil de 320 %** ✅
   `check-dpi.cjs` : **toutes les images ≥ 300 dpi** ✅
6. ~~40 pages sur 48 jamais regardées visuellement~~ — **FAIT le 2026-08-17**,
   en planches-contact de 12 pages. **Cinq défauts factuels trouvés** (§ 5bis-ter),
   dont trois renvois faux et une image cassée depuis sa création. Corrigés,
   avec les gardes qui manquaient. Reste vraiment à Will : le jugement
   éditorial (équilibre, ton, hiérarchie), sur le PDF de planches.
6bis. ⚠️ **Échelle de prix des audits, à regarder.** `pricing.ts` est la source,
   et le catalogue lui est fidèle : Ciblé « dès 1 900 € », Stratégique **PME**
   « 4 900 / 9 900 € », Stratégique **ETI** « dès 1 900 € » (décision Will du
   2026-06-03, verrouillée par le test D-ETI-PRIX). Sur le site les paliers ne
   se voisinent pas ; **en page 36 ils sont dans le même tableau**, et l'ETI
   affiche un plancher inférieur à la PME. Rien à corriger côté catalogue —
   c'est une question de grille tarifaire, pas d'impression.
7. ~~Texte du bandeau de pied à 1,8-2 mm du trait~~ — **CORRIGÉ.** Retrait bas
   de 4,5 mm : le texte est remonté dans la partie visible du bandeau et se
   tient désormais à 4,0-4,3 mm du trait. Règle partagée injectée dans la
   sortie, aucune page réécrite.
8. **Publication en ligne — PR #689 ouverte, en attente des gates.**
   Elle remplace `public/catalogue-formations-ia-axion-ia.pdf` (édition 24 p.
   du 28 juillet) par l'édition 48 pages. Même chemin, donc les liens existants
   continuent de fonctionner. Un seul fichier, aucun code.
   ⚠️ `axionia` était en HEAD DÉTACHÉ avec 15 fichiers modifiés par un autre
   chantier : le travail est passé par un **worktree isolé**, jamais par le
   working tree partagé.
   Une fois la PR fusionnée et le déploiement passé (~25 min), **repointer le
   slug `cat-catalogue`** vers l'édition A4 si l'on veut que le QR de la p.3
   ouvre bien CE catalogue et non le livre KDP.

### Décisions Will — ne pas revenir dessus

- **Qualiopi : ne rien faire.** Ni la mention, ni le logo, ni le certificateur,
  ni les manques relevés par l'audit (accessibilité, référent handicap,
  modalités d'évaluation, délais d'accès). Décision explicite du 2026-08-17.

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

## 5bis. QUATRE PDF, un par usage — ne pas les confondre

| Fichier | Usage | Fond perdu | Reperes |
|---|---|---|---|
| `catalogue-axion-ia-CMYK.pdf` | l'imprimeur | oui | — |
| `catalogue-web.pdf` | l'e-mail, pages a l'unite | oui | — |
| `catalogue-doubles-web.pdf` | la lecture en ligne, 25 planches | **rogne** | non |
| `catalogue-planches-verification.pdf` | la relecture | oui | **oui** |

Les deux derniers se ressemblent et ne servent PAS a la meme chose : celui de
relecture garde volontairement les traits de coupe, il ne doit pas etre publie.

## 5ter. Deux defauts d'heritage du feuilletoir KDP

Reprendre un generateur eprouve fait gagner du temps et importe ses hypotheses :

- la 1re de couverture s'annoncait « dos de couverture » : le test portait sur
  le NOM DE FICHIER (`couv1.jpg`), nos images s'appellent `p01.jpg`.
- la regle qui force la premiere page de CONTENU a s'afficher seule n'a PAS ete
  reprise : la-bas la couverture est une image a part, ici la page 1 EST la
  couverture. La reprendre decalait l'appariement d'un rang.

## 5bis-ter. CINQ DEFAUTS QUE SIX CONTROLES VERTS NE VOYAIENT PAS

Le point 6 du « reste Will » disait : 40 pages sur 48 jamais regardees a l'oeil,
et le controle automatique « ne juge pas la COMPOSITION ». Fait le 2026-08-17,
en planches-contact de 12 pages. Il n'a pas trouve un probleme de composition :
il a trouve **cinq erreurs factuelles** que rien d'automatique ne pouvait voir.

| p. | Defaut | Vrai |
|---|---|---|
| 7 | « Seminaire IA … voir p. 15 » | p. **17** |
| 18 | « Seminaire IA … (voir p. 15) » | p. **17** |
| 44 | « IA pour l'automatisation, p. 9 » | p. **11** |
| 6 | tuile « … 1 seminaire — p. 8 a 16 » | le seminaire est en **17** : la plage ne couvrait pas ce qu'elle annoncait |
| 45 | `assets/qualiopi.png` | le fichier s'appelle `qualiopi-**logo**.png` — image cassee depuis sa creation |

**Pourquoi ils sont passes.** Cinq renvois du meme lot avaient deja ete repris,
en cherchant des TOURNURES (« voir p. »). Deux de ceux-ci portent une espace
insecable, le troisieme est glisse au milieu d'une phrase. Un balayage qui part
de la formulation rate tout ce qui ne l'emploie pas.

🔑 **UN DEFAUT EN CACHAIT UN AUTRE.** `check-dpi` ignore les images dont
`naturalWidth` vaut 0. Une image cassee ne charge pas, donc ne se mesure pas,
donc ne peut pas etre sous-definie : **le controle rendait VERT sur une
absence**. Repare, le logo Qualiopi tombait a 282 dpi. Hauteur d'impression
36 → 33,5 mm pour repasser au-dessus de 300. Le logo n'est pas touche.

**Gardes posees** — et vues ROUGIR avant d'etre retenues :
- `check-renvois.cjs` (nouveau) part des NUMEROS. Il releve tous les « p. NN »
  et exige que chacun soit DECLARE avec le repere que la page citee doit
  contenir, verifie dans son CONTENU, **aux deux bouts des plages**. Un renvoi
  non declare fait rougir. Il verifie aussi que chaque `src` d'image existe.
- `build-conseil.cjs` : une reprise qui ne trouve plus sa cible **arrete** le
  build (elle se contentait d'un `console.warn` noye dans la sortie).
- `check-dpi.cjs` : une image qui ne charge pas est signalee, plus ignoree.

## 5bis-quater. 🔑 NE PAS REJOUER : « les polices de marque manquent »

**Fausse alerte, deux fois dans la meme session.** Un balayage des `/BaseFont`
d'un PDF produit par `page.pdf()` de Chrome ne renvoie que SegoeUI, Georgia,
Consolas, TimesNewRomanPSMT. On en conclut que Fraunces / Manrope /
Inconsolata ne sont pas embarquees. **C'est faux.**

Deux preuves independantes :

1. `document.fonts` dans la page : `Fraunces [loaded]`, `Manrope [loaded]`,
   `Inconsolata [loaded]`, `document.fonts.check` vrai, **aucune requete de
   police en echec**.
2. La page 6 du PDF rasterisee et la capture d'ecran de la meme page sont
   **superposables** — meme Fraunces d'affichage, meme italique, meme oeil.

Et le PDF **en production** (edition 24 p., imprimee et validee par Will) porte
exactement les memes `/BaseFont`. Il n'y a jamais eu de probleme.

🔑 **Un `/BaseFont` absent ne prouve pas une police absente.** Pour trancher :
regarder ce que la page CHARGE (`document.fonts`) et comparer deux rendus a
l'oeil. Ne jamais conclure d'un balayage d'octets sur un PDF Chrome.

## 5quater. Pages blanches — TRANCHE, hypothese explicite

Demande de Will : « une page blanche juste apres la page de couverture (verso de
la page de couverture), idem pour la derniere. PUIS AVANT la premiere de
couverture il ne devrait pas y avoir de page blanche (elle devrait etre
centree). »

La deuxieme phrase porte sans ambiguite sur l'AFFICHAGE. Lue dans le meme cadre,
la premiere dit la meme chose : la couverture doit se presenter SEULE, comme si
son verso etait blanc, et sans blanc a sa gauche non plus. C'est exactement ce
qui est livre — couverture seule et centree, puis 02|03. Verifie au navigateur.

**Tranche : on reste a 48 pages, la p.2 garde l'edito + le sommaire.**

L'autre lecture — creer deux blanches PHYSIQUES — coutait, au choix :
- sacrifier la page 3 (le QR du catalogue) et fusionner les temoignages, deux
  pages que Will a explicitement demandees ;
- ou passer a 52 pages de papier.

Aucune des deux ne se prend sans arbitrage de Will, et l'interieur de couverture
est la 2e surface la plus lue d'un catalogue : la laisser blanche, c'est
l'offrir a personne. Signale a Will, sa main reste.

## 5quinquies. Le bandeau de tete NE MIROITE PAS — c'est deliberre

Le folio a bascule en marge exterieure (p. 5bis). Le bandeau de tete a la meme
asymetrie et n'a PAS ete bascule. Trois raisons :

1. Will a demande « la numerotation des pages de gauche », pas la tete.
2. Le bandeau de tete porte le LOGO. Un folio miroite, une marque non : elle
   tient sa position pour rester un reperage constant.
3. Le miroiter modifierait les 48 pages, **dont les fiches formations que Will a
   demande de ne pas toucher**. Ce point suffit a lui seul.

## 5sexies. FAUTE DE SECURITE — URL d'admin publiee (commit 42ecac3)

J'ai consigne dans ce journal l'URL de la console d'administration avec son
prefixe secret, et je l'ai poussee sur `catalogue_axion-ia`, depot **PUBLIC**.

- une seule occurrence, un seul commit : `42ecac3`
- retiree de l'etat courant au commit `904a40a`
- `axionia` n'est PAS touche (verifie)

**Retirer du HEAD ne retire pas de l'historique.** La seule remediation qui
vaille est de CHANGER LE PREFIXE de la console : une URL secrete publiee n'est
plus secrete, et la reecriture d'historique ne rattrape pas les copies faites.

Portee reelle : ce prefixe est une obscurite, pas un controle d'acces. La console
reste derriere l'authentification. L'exposition abaisse une barriere, elle
n'ouvre pas la porte.

`_SESSIONS/transcriptions/` est desormais au .gitignore : les transcriptions
portent la meme URL.

## 6. Historique des commits

```
6835892  Cinq défauts trouvés en relisant les 48 pages à l'œil, et les gardes qui manquaient
904a40a  Retire l'URL d'administration du journal — le dépôt est PUBLIC
865ac65  Le folio passe en marge extérieure, et une garde permanente le vérifie
42ecac3  Journal de session — tenu au fil de l'eau  ⚠️ porte l'URL d'admin (§ 5sexies)
73d87ad  Mentions légales : retire le capital social et le paragraphe déclaration d'activité
b81aab7  Mentions légales réelles — plus aucun zéro de remplissage
83ec6cd  Couverture réécrite, logo officiel, mention OPCO sans avance, renvois réparés
f8dd2e5  Affiche le PDF en doubles pages, couvertures seules
7bde00b  Bandes de section, couvertures qui se répondent, tarifs et carte de l'offre
dcb5abb  Témoignages : six emplacements numérotés, aucun texte imprimé
d35d70b  Catalogue à 48 pages : coaching 1-to-1, audit, implémentation, témoignages
85e1b62  Répare les deux gardes QR, mortes depuis la suppression d'un worktree
```
