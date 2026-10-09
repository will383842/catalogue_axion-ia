/* Générateur de la plaquette Axion-IA (A4, print) -> plaquette.html
   Données réelles issues du catalogue interne. Exécuter: node build-plaquette.js */
const fs = require("fs");
const path = require("path");

const BRAND = {
  site: "axion-ia.com",
  email: "contact@axion-ia.com",
  tel: "",
  nom: "Axion-IA",
  baseline: "Former, accompagner, auditer — l’IA appliquée à votre entreprise",
};

const CLIENTS = [
  ["leclerc","E.Leclerc"],["intermarche","Intermarché"],["point-p","Point P"],["gedimat","Gedimat"],
  ["renault","Renault"],["volkswagen","Volkswagen"],["ad-auto","AD"],["axa","AXA"],
  ["generali","Generali"],["iad","IAD"],["safti","SAFTI"],["pharmacie-lafayette","Pharmacie Lafayette"],
  ["ecf","ECF"],["krys","Krys"],["jardiland","Jardiland"],["la-poste","La Poste"],["intersport","Intersport"],
];

const SECTORS = [
  "Industrie","Retail & e-commerce","Santé & pharmacie","Finance & assurance","RH & recrutement",
  "Logistique & transport","Immobilier","Conseil & services","Éducation & formation","Juridique",
  "BTP & construction","Agroalimentaire","Automobile","Tourisme & hôtellerie","Médias & édition","Énergie",
];

const GAMME = {
  ia: "IA Standard",
  agents: "Agents & Automatisations",
  claude: "Claude — formateur certifié",
};

// ---- 17 FORMATIONS (données réelles) ----
const FORMATIONS = [
  { n:"01", g:"ia", titre:"IA Express", accroche:"4 heures pour que toute votre équipe travaille avec l’IA, dès demain.",
    duree:"4 h · ½ journée", eff:"2 à 15 · 16 à 30", prix:"1 200 € / 1 900 €", prereq:"Aucun — un smartphone suffit",
    pour:"Tous postes mélangés (bureau, terrain, commercial, atelier, accueil), managers et dirigeants. Aucun profil technique requis.",
    obj:["Produire un texte pro au clavier ou en dictée vocale","Formuler une demande efficace du premier coup (méthode CRFE)","Comprendre vite un document long : essentiel, vigilances, actions","Faire refaire jusqu’au résultat voulu et repérer les inventions","Anonymiser en 30 s et respecter la liste rouge des données"],
    prog:[{h:"Demi-journée (ex. 08h30–12h30)", s:["15’ Accueil et mise en route","25’ Première production réelle de chacun","35’ La méthode CRFE : Contexte, Rôle, Format, Exemple","30’ Comprendre un document long","30’ Faire refaire + détecter les inventions","20’ Ligne rouge sécurité + anonymiser","45’ Atelier libre sur SA tâche de demain","25’ Clôture, quiz, engagement"]}],
    roi:"4 h investies par salarié → 30 à 60 min gagnées par jour dès la semaine suivante. Rentabilisée en moins de 2 semaines." },

  { n:"02", g:"ia", titre:"L’Art du Prompt — Niveau 2", accroche:"Vos équipes utilisent déjà l’IA mais les résultats sont moyens ? La compétence qui change tout.",
    duree:"4 h · ½ journée", eff:"2 à 15 · 16 à 30", prix:"1 200 € / 1 900 €", prereq:"Utiliser déjà l’IA (vérifié au cadrage)",
    pour:"Salariés qui pratiquent déjà l’IA et plafonnent : résultats génériques, reprises multiples, outil sous-exploité.",
    obj:["Construire une demande avec les 6 leviers d’un prompt qui marche","Itérer jusqu’à un niveau diffusable (critiques précises)","Adapter un même contenu à 3 destinataires","Créer des gabarits réutilisables sans donnée sensible","Repérer quand l’IA invente et la recadrer"],
    prog:[{h:"Demi-journée", s:["10’ Diagnostic éclair des prompts actuels","35’ Anatomie d’un prompt : les 6 leviers","35’ L’itération experte : rôle de relecteur","30’ Adapter un contenu à 3 destinataires","35’ Exemples et gabarits réutilisables","25’ Chasse aux inventions + confidentialité","40’ Atelier : ma bibliothèque de 5 gabarits","15’ Clôture et quiz"]}],
    roi:"4 h investies → chaque tâche IA existante faite 2 à 3× plus vite. Rentabilisée en 1 à 2 semaines." },

  { n:"03", g:"ia", titre:"IA & Sécurité", accroche:"Vos salariés utilisent déjà l’IA. Apprenez-leur à le faire sans risque pour l’entreprise.",
    duree:"4 h · ½ journée", eff:"2 à 15 · 16 à 30", prix:"1 200 € / 1 900 €", prereq:"Aucun · Livrable : votre charte d’usage IA",
    pour:"Tout salarié qui utilise l’IA ou s’apprête à le faire, ainsi que dirigeants, DSI et référents.",
    obj:["Identifier les données qui ne doivent jamais sortir de l’entreprise","Anonymiser correctement un document ou une photo","Distinguer les outils sûrs des outils à risque","Vérifier une production avant diffusion (client, administration)","Appliquer les 4 réflexes RGPD et la charte d’usage"],
    prog:[{h:"Demi-journée", s:["10’ Sondage dédramatisant","30’ Où vont vos données : gratuit vs pro","35’ La ligne rouge : 15 situations + votre liste rouge","30’ Anonymiser en 30 s sur ses documents","30’ Vérifier avant de diffuser","35’ RGPD sans jargon + circuit d’alerte","35’ La charte d’usage rédigée en séance","20’ Clôture et quiz"]}],
    roi:"Un seul incident évité (fuite de données, doc confidentiel dans un outil public) vaut des dizaines de fois le coût. Une assurance au prix d’une demi-journée." },

  { n:"04", g:"ia", featured:true, titre:"IA & Conformité", accroche:"Vos obligations d’employeur quand vos équipes utilisent l’IA — l’AI Act transformé en feuille de route.",
    duree:"4 h · ½ journée", eff:"2 à 15 · 16 à 30", prix:"1 200 € / 1 900 €", prereq:"Aucun · 4 livrables construits en séance",
    pour:"Dirigeants, DRH/RH, managers, référents IA, DPO et responsables conformité de TPE, PME et ETI.",
    obj:["Identifier les obligations (AI Act, RGPD, droit du travail) sans jargon","Cartographier et classer les usages IA (shadow AI compris)","Constituer le dossier de conformité (registre, charte, preuves)","Piloter le plan de mise en conformité 90 jours","Communiquer le cadre sans freiner l’adoption"],
    prog:[{h:"Demi-journée", s:["10’ État des lieux : le shadow AI révélé","35’ Ce que la réglementation impose vraiment","35’ Cartographier les usages réels","30’ Qui est responsable de quoi","40’ Le registre v1 construit en séance","35’ Le plan de conformité 90 jours","25’ Communiquer : « on encadre, on n’interdit pas »","15’ Clôture et quiz"]}],
    roi:"4 livrables de conformité construits en séance (cartographie, registre, plan 90 jours, communication), qui auraient coûté plusieurs jours de conseil." },

  { n:"05", g:"ia", titre:"IA Fondamentaux", accroche:"Une journée pour passer toute l’équipe de débutant à autonome.",
    duree:"1 jour · 7 h", eff:"2 à 15 · 16 à 30", prix:"1 900 € / 3 200 €", prereq:"Aucun · Livrable + boîte à outils perso",
    pour:"Tout salarié de tous services, managers, dirigeants, professions libérales et indépendants.",
    obj:["Tout le contenu d’IA Express, ancré par une journée de pratique","Analyser un document long et complexe, synthèse vérifiée","Produire un livrable complet de A à Z","Travailler en étapes : brouillon → critique → version finale","Choisir le bon outil et bâtir sa boîte à outils"],
    prog:[{h:"Matin", s:["60’ Mise en route + méthode CRFE","45’ Analyse d’un document complexe","60’ Livrable A à Z (partie 1)","30’ Vérification et chasse aux inventions"]},{h:"Après-midi", s:["30’ Réactivation + sécurité/anonymisation","60’ Livrable A à Z (partie 2) « diffusable »","45’ Panorama des outils : lequel pour quoi","50’ Atelier boîte à outils (5-8 gabarits)","25’ Clôture + livrable constaté"]}],
    roi:"~1 h gagnée par jour et par salarié. Sur une équipe de 8, l’équivalent d’un temps plein récupéré chaque mois." },

  { n:"06", g:"ia", titre:"IA & Commercial", accroche:"Devis, propositions, relances : répondre plus vite et mieux que vos concurrents.",
    duree:"1 jour · 7 h", eff:"2 à 15 · 16 à 30", prix:"1 900 € / 3 200 €", prereq:"Aucun · Gabarit de devis + biblio d’équipe",
    pour:"Commerciaux, ADV, assistants commerciaux, SAV, responsables commerciaux et dirigeants qui vendent (B2B/B2C).",
    obj:["Traiter une demande client complexe dans la journée","Produire devis et propositions depuis son gabarit","Désamorcer une réclamation difficile par écrit","Préparer un rendez-vous en 10 minutes","Relancer avec des séquences personnalisées"],
    prog:[{h:"Matin — répondre", s:["40’ Bases express vente + anonymisation client","45’ La demande client complexe traitée le jour même","60’ Devis 3× plus vite : gabarit construit et testé","30’ La réclamation désamorcée par écrit"]},{h:"Après-midi — conquérir", s:["45’ Préparer un RDV en 10 min + jeu de rôle","45’ Séquence de 3 relances qui obtiennent des réponses","60’ Atelier pipeline : on vide les dossiers en attente","35’ Bibliothèque commerciale d’équipe","25’ Clôture"]}],
    roi:"Des propositions 2 à 3× plus rapides. Un seul devis signé en plus rembourse la formation ; le reste de l’année est du gain net." },

  { n:"07", g:"ia", titre:"IA au bureau", accroche:"Documents, courriers, dossiers : produire deux fois plus vite.",
    duree:"1 jour · 7 h", eff:"2 à 15 · 16 à 30", prix:"1 900 € / 3 200 €", prereq:"Aucun · Banque de gabarits remise",
    pour:"Assistant(e)s, secrétariat, gestion, comptabilité/paie, RH, ADV, services généraux, chefs de projet.",
    obj:["Créer ses gabarits de documents et courriers récurrents","Transformer des notes en vrac en document diffusable","Dépouiller un dossier épais : synthèse, échéancier, pièces","Préparer les réponses aux administrations et organismes","Tenir un suivi sans ressaisie"],
    prog:[{h:"Matin — produire", s:["60’ Inventaire des 5 documents récurrents + bases","45’ L’usine à courriers : gabarits à variables","45’ Notes en vrac → document propre","45’ Le dossier épais dépouillé"]},{h:"Après-midi — fiabiliser & suivre", s:["30’ Réactivation + liste rouge renforcée (RH, paie)","60’ Réponses aux administrations (cas réel)","60’ Atelier « mon stock » : 5-8 gabarits (80 % du récurrent)","35’ Suivi sans ressaisie","25’ Clôture"]}],
    roi:"1 à 2 h gagnées par jour sur les postes administratifs. Rentabilisée en ~10 jours ouvrés." },

  { n:"08", g:"ia", titre:"IA sur le terrain", accroche:"Comptes rendus, photos, dictée vocale : tout depuis son téléphone.",
    duree:"1 jour · 7 h", eff:"2 à 15 · 16 à 30", prix:"1 900 € / 3 200 €", prereq:"Aucun — smartphone, aucun ordinateur",
    pour:"Techniciens, ouvriers, chauffeurs, agents d’exploitation, personnel d’atelier, installateurs, maintenance.",
    obj:["Produire un compte rendu structuré à la voix en quittant le site","Rédiger un signalement depuis une photo (constat/cause/action/urgence)","Reformuler un message délicat avant envoi","Comprendre une consigne ou une notice via photo","Boucler le circuit terrain → bureau en autonomie"],
    prog:[{h:"Matin — parler, pas taper", s:["25’ Installation et test du micro","45’ Le compte rendu dicté → CR structuré envoyé","45’ La photo qui parle : signalement","40’ Messages délicats reformulés","40’ Comprendre une notice via photo"]},{h:"Après-midi — ancrer", s:["20’ Sécurité version terrain","60’ Le circuit complet en binômes","60’ Atelier « ma semaine » : raccourcis, retards traités","40’ Documents récurrents en dictée","30’ Clôture (évaluation pratique)"]}],
    roi:"30 à 45 min de paperasse en moins par jour et par personne, et des heures de ressaisie économisées au bureau." },

  { n:"09", g:"ia", titre:"Automatisations IA Découverte", accroche:"Une journée pour voir ce que l’automatisation peut faire pour votre entreprise.",
    duree:"1 jour · 7 h", eff:"2 à 15 · 16 à 30", prix:"1 900 € / 3 200 €", prereq:"Aucun · Plan d’automatisation chiffré",
    pour:"Tout salarié et encadrement, dirigeants invités à la restitution finale, de la TPE à l’ETI.",
    obj:["Expliquer le principe : déclencheur → traitement → action","Identifier les tâches automatisables — et celles qui ne le sont pas","Estimer les gains (temps, délais, erreurs)","Prioriser les 3-5 premières automatisations (matrice gain/difficulté)"],
    prog:[{h:"Matin — comprendre & voir", s:["20’ La tâche que je refais sans cesse","40’ Anatomie d’une automatisation + 3 démos live","45’ Démonstrations sur VOS cas sectoriels","60’ Atelier chasse aux tâches (grille AUTO)","30’ Ce qui ne s’automatise PAS"]},{h:"Après-midi — chiffrer & décider", s:["60’ Chiffrage des gains : heures/an, erreurs, délais","45’ Matrice gain/difficulté : priorisation","60’ Le plan d’action détaillé","45’ Restitution au dirigeant + quiz"]}],
    roi:"Un plan d’automatisation chiffré qui aurait coûté plusieurs jours de conseil — et chaque mauvais investissement évité vaut bien plus que la journée." },

  { n:"10", g:"ia", titre:"IA Intégration métier", accroche:"Vos 5 tâches les plus chronophages transformées avant la fin de la formation.",
    duree:"2 jours · 14 h", eff:"2 à 15 · 16 à 30", prix:"3 600 € / 5 800 €", prereq:"Aucun · Kit d’équipe remis",
    pour:"Tout salarié, idéalement en équipes constituées, managers et responsables d’équipe.",
    obj:["Tout le contenu d’IA Fondamentaux","Transformer réellement ses 3 à 5 tâches chronophages","Vérifier et fiabiliser systématiquement avant diffusion","Contribuer au kit d’équipe et le faire vivre","Transmettre les bonnes pratiques à un collègue"],
    prog:[{h:"Jour 1 — la maîtrise", s:["Tout le programme IA Fondamentaux","Fin J1 : validation des 5 tâches cibles avec le formateur"]},{h:"Jour 2 — la transformation", s:["30’ Réactivation","75’ Tâche 1 transformée, gabarit documenté","90’ Tâches 2-3 (diffusable ET reproductible, testé 2×)","90’ Tâches 4-5, entraide organisée","45’ Fiabilisation transverse","45’ Kit d’équipe finalisé et remis","30’ Clôture + comptage des tâches"]}],
    roi:"Les 5 tâches les plus lourdes de chaque participant accélérées de 50 à 80 %, dès le retour au poste. Gains permanents." },

  { n:"11", g:"ia", titre:"IA & Commercial avancé", accroche:"Tout le cycle de vente passé à l’IA : de la prospection à la signature.",
    duree:"2 jours · 14 h", eff:"2 à 15 · 16 à 30", prix:"3 600 € / 5 800 €", prereq:"Aucun · Biblio commerciale + rituel hebdo",
    pour:"Commerciaux confirmés, responsables/directeurs commerciaux, ADV impliquée dans les offres, dirigeants.",
    obj:["Tout le contenu d’IA & Commercial","Prospecter en série personnalisée, dans les règles","Décortiquer un appel d’offres + matrice de conformité","Produire une proposition différenciante","Dérouler des séquences de relance multi-touches"],
    prog:[{h:"Jour 1 — le cycle complet", s:["40’ Socle express vente","60’ Prospection : mini-campagne de 10 messages","75’ L’appel d’offres décortiqué (sur un vrai AO)","75’ La proposition qui gagne","60’ Relances 4 touches (2 dossiers dormants)","75’ Bibliothèque commerciale v1"]},{h:"Jour 2 — les affaires réelles", s:["30’ Tri du pipeline","165’ Sprint affaires 1 : AO/propales/relances réels","120’ Sprint affaires 2 + comptage","45’ Bibliothèque v2 + rituel hebdo","45’ Clôture"]}],
    roi:"Capacité de prospection et de réponse multipliée à effectif constant. Une seule affaire gagnée rembourse la formation plusieurs fois." },

  { n:"12", g:"ia", titre:"IA Transformation d’équipe", accroche:"Vos processus passés à l’IA, des référents formés, une équipe autonome.",
    duree:"3 jours · 21 h", eff:"2 à 15 · 16 à 30", prix:"4 900 € / 7 900 €", prereq:"Équipe + 1-2 référents · Tableau de bord des gains",
    pour:"Équipe constituée avec 1-2 référents volontaires ; direction présente à la restitution finale.",
    obj:["Tout le contenu d’IA Intégration métier","Outiller un processus de bout en bout (contrôles humains)","Arrêter de payer des abonnements inutiles","Chiffrer ses gains, présentables à la direction","Référents : intégrer les nouveaux et faire vivre les méthodes"],
    prog:[{h:"Jours 1-2 — maîtrise & transformation", s:["Tout le programme IA Intégration métier","5 tâches transformées par personne + kit d’équipe"]},{h:"Jour 3 — l’organisation", s:["30’ Bascule d’échelle","90’ Processus n°1 de bout en bout","90’ Processus n°2 conduit par les référents","45’ Ménage dans les abonnements IA","60’ Tableau de bord des gains (1 page)","45’ Atelier référents","45’ Restitution direction","15’ Clôture"]}],
    roi:"Des processus accélérés en permanence, des référents qui forment les nouveaux, des abonnements inutiles résiliés. L’investissement le plus durable du catalogue." },

  { n:"13", g:"agents", titre:"Agents & Automatisations", accroche:"Créez vos propres automatisations IA, sans savoir coder. Le code reste à l’entreprise.",
    duree:"2 jours · 14 h", eff:"2 à 12 (groupe limité)", prix:"3 600 €", prereq:"PC avec droits d’installation (réglé avec la DSI)",
    pour:"Tout salarié sans connaissance en programmation qui veut créer ses automatisations. L’IA écrit le code en clair.",
    obj:["Spécifier une automatisation en français (fiche de spec)","Faire écrire, lire, tester et corriger le code avec l’IA","Sécuriser les données et les secrets","Livrer une automatisation documentée — propriété de l’entreprise"],
    prog:[{h:"Jour 1 — comprendre & construire", s:["45’ Vérification des environnements","45’ Sans jargon : demander, lire, tester le code","105’ Automatisation collective n°1 (bug corrigé)","45’ Lire sans coder : les 5 questions","75’ Automatisation collective n°2 (gestion d’erreur)","60’ Spécifier MON automatisation","30’ Sécurité : secrets jamais en clair"]},{h:"Jour 2 — chacun la sienne", s:["180’ Sprint de construction individuelle","105’ Fiabiliser + documentation générée","60’ Démonstrations + inventaire remis à la DSI","45’ Clôture"]}],
    roi:"Chaque automatisation fait gagner de 15 min à plusieurs heures par jour, sans coût récurrent. Une tâche quotidienne de 30 min = +100 h/an par participant." },

  { n:"14", g:"agents", titre:"Agents & Automatisations avancé", accroche:"Chacun construit ET déploie son automatisation complète — en fonctionnement le dernier jour.",
    duree:"3 jours · 21 h", eff:"2 à 12 (groupe limité)", prix:"4 900 €", prereq:"Niveau 2 j + lieu d’exécution décidé avec la DSI",
    pour:"Salariés ayant suivi le niveau 2 jours, qui veulent déployer des automatisations robustes en production.",
    obj:["Tout le niveau 2 jours","Étendre : plusieurs étapes, plusieurs outils connectés","Fiabiliser (erreurs, journal, alertes, vérification)","Déployer en exécution récurrente et intervenir","Être autonome pour la prochaine automatisation"],
    prog:[{h:"Jours 1-2 — programme Agents & Automatisations", s:["Les 2 automatisations collectives + la sienne documentée"]},{h:"Jour 3 — robustesse & déploiement", s:["30’ État des automatisations, incidents","90’ Monter en ambition (étape/source en plus)","90’ Fiabilisation : les 4 piliers","75’ Déployer : exécution planifiée + dépôt central","45’ Le test du chaos (3 pannes provoquées)","45’ Démonstrations devant dirigeant/DSI","45’ Autonomie : la prochaine spécifiée SEUL"]}],
    roi:"Des automatisations robustes qui tournent sans surveillance, et la capacité d’en créer chaque mois — chacune aurait coûté plusieurs milliers d’euros en développement externe." },

  { n:"15", g:"claude", titre:"Claude Découverte", accroche:"Découvrir Claude et tout ce qu’il rend possible — par un formateur certifié.",
    duree:"1 jour · 7 h", eff:"2 à 15 · 16 à 30", prix:"2 300 € / 3 850 €", prereq:"Comptes gratuits suffisent",
    pour:"Tout salarié curieux de l’écosystème Claude (Anthropic), dirigeants et décideurs qui veulent évaluer avant d’investir.",
    obj:["Produire et analyser de vrais documents avec Claude","Construire un livrable fini (plan → sections → relecture)","Comprendre l’apport des Projets (instructions + base doc)","Choisir l’outil sur critères démontrés (Claude vs autres)","Appliquer la confidentialité propre à Claude"],
    prog:[{h:"Matin", s:["40’ Claude en 40 min : prise en main","45’ L’analyse de documents (point fort)","45’ Livrables finis : plan → sections → relecture","45’ Les Projets : instructions + base documentaire"]},{h:"Après-midi", s:["45’ Claude vs les autres (3 tâches, factuel)","45’ Confidentialité version Claude","75’ Atelier : 2-3 tâches réelles de sa semaine","45’ Panorama Pro/Team, quiz, clôture"]}],
    roi:"~1 h gagnée par jour et par salarié sur le travail documentaire, avec moins de reprises. Rentabilisée en moins de 2 semaines." },

  { n:"16", g:"claude", titre:"Claude Créateur", accroche:"Chaque participant construit son propre outil IA pour son activité — et repart avec.",
    duree:"2 jours · 14 h", eff:"2 à 12 (groupe limité)", prix:"4 300 €", prereq:"Comptes Claude Pro/Team actifs avant J1",
    pour:"Tout salarié qui veut construire son assistant Claude sur ses vrais dossiers. Formateur certifié.",
    obj:["Tout le contenu de Claude Découverte","Construire son assistant personnalisé (métier, ton, formats)","Organiser ses espaces : un projet par activité","Industrialiser ses tâches récurrentes (gabarits validés)","Protéger les données sensibles"],
    prog:[{h:"Jour 1 — maîtriser l’environnement", s:["60’ Socle Claude condensé","105’ Mon premier Projet (instructions + base doc)","90’ Les 5 blocs d’instructions permanentes","90’ Industrialiser ses tâches récurrentes","30’ Préparation J2"]},{h:"Jour 2 — mes vrais dossiers", s:["165’ Sprint dossiers réels 1","90’ Sprint 2 + partage d’équipe","60’ Revue de l’outil sur grille","60’ Démonstrations + doc de duplication"]}],
    roi:"L’assistant configuré supprime la remise en contexte : les tâches récurrentes passent de 30 min à 5 min. Un actif qui reste dans l’entreprise." },

  { n:"17", g:"claude", titre:"Claude Architecte", accroche:"Son outil IA complet — assistant, automatisations, espaces de travail — opérationnel le dernier jour.",
    duree:"3 jours · 21 h", eff:"2 à 12 (groupe limité)", prix:"5 900 €", prereq:"Comptes Pro/Team + flux réels identifiés",
    pour:"Salariés avec un usage régulier de Claude, qui veulent connecter leur outil à leurs flux réels et le faire évoluer seuls.",
    obj:["Tout le contenu de Claude Créateur","Connecter l’outil au travail réel (documents, flux entrants)","Construire ses premières automatisations Claude","Fiabiliser et faire évoluer seul (versionnage, revue)"],
    prog:[{h:"Jours 1-2 — programme Claude Créateur", s:["Projet, instructions permanentes, gabarits, vrais dossiers"]},{h:"Jour 3 — l’outil complet", s:["30’ Frictions de la veille traitées","90’ Connecter l’outil : la « tournée du matin »","90’ Automatiser DANS Claude (séquences)","75’ Fiabiliser : le test des 3 pièges","60’ Frontières : Claude / code source / clé en main","45’ Démonstrations finales + doc de duplication","30’ Clôture"]}],
    roi:"Un outil complet par participant, qui aurait coûté plusieurs milliers d’euros développé pour lui — et qu’il sait faire évoluer seul. L’actif reste, le gain se cumule." },
];

// ---- COACHING 1-TO-1 (2 formules) ----
const ONE = [
  { titre:"Dirigeant · Vision IA stratégique", accroche:"Une journée en tête-à-tête pour ouvrir les yeux du dirigeant sur les opportunités IA de son secteur.",
    duree:"1 journée (7 h) — 2 jours possible", eff:"1 dirigeant (1-to-1)", prix:"1 390 € /jour · 2 jours 2 590 €", prereq:"Aucun · sur site",
    pour:"Dirigeants et fondateurs de TPE, PME et ETI qui veulent une lecture IA claire de leur activité, sans jargon.",
    obj:["Cartographier l’activité et repérer les opportunités IA du secteur","Prioriser par impact et faisabilité","Chiffrer les gains de temps et de coûts","Repartir avec une feuille de route d’implémentation"],
    prog:[{h:"Déroulé type d’une journée", s:["Matin — diagnostic 1-to-1 et cartographie de l’entreprise","Démonstrations IA en direct sur vos cas réels","Après-midi — priorisation impact / faisabilité","Feuille de route chiffrée (temps & coûts)","Restitution à chaud et prochaines étapes"]}],
    roi:"Le dirigeant décide sur pièces : quoi lancer, dans quel ordre, pour quel gain. Format AFEST, éligible au financement de la formation professionnelle." },

  { titre:"Collaborateur · Optimisation du poste", accroche:"Une journée en tête-à-tête pour faire monter un collaborateur clé en compétence sur ses propres cas.",
    duree:"1 journée (7 h) — 2 jours possible", eff:"1 collaborateur (1-to-1)", prix:"990 € /jour · 2 jours 1 830 €", prereq:"Aucun · sur site",
    pour:"Collaborateurs clés (bureau, opérations, support, gestion) dont on veut optimiser le poste avec l’IA et l’automatisation.",
    obj:["Cartographier le fonctionnement du poste et ses irritants","Transformer ses tâches réelles avec l’IA","Bâtir un plan d’automatisation pour gagner du temps","Ancrer des réflexes durables (gabarits, méthode)"],
    prog:[{h:"Déroulé type d’une journée", s:["Matin — cartographie du poste et des tâches réelles","Mises en situation sur les vrais dossiers du collaborateur","Après-midi — plan d’automatisation métier","Gabarits et méthode réutilisables","Restitution et engagement de suivi"]}],
    roi:"Le collaborateur repart avec ses propres tâches transformées et un plan concret. Format AFEST (formation en situation de travail), éligible au financement." },
];

// ---- AUDIT (4 formats) ----
const AUDIT = [
  { titre:"Audit IA sur place", sous:"1 journée complète · sur site · livrables sous 48 h", prix:"1 190 € HT",
    accroche:"Savoir si l’IA peut vraiment vous aider — sans engagement long. Un diagnostic complet en une journée, sur place.",
    pour:"TPE, artisans, commerçants et PME qui veulent un premier diagnostic IA concret et rapide.",
    chips:["Cartographie d’une zone d’usage","Démos live sur vos vrais cas","Plan d’action sous 48 h","Confidentialité totale"],
    prog:[{h:"Comment se déroule votre journée", s:["Café & cadrage des objectifs","Diagnostic sur site (observation, entretiens)","Démos live de l’IA sur 2-3 cas réels","Priorisation & quick-wins par impact/facilité","Restitution à chaud : vision claire, pas un rapport théorique","Sous 48 h — plan d’action chiffré envoyé"]}],
    liv:["Rapport d’audit de 8 à 15 pages","Bibliothèque de prompts testés, prêts à réutiliser","3 à 5 quick-wins priorisés, activables tout de suite"] },

  { titre:"Audit Ciblé", sous:"1 département · 3 semaines", prix:"1 900 → 3 900 € HT",
    accroche:"Un audit IA focalisé sur un département précis (marketing, RH, ops, finance, juridique, support).",
    pour:"PME et ETI qui veulent transformer un département en profondeur, avec un plan chiffré.",
    chips:["Cartographie complète du département","Scoring opportunités ROI / complexité","Plan chiffré 3-12 mois","Souveraineté & RGPD"],
    prog:[{h:"3 phases sur 3 à 4 semaines", s:["Phase 1 — Cadrage + interviews terrain","Phase 2 — Cartographie & scoring des opportunités","Phase 3 — Restitution + plan d’exécution priorisé"]}],
    liv:["Cartographie complète du département","Scoring ROI / complexité des opportunités","Plan d’exécution priorisé sur 3 à 12 mois"],
    sub:["Solo — 1 900 € HT","Standard — 2 900 € HT","Avancé — 3 900 € HT"] },

  { titre:"Audit Stratégique PME", sous:"multi-départements · roadmap 12-24 mois", prix:"À partir de 4 900 € HT · sur devis",
    accroche:"Une vision IA d’entreprise chiffrée sur 12 à 24 mois, avec quick-wins déployables sous 30 jours.",
    pour:"PME de 20 à 250 salariés qui veulent une trajectoire IA à l’échelle de toute l’entreprise.",
    chips:["Cartographie multi-départements","Vision IA 12-24 mois chiffrée","Quick-wins déployables sous 30 jours","Conformité AI Act + RGPD by default"],
    prog:[{h:"Déroulé", s:["Cadrage + 8 à 12 interviews","Cartographie + benchmark + scoring","Plan d’exécution + restitution COMEX"]}],
    liv:["Cartographie multi-départements","Roadmap IA chiffrée 12-24 mois","Restitution COMEX + plan d’exécution"] },

  { titre:"Audit Stratégique ETI", sous:"transverse · gouvernance · board-ready", prix:"Sur devis",
    accroche:"Un audit transverse multi-BU, avec gouvernance IA, livrables board-ready et accompagnement post-audit inclus.",
    pour:"ETI et grandes entreprises (250 à 5000+ salariés) qui structurent leur stratégie IA au niveau board.",
    chips:["Audit transverse multi-BU","Gouvernance IA + comité de pilotage","Livrables board-ready","Accompagnement post-audit inclus"],
    prog:[{h:"Déroulé", s:["Cadrage exécutif + interviews multi-BU","Cartographie + benchmark + scoring","Plan stratégique + gouvernance + restitution board"]}],
    liv:["Cartographie transverse multi-BU","Cadre de gouvernance IA + comité de pilotage","Plan stratégique board-ready + accompagnement post-audit"] },
];

// ---------------- RENDU ----------------
const esc = (s) => String(s);
let PAGES = [];
const add = (html) => PAGES.push(html);

function foot(num) {
  return `<div class="foot">
    <div class="foot-l"><b>${BRAND.nom}</b> · ${BRAND.site} · Organisme de formation & conseil IA</div>
    <div class="foot-c">${num}</div>
    <div class="foot-r"><img class="qmini" src="assets/qualiopi.png" onerror="this.style.display='none'"><span>Actions <b>finançables à 100 %</b> par votre OPCO</span></div>
  </div>`;
}
function typeBadge(kind) {
  const map = { formation:["FORMATION","t-form"], "1to1":["COACHING 1-TO-1","t-one"], audit:["AUDIT","t-aud"] };
  const [label, cls] = map[kind];
  return `<span class="tbadge ${cls}">${label}</span>`;
}

// Bandeau « Ils nous font confiance » ÉTEINT le 2026-10-09 (message de la DGCCRF,
// décision de Will). Repasser à true seulement avec de vrais clients ayant donné
// leur accord écrit, et remplacer la liste CLIENTS en conséquence.
const AFFICHER_LOGOS_CLIENTS = false;

// clients strip
function clientsStrip(dark) {
  return `<div class="cbar ${dark?'cbar-d':''}">` +
    CLIENTS.map(([slug,name]) => `<img src="assets/clients/${slug}.svg" alt="${name}" onerror="this.replaceWith(document.createTextNode('${name}'))">`).join("") +
    `</div>`;
}

// ---- P1 COUVERTURE ----
add(`<div class="page cover">
  <div class="cover-top">
    <img class="cov-logo" src="assets/axion-blanc.webp" alt="Axion-IA" onerror="this.style.display='none'">
    <div class="cov-year">CATALOGUE 2026</div>
  </div>
  <div class="cover-mid">
    <div class="cov-kicker">Formations · Coaching 1-to-1 · Audits</div>
    <h1 class="cov-title">L’IA appliquée à votre entreprise,<br><span>par ceux qui la mettent en production.</span></h1>
    <p class="cov-sub">17 formations intra-entreprise, un coaching dirigeant en tête-à-tête et 4 formats d’audit. Sur site, sur vos vrais cas — pas de théorie hors-sol.</p>
    <div class="cov-pills">
      <span>Sur site, sur vos cas</span><span>70 % de pratique</span><span>Formateur certifié Claude</span>
    </div>
  </div>
  ${AFFICHER_LOGOS_CLIENTS ? `<div class="cover-clients">
    <div class="cov-clab">Ils nous font confiance</div>
    ${clientsStrip(false)}
  </div>` : ""}
  <div class="cover-band">
    <div class="cb-q"><img src="assets/qualiopi.png" onerror="this.style.display='none'"><div><b>Certifié Qualiopi</b><br><span>Actions de formation</span></div></div>
    <div class="cb-opco"><b>Financé à 100 %</b> par votre OPCO</div>
  </div>
</div>`);

// ---- P2 ÉDITO ----
add(`<div class="page pad">
  <div class="eyebrow">Le parti pris</div>
  <h2 class="h2">On ne vend pas des slides. On transforme des façons de travailler.</h2>
  <p class="lead">La plupart des formations IA laissent les équipes avec des concepts. Nous, on repart de vos vraies tâches : chaque participant produit dès la séance, sur ses propres dossiers, et l’entreprise garde un actif — gabarits, chartes, kits, outils configurés, code source.</p>
  <div class="grid4">
    <div class="stat"><div class="stat-n">17</div><div class="stat-l">formations, de 4 h à 3 jours</div></div>
    <div class="stat"><div class="stat-n">70 %</div><div class="stat-l">de pratique minimum</div></div>
    <div class="stat"><div class="stat-n">3</div><div class="stat-l">métiers : former, accompagner, auditer</div></div>
    <div class="stat"><div class="stat-n">100 %</div><div class="stat-l">sur site, dans vos locaux</div></div>
  </div>
  <div class="two">
    <div>
      <h3 class="h3">Ce qui nous distingue</h3>
      <ul class="check">
        <li><b>Sur vos vrais cas.</b> On travaille vos dossiers, votre pipeline, vos courriers — pas des exemples génériques.</li>
        <li><b>Ce qui reste à l’entreprise.</b> Chaque formation produit un livrable réutilisable, indépendant des personnes.</li>
        <li><b>Formateur certifié Claude (Anthropic).</b> Une expertise rare en France sur l’écosystème le plus avancé.</li>
        <li><b>Sécurité & conformité intégrées.</b> Liste rouge, anonymisation, charte d’usage, cadrage AI Act.</li>
      </ul>
    </div>
    <div>
      <h3 class="h3">Votre parcours</h3>
      <div class="steps">
        <div class="step"><span>1</span><div><b>Diagnostic</b><br>Audit ou cadrage : on repère où l’IA fait gagner du temps.</div></div>
        <div class="step"><span>2</span><div><b>Montée en compétence</b><br>Formations collectives ou coaching 1-to-1, sur vos tâches.</div></div>
        <div class="step"><span>3</span><div><b>Autonomie</b><br>Référents internes, kits et outils : l’équipe continue seule.</div></div>
      </div>
      <div class="callout"><b>Financement.</b> Nos actions de formation sont <b>finançables à 100 % par votre OPCO</b> (prise en charge selon votre branche et votre solde).</div>
    </div>
  </div>
  ${foot(2)}
</div>`);

// ---- P3 SOMMAIRE ----
const somm = [
  ["Le parti pris", "02"],["Nos 3 métiers", "04 – 06"],["Financement & déroulé", "07"],["Tous les secteurs", "08"],
  ["Formations — les 17 programmes", "09 – 25"],["Coaching 1-to-1", "26 – 27"],["Audits IA", "28 – 31"],["Nous contacter", "32"],
];
add(`<div class="page pad">
  <div class="eyebrow">Sommaire</div>
  <h2 class="h2">Ce que vous trouverez dans ce catalogue</h2>
  <div class="somm">
    ${somm.map(([t,p]) => `<div class="somm-row"><span class="somm-t">${t}</span><span class="somm-d"></span><span class="somm-p">${p}</span></div>`).join("")}
  </div>
  <div class="two mt">
    <div class="minicard t-form-b"><div class="mc-k">${typeBadge("formation")}</div><h3 class="h3">Formations</h3><p>17 programmes intra-entreprise, 3 gammes, de 4 h à 3 jours. Dès 1 200 € HT / groupe.</p></div>
    <div class="minicard t-one-b"><div class="mc-k">${typeBadge("1to1")}</div><h3 class="h3">Coaching 1-to-1</h3><p>Dirigeant ou collaborateur clé, une journée en tête-à-tête. Dès 990 € HT / jour.</p></div>
  </div>
  <div class="minicard wide t-aud-b"><div class="mc-k">${typeBadge("audit")}</div><h3 class="h3">Audits IA</h3><p>4 formats, de la journée sur site (1 190 € HT, livrables sous 48 h) à l’audit stratégique board-ready.</p></div>
  ${foot(3)}
</div>`);

// ---- P4-6 ACTIVITÉS ----
function activityPage(kind, num, photo, title, sub, body, priceLine) {
  return `<div class="page act ${kind}">
    <div class="act-photo" style="background-image:url('assets/photos/${photo}')"></div>
    <div class="act-body">
      <div class="act-badge">${typeBadge(kind)}</div>
      <h2 class="act-title">${title}</h2>
      <p class="act-sub">${sub}</p>
      ${body}
      <div class="act-price">${priceLine}</div>
    </div>
    ${foot(num)}
  </div>`;
}
add(activityPage("formation", 4, "formations.webp", "Formations intra-entreprise",
  "Vos équipes montent en compétence sur leurs vraies tâches, dans vos locaux. 17 programmes, 3 gammes, sans prérequis (sauf mention).",
  `<div class="gammes">
     <div class="gam"><b>IA Standard</b><span>12 formations · 4 h → 3 jours · prise en main, montée en compétence, transformation des tâches et des processus.</span></div>
     <div class="gam"><b>Agents & Automatisations</b><span>2 formations · groupe ≤ 12 · créer et déployer ses automatisations en code source, propriété de l’entreprise.</span></div>
     <div class="gam"><b>Claude — formateur certifié</b><span>3 formations · évaluer, construire et industrialiser son outil dans l’écosystème Claude (Anthropic).</span></div>
   </div>
   <ul class="check tight"><li>Sur site, sur vos vrais cas · 70 % de pratique</li><li>Un livrable réutilisable qui reste à l’entreprise</li><li>Finançable à 100 % par votre OPCO</li></ul>`,
  "<em>À partir de</em> 1 200 € HT / groupe · jusqu’à 30 personnes"));

add(activityPage("1to1", 5, "coaching.webp", "Coaching 1-to-1",
  "Un accompagnement en tête-à-tête, sur site, pour un dirigeant ou un collaborateur clé. Format AFEST (formation en situation de travail).",
  `<div class="gammes">
     <div class="gam"><b>Dirigeant · Vision IA stratégique</b><span>Ouvrir les yeux du dirigeant sur les opportunités IA de son secteur, chiffrer les gains, repartir avec une feuille de route.</span></div>
     <div class="gam"><b>Collaborateur · Optimisation du poste</b><span>Faire monter un collaborateur clé sur ses propres cas : cartographie du poste, tâches transformées, plan d’automatisation.</span></div>
   </div>
   <ul class="check tight"><li>1 à 2 jours · 100 % personnalisé</li><li>Sur les vrais dossiers de la personne</li><li>Éligible au financement de la formation</li></ul>`,
  "<em>À partir de</em> 1 390 € HT/jour (dirigeant) · 990 € HT/jour (collaborateur)"));

add(activityPage("audit", 6, "audit.webp", "Audits IA",
  "Un diagnostic clair de ce que l’IA peut vous rapporter, avec un plan d’action chiffré. De la journée sur site à l’audit stratégique board-ready.",
  `<div class="gammes">
     <div class="gam"><b>Audit sur place</b><span>1 journée sur site, livrables sous 48 h — rapport, prompts testés, quick-wins.</span></div>
     <div class="gam"><b>Audit Ciblé</b><span>1 département, 3 semaines : cartographie, scoring ROI, plan chiffré.</span></div>
     <div class="gam"><b>Audit Stratégique</b><span>PME multi-départements ou ETI transverse : roadmap 12-24 mois, gouvernance, board-ready.</span></div>
   </div>
   <ul class="check tight"><li>Confidentialité totale · souveraineté & RGPD</li><li>Un livrable actionnable, pas un rapport théorique</li><li>Quick-wins activables tout de suite</li></ul>`,
  "<em>De</em> 1 190 € HT (journée) <em>à</em> sur devis (stratégique)"));

// ---- P7 FINANCEMENT & DÉROULÉ ----
add(`<div class="page pad">
  <div class="eyebrow">Passer à l’action</div>
  <h2 class="h2">Financement OPCO & comment on démarre</h2>
  <div class="two">
    <div>
      <h3 class="h3">Finançable à 100 % par votre OPCO</h3>
      <p>En tant qu’organisme de formation certifié Qualiopi, nos actions de formation sont <b>prises en charge par les OPCO</b>. Selon votre branche professionnelle et votre solde disponible, le reste à charge peut être nul.</p>
      <ul class="check">
        <li><b>On monte le dossier avec vous.</b> Convention, programme, émargement, attestations : tout est fourni.</li>
        <li><b>Demande de prise en charge</b> déposée auprès de votre OPCO avant la formation.</li>
        <li><b>Devis sous 24-48 h</b> après un court cadrage.</li>
      </ul>
      <div class="callout"><b>Bon à savoir.</b> Le coaching 1-to-1 est conçu en format <b>AFEST</b> (formation en situation de travail) — également éligible au financement.</div>
    </div>
    <div>
      <h3 class="h3">4 étapes, sans friction</h3>
      <div class="steps">
        <div class="step"><span>1</span><div><b>Cadrage (15-30 min)</b><br>On comprend vos objectifs, vos postes, vos contraintes.</div></div>
        <div class="step"><span>2</span><div><b>Devis + dossier OPCO</b><br>Proposition chiffrée et montage du financement.</div></div>
        <div class="step"><span>3</span><div><b>La formation, sur site</b><br>Sur vos vrais cas, 70 % de pratique.</div></div>
        <div class="step"><span>4</span><div><b>Suivi & autonomie</b><br>Kits, référents internes, attestations.</div></div>
      </div>
      <div class="minicard mt t-form-b"><h3 class="h3">Prêt à démarrer ?</h3><p>Un échange de 15 minutes suffit pour identifier la formule adaptée et lancer le financement.</p><div class="cta">${BRAND.site} · ${BRAND.email}</div></div>
    </div>
  </div>
  ${foot(7)}
</div>`);

// ---- P8 SECTEURS ----
add(`<div class="page pad">
  <div class="eyebrow">Tous secteurs</div>
  <h2 class="h2">Nous intervenons dans tous les secteurs d’activité</h2>
  <p class="lead">Nos formations et audits s’adaptent à votre métier : on part de vos vrais cas, quel que soit votre secteur. TPE, PME, ETI et grandes entreprises.</p>
  <div class="sectors">
    ${SECTORS.map(s => `<div class="sector">${s}</div>`).join("")}
  </div>
  <div class="two mt">
    <div class="minicard"><h3 class="h3">Des packs sectoriels</h3><p>BTP, santé, immobilier, expertise comptable, hôtellerie-restauration, industrie, juridique, transport-logistique, collectivités, commerce : des cas d’usage prêts à l’emploi par secteur.</p></div>
    <div class="minicard"><h3 class="h3">4 tailles d’entreprise</h3><p>De l’artisan et la TPE (2-15 personnes) à l’ETI et la grande entreprise (jusqu’à 30 par session, groupe ≤ 12 pour les gammes avancées).</p></div>
  </div>
  ${foot(8)}
</div>`);

// ---- P9-25 FORMATIONS ----
let pageNo = 9;
for (const f of FORMATIONS) {
  const feat = f.featured ? `<span class="feat">★ À la une</span>` : "";
  add(`<div class="page detail">
    <div class="det-banner t-form">${typeBadge("formation")}<span class="ban-gamme">${GAMME[f.g]}</span>${feat}<span class="ban-no">Formation ${f.n}/17</span></div>
    <div class="det-head">
      <h2 class="det-title">${f.titre}</h2>
      <p class="det-accroche">${f.accroche}</p>
    </div>
    <div class="det-facts">
      <div class="fact"><span>Durée</span><b>${f.duree}</b></div>
      <div class="fact"><span>Effectif</span><b>${f.eff}</b></div>
      <div class="fact price"><span>Tarif HT / groupe</span><b>${f.prix}</b></div>
      <div class="fact"><span>Prérequis</span><b>${f.prereq}</b></div>
    </div>
    <div class="det-cols">
      <div class="det-main">
        <h3 class="h3">Objectifs — ce que chacun saura faire</h3>
        <ul class="check">${f.obj.map(o=>`<li>${o}</li>`).join("")}</ul>
        <h3 class="h3">Programme</h3>
        <div class="prog">${f.prog.map(p=>`<div class="prog-b"><div class="prog-h">${p.h}</div><ul>${p.s.map(x=>`<li>${x}</li>`).join("")}</ul></div>`).join("")}</div>
      </div>
      <div class="det-side">
        <div class="side-b"><div class="side-t">Pour qui</div><p>${f.pour}</p></div>
        <div class="side-b roi"><div class="side-t">Retour sur investissement</div><p>${f.roi}</p></div>
        <div class="side-b"><div class="side-t">Modalités</div><p>Présentiel dans vos locaux — distanciel possible. Pédagogie active, quiz de clôture, attestation. Accessible aux situations de handicap (référent dédié).</p></div>
      </div>
    </div>
    ${foot(pageNo++)}
  </div>`);
}

// ---- P26-27 1-TO-1 ----
for (const f of ONE) {
  add(`<div class="page detail">
    <div class="det-banner t-one">${typeBadge("1to1")}<span class="ban-gamme">Accompagnement individuel · AFEST</span><span class="ban-no">Sur site</span></div>
    <div class="det-head"><h2 class="det-title">${f.titre}</h2><p class="det-accroche">${f.accroche}</p></div>
    <div class="det-facts">
      <div class="fact"><span>Durée</span><b>${f.duree}</b></div>
      <div class="fact"><span>Format</span><b>${f.eff}</b></div>
      <div class="fact price"><span>Tarif HT</span><b>${f.prix}</b></div>
      <div class="fact"><span>Prérequis</span><b>${f.prereq}</b></div>
    </div>
    <div class="det-cols">
      <div class="det-main">
        <h3 class="h3">Objectifs</h3>
        <ul class="check">${f.obj.map(o=>`<li>${o}</li>`).join("")}</ul>
        <h3 class="h3">Déroulé</h3>
        <div class="prog">${f.prog.map(p=>`<div class="prog-b"><div class="prog-h">${p.h}</div><ul>${p.s.map(x=>`<li>${x}</li>`).join("")}</ul></div>`).join("")}</div>
      </div>
      <div class="det-side">
        <div class="side-b"><div class="side-t">Pour qui</div><p>${f.pour}</p></div>
        <div class="side-b roi"><div class="side-t">Bénéfice</div><p>${f.roi}</p></div>
        <div class="side-b"><div class="side-t">Modalités</div><p>100 % personnalisé, sur site, sur les vrais dossiers de la personne. Attestation de fin. Éligible au financement de la formation.</p></div>
      </div>
    </div>
    ${foot(pageNo++)}
  </div>`);
}

// ---- P28-31 AUDIT ----
for (const a of AUDIT) {
  add(`<div class="page detail">
    <div class="det-banner t-aud">${typeBadge("audit")}<span class="ban-gamme">${a.sous}</span><span class="ban-no">Audit</span></div>
    <div class="det-head"><h2 class="det-title">${a.titre}</h2><p class="det-accroche">${a.accroche}</p></div>
    <div class="det-facts">
      <div class="fact price wide"><span>Tarif HT</span><b>${a.prix}</b></div>
      ${a.sub ? `<div class="fact"><span>Sous-formats</span><b>${a.sub.join(" · ")}</b></div>` : `<div class="fact"><span>Format</span><b>${a.sous}</b></div>`}
    </div>
    <div class="chips">${a.chips.map(c=>`<span>${c}</span>`).join("")}</div>
    <div class="det-cols">
      <div class="det-main">
        <h3 class="h3">Déroulé</h3>
        <div class="prog">${a.prog.map(p=>`<div class="prog-b"><div class="prog-h">${p.h}</div><ul>${p.s.map(x=>`<li>${x}</li>`).join("")}</ul></div>`).join("")}</div>
      </div>
      <div class="det-side">
        <div class="side-b"><div class="side-t">Pour qui</div><p>${a.pour}</p></div>
        <div class="side-b roi"><div class="side-t">Ce que vous repartez avec</div><ul class="check sm">${a.liv.map(l=>`<li>${l}</li>`).join("")}</ul></div>
        <div class="side-b"><div class="side-t">Engagement</div><p>Confidentialité totale, souveraineté des données et conformité RGPD. Un livrable directement actionnable.</p></div>
      </div>
    </div>
    ${foot(pageNo++)}
  </div>`);
}

// ---- P32 DOS ----
add(`<div class="page back">
  <div class="back-top">
    <img class="cov-logo" src="assets/axion-blanc.webp" onerror="this.style.display='none'">
  </div>
  <div class="back-mid">
    <h2 class="back-h">Parlons de vos équipes.</h2>
    <p class="back-sub">Un échange de 15 minutes suffit pour identifier la bonne formule et lancer votre financement OPCO. Devis sous 24-48 h.</p>
    <div class="back-contact">
      <div><span>Site</span><b>${BRAND.site}</b></div>
      <div><span>E-mail</span><b>${BRAND.email}</b></div>
    </div>
    <div class="back-pills"><span>Formations</span><span>Coaching 1-to-1</span><span>Audits IA</span></div>
  </div>
  ${AFFICHER_LOGOS_CLIENTS ? `<div class="cover-clients back-clients">
    <div class="cov-clab">Ils nous font confiance</div>${clientsStrip(false)}
  </div>` : ""}
  <div class="cover-band">
    <div class="cb-q"><img src="assets/qualiopi.png" onerror="this.style.display='none'"><div><b>Certifié Qualiopi</b><br><span>Actions de formation</span></div></div>
    <div class="cb-opco"><b>Financé à 100 %</b> par votre OPCO</div>
  </div>
</div>`);

// ---------------- CSS ----------------
const CSS = `
:root{
  --ink:#171310; --ink2:#3b332c; --muted:#6b6157; --paper:#ffffff; --paper2:#faf6ef; --paper3:#f2ebe0;
  --line:#e7ddce; --orange:#e14a1b; --orange-d:#b5371a; --form:#e14a1b; --one:#1d4e6f; --aud:#0f766e; --gold:#caa24a;
}
*{box-sizing:border-box;margin:0;padding:0}
html{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body{ font-family:"Inter","Segoe UI",Arial,sans-serif; color:var(--ink); background:#d8d2c8; }
@page{ size:A4; margin:0; }
.page{ position:relative; width:210mm; height:297mm; background:var(--paper); overflow:hidden; page-break-after:always; }
.page:last-child{ page-break-after:auto; }
h1,h2,h3,.h2,.h3,.det-title,.act-title,.cov-title,.back-h{ font-family:"Fraunces","Playfair Display",Georgia,serif; font-weight:600; letter-spacing:-.01em; }
b{font-weight:700}

/* Footer */
.foot{ position:absolute; left:14mm; right:14mm; bottom:7mm; display:flex; align-items:center; justify-content:space-between;
  font-size:8pt; color:var(--muted); border-top:1px solid var(--line); padding-top:3mm; }
.foot-l b{color:var(--ink2)} .foot-c{ font-weight:700; color:var(--ink2) }
.foot-r{ display:flex; align-items:center; gap:2mm } .foot-r b{color:var(--orange-d)}
.qmini{ height:8mm; width:auto; object-fit:contain }

/* Padded content page */
.pad{ padding:16mm 14mm 20mm; }
.eyebrow{ font-size:9pt; letter-spacing:.22em; text-transform:uppercase; color:var(--orange-d); font-weight:700; margin-bottom:5mm; }
.h2{ font-size:26pt; line-height:1.08; margin-bottom:5mm; }
.h3{ font-size:13pt; margin:6mm 0 3mm; }
.lead{ font-size:11.5pt; line-height:1.5; color:var(--ink2); max-width:165mm; }
.mt{ margin-top:7mm; }

/* Cover */
.cover{ background:linear-gradient(160deg,#1c1712 0%,#241b13 45%,#3a2415 100%); color:#f6efe6; padding:15mm 14mm 0; display:flex; flex-direction:column; }
.cover-top{ display:flex; justify-content:space-between; align-items:center; }
.cov-logo{ height:16mm; width:auto; object-fit:contain }
.cov-year{ font-size:10pt; letter-spacing:.28em; color:#e7c9a3; font-weight:700 }
.cover-mid{ margin-top:20mm; flex:1 }
.cov-kicker{ font-size:11pt; letter-spacing:.2em; text-transform:uppercase; color:var(--orange); font-weight:700 }
.cov-title{ font-size:40pt; line-height:1.05; margin:6mm 0 6mm; }
.cov-title span{ color:#f0b483 }
.cov-sub{ font-size:12.5pt; line-height:1.55; color:#d9cbb b; color:#d9cbbb; max-width:150mm }
.cov-pills{ display:flex; gap:3mm; margin-top:8mm; flex-wrap:wrap }
.cov-pills span{ border:1px solid #6a4e34; color:#f0dcc4; border-radius:999px; padding:2.5mm 5mm; font-size:9.5pt }
.cover-clients{ margin-bottom:5mm }
.cov-clab{ font-size:8.5pt; letter-spacing:.2em; text-transform:uppercase; color:#a98d6f; margin-bottom:3mm; text-align:center }
.cbar{ background:#fff; border-radius:4mm; padding:5mm 6mm; display:flex; flex-wrap:wrap; gap:6mm 8mm; align-items:center; justify-content:center }
.cbar img{ height:7mm; max-width:26mm; width:auto; object-fit:contain; filter:grayscale(1); opacity:.72 }
.cover-band{ background:#0f0b08; margin:0 -14mm; padding:6mm 14mm; display:flex; justify-content:space-between; align-items:center }
.cb-q{ display:flex; align-items:center; gap:3mm; font-size:9pt; color:#e9dcc9 }
.cb-q img{ height:12mm; background:#fff; border-radius:2mm; padding:1mm }
.cb-q b{ color:#fff } .cb-q span{ color:#b49a7c }
.cb-opco{ font-size:12pt; color:#fff } .cb-opco b{ color:var(--orange) }

/* Édito */
.grid4{ display:grid; grid-template-columns:repeat(4,1fr); gap:4mm; margin:7mm 0 8mm }
.stat{ background:var(--paper2); border:1px solid var(--line); border-radius:3mm; padding:5mm }
.stat-n{ font-family:"Fraunces",Georgia,serif; font-size:26pt; color:var(--orange-d); line-height:1 }
.stat-l{ font-size:9pt; color:var(--muted); margin-top:2mm }
.two{ display:grid; grid-template-columns:1fr 1fr; gap:9mm }
.check{ list-style:none } .check li{ position:relative; padding-left:7mm; margin-bottom:3mm; font-size:10.5pt; line-height:1.45; color:var(--ink2) }
.check li::before{ content:""; position:absolute; left:0; top:2mm; width:3.4mm; height:3.4mm; border-radius:50%; background:var(--orange); }
.check.tight li{ font-size:10pt; margin-bottom:2mm } .check.sm li{ font-size:9.5pt; margin-bottom:2mm; padding-left:6mm } .check.sm li::before{width:2.6mm;height:2.6mm;top:1.8mm}
.steps{ margin-top:2mm } .step{ display:flex; gap:4mm; margin-bottom:4mm; align-items:flex-start }
.step span{ flex:none; width:8mm; height:8mm; border-radius:50%; background:var(--ink); color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center; font-size:11pt }
.step div{ font-size:10pt; line-height:1.4; color:var(--ink2) }
.callout{ margin-top:6mm; background:#fdf1e9; border-left:3px solid var(--orange); border-radius:2mm; padding:4mm 5mm; font-size:10pt; line-height:1.45; color:var(--ink2) }

/* Sommaire */
.somm{ margin:6mm 0 }
.somm-row{ display:flex; align-items:baseline; gap:3mm; padding:3.5mm 0; border-bottom:1px solid var(--line); font-size:12pt }
.somm-t{ font-weight:600; color:var(--ink) } .somm-d{ flex:1; border-bottom:1px dotted #cfc3b0; transform:translateY(-1mm) }
.somm-p{ color:var(--orange-d); font-weight:700; font-variant-numeric:tabular-nums }
.minicard{ background:var(--paper2); border:1px solid var(--line); border-radius:3mm; padding:5mm; }
.minicard.wide{ margin-top:5mm } .minicard p{ font-size:10pt; color:var(--ink2); line-height:1.45; margin-top:1mm }
.mc-k{ margin-bottom:2mm }
.minicard .cta{ margin-top:3mm; font-weight:700; color:var(--orange-d); font-size:10pt }
.t-form-b{ border-top:3px solid var(--form) } .t-one-b{ border-top:3px solid var(--one) } .t-aud-b{ border-top:3px solid var(--aud) }

/* Type badges */
.tbadge{ display:inline-block; font-size:8.5pt; font-weight:800; letter-spacing:.14em; padding:1.6mm 3.4mm; border-radius:999px; color:#fff }
.t-form .tbadge, .tbadge.t-form{ background:var(--form) } .t-one .tbadge, .tbadge.t-one{ background:var(--one) } .t-aud .tbadge, .tbadge.t-aud{ background:var(--aud) }

/* Activity pages */
.act{ display:flex; flex-direction:column }
.act-photo{ height:120mm; background-size:cover; background-position:center; position:relative }
.act-photo::after{ content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(20,15,10,.15),rgba(20,15,10,.55)) }
.act-body{ padding:10mm 14mm 0; flex:1 }
.act .act-badge{ margin-bottom:4mm } .act-title{ font-size:30pt; line-height:1.05 } .act-sub{ font-size:12pt; color:var(--ink2); line-height:1.5; margin:4mm 0 6mm; max-width:170mm }
.gammes{ display:flex; flex-direction:column; gap:3mm; margin-bottom:5mm }
.gam{ background:var(--paper2); border:1px solid var(--line); border-left:3px solid var(--orange); border-radius:2mm; padding:4mm 5mm }
.gam b{ font-size:11pt } .gam span{ display:block; font-size:9.5pt; color:var(--muted); margin-top:1mm; line-height:1.4 }
.act-price{ position:absolute; bottom:20mm; left:14mm; right:14mm; background:var(--ink); color:#fff; border-radius:3mm; padding:5mm 6mm; font-size:12.5pt; font-weight:700 }
.act-price em{ font-style:normal; font-weight:400; color:#c9b9a5; font-size:10pt }
.form .act-photo::after{}

/* Sectors */
.sectors{ display:grid; grid-template-columns:repeat(3,1fr); gap:4mm; margin:7mm 0 }
.sector{ background:var(--paper2); border:1px solid var(--line); border-radius:2.5mm; padding:5mm; font-size:11.5pt; font-weight:600; text-align:center; position:relative }
.sector::before{ content:""; display:block; width:5mm; height:1.4mm; background:var(--orange); border-radius:2px; margin:0 auto 3mm }

/* Detail pages */
.detail{ padding:0 }
.det-banner{ display:flex; align-items:center; gap:4mm; padding:8mm 14mm 5mm; }
.det-banner.t-form{ border-top:6mm solid var(--form) } .det-banner.t-one{ border-top:6mm solid var(--one) } .det-banner.t-aud{ border-top:6mm solid var(--aud) }
.ban-gamme{ font-size:9.5pt; color:var(--muted); font-weight:600 } .ban-no{ margin-left:auto; font-size:9pt; color:var(--muted) }
.feat{ background:var(--gold); color:#3a2b06; font-size:8.5pt; font-weight:800; padding:1.4mm 3mm; border-radius:999px }
.det-head{ padding:0 14mm } .det-title{ font-size:25pt; line-height:1.06 } .det-accroche{ font-size:11.5pt; color:var(--ink2); line-height:1.45; margin-top:2mm; max-width:170mm }
.det-facts{ display:grid; grid-template-columns:repeat(4,1fr); gap:0; margin:6mm 14mm; border:1px solid var(--line); border-radius:3mm; overflow:hidden }
.det-facts .fact{ padding:4mm 5mm; border-right:1px solid var(--line) } .det-facts .fact:last-child{ border-right:none }
.fact span{ display:block; font-size:8pt; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); margin-bottom:1.5mm } .fact b{ font-size:10.5pt; line-height:1.25 }
.fact.price{ background:var(--ink); } .fact.price span{ color:#c9b9a5 } .fact.price b{ color:#fff } .fact.price.wide{ grid-column:span 1 }
.det-cols{ display:grid; grid-template-columns:1.55fr 1fr; gap:8mm; padding:2mm 14mm }
.prog{ display:flex; flex-direction:column; gap:3mm }
.prog-b{ background:var(--paper2); border:1px solid var(--line); border-radius:2mm; padding:3.5mm 4mm }
.prog-h{ font-weight:700; font-size:10pt; color:var(--orange-d); margin-bottom:1.5mm }
.prog-b ul{ list-style:none } .prog-b li{ font-size:9pt; color:var(--ink2); line-height:1.45; padding-left:4mm; position:relative }
.prog-b li::before{ content:""; position:absolute; left:0; top:1.7mm; width:1.6mm; height:1.6mm; background:#c9bba6; border-radius:50% }
.det-side{ display:flex; flex-direction:column; gap:3.5mm }
.side-b{ background:#fff; border:1px solid var(--line); border-radius:2.5mm; padding:4mm }
.side-b.roi{ background:#fdf1e9; border-color:#f2cdb6 }
.side-t{ font-size:8pt; text-transform:uppercase; letter-spacing:.12em; color:var(--orange-d); font-weight:800; margin-bottom:2mm }
.side-b p{ font-size:9.5pt; color:var(--ink2); line-height:1.45 }
.chips{ display:flex; flex-wrap:wrap; gap:2.5mm; padding:0 14mm; margin-bottom:2mm }
.chips span{ background:var(--paper3); border-radius:999px; padding:2mm 4mm; font-size:9.5pt; font-weight:600; color:var(--ink2) }

/* Back */
.back{ background:linear-gradient(160deg,#1c1712,#3a2415); color:#f6efe6; padding:16mm 14mm 0; display:flex; flex-direction:column }
.back-top{ } .back-mid{ flex:1; margin-top:14mm }
.back-h{ font-size:34pt; line-height:1.05 } .back-sub{ font-size:12.5pt; color:#d9cbbb; line-height:1.55; margin:5mm 0 8mm; max-width:150mm }
.back-contact{ display:flex; gap:10mm; margin-bottom:8mm } .back-contact span{ font-size:8.5pt; letter-spacing:.15em; text-transform:uppercase; color:#a98d6f; display:block } .back-contact b{ font-size:14pt; color:#fff }
.back-pills{ display:flex; gap:3mm } .back-pills span{ border:1px solid #6a4e34; color:#f0dcc4; border-radius:999px; padding:2.5mm 5mm; font-size:10pt }
.back-clients{ margin-bottom:5mm }
`;

const HTML = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Axion-IA — Catalogue 2026</title><style>${CSS}</style></head>
<body>${PAGES.join("\n")}</body></html>`;

fs.writeFileSync(path.join(__dirname, "plaquette.html"), HTML, "utf8");
console.log("OK plaquette.html —", PAGES.length, "pages");
