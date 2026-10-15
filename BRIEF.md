# Brief projet : Héros du Jour

> Document destiné à Claude Code. À lire en entier avant de commencer.

---

## 1. Contexte

**L'utilisateur s'appelle Luca. Il ne sait pas coder** et ne connaît aucune technologie. C'est son premier projet. Il est plombier et passionné de comics (surtout Marvel), de mangas, de tatouage et de piercing.

**Répartition des rôles :**

- **Claude Code fait tout le travail technique** : écrire le code, lancer les commandes, installer ce qui manque, corriger les bugs, mettre le site en ligne, sauvegarder avec git.
- **Luca apporte les idées, teste et donne son avis.** C'est aussi lui l'expert des personnages : il vérifie que les fiches sont justes.

**Comment parler à Luca :**

- En français, simplement, **sans jargon**. Si un mot technique est vraiment nécessaire, l'expliquer en une phrase (ex. : « git, c'est un système qui garde une copie de chaque version du projet, pour pouvoir revenir en arrière »).
- **Ne jamais lui demander de choisir entre des technologies.** Les choix techniques sont faits dans ce brief. S'il en faut un nouveau, Claude Code choisit l'option la plus simple et l'explique en une phrase.
- Lancer les commandes **soi-même** plutôt que de demander à Luca de les taper. Si Luca doit faire quelque chose (installer un logiciel, créer un compte, cliquer quelque part), donner des instructions **pas à pas, numérotées**, une action par ligne, en disant ce qu'il doit voir à l'écran.
- Pour tester, toujours dire **exactement** quoi faire et quoi voir : « Ouvre telle page, tape "bat", tu dois voir Batman dans la liste. »
- Quand Luca signale un problème, lui demander une capture d'écran ou ce qu'il a vu exactement, sans le culpabiliser.
- L'ordinateur de Luca est probablement sous **Windows** : le vérifier au début et adapter les instructions.

---

## 2. Vision

**Héros du Jour** est un jeu web gratuit, jouable sur téléphone et sur ordinateur, ouvert à tout le monde.

Chaque jour, tous les joueurs doivent deviner **le même personnage de fiction** (comics Marvel, DC, indé, et manga ; héros comme méchants). À chaque essai, le jeu compare le personnage proposé au personnage mystère, critère par critère, avec des cases de couleur. Le principe ressemble à Wordle ou Loldle.

Dans un second temps, chaque personnage trouvé devient **une carte à collectionner**, rangée dans une **bibliothèque** personnelle. Le joueur revient chaque jour pour jouer et pour compléter sa collection.

L'objectif de Luca est un **vrai projet durable**, qu'il fera grandir longtemps. Le code doit donc rester simple, propre et facile à faire évoluer.

---

## 3. Première version : ce qui doit fonctionner à la fin

À la fin de la **Version 1** :

- Le site est **en ligne**, avec un lien public que Luca peut envoyer à ses amis.
- Il s'affiche bien sur téléphone (priorité) et sur ordinateur.
- Chaque jour, un personnage mystère est choisi automatiquement, le même pour tout le monde.
- Le joueur tape un nom, choisit dans une liste de suggestions, et voit une ligne de 7 cases de couleur.
- Il a 10 essais. Des indices de plus en plus précis apparaissent dès 3 essais ratés (voir section 4, point 5).
- En fin de partie, un écran de victoire ou de défaite s'affiche, avec un bouton **Partager** et un compte à rebours jusqu'au prochain personnage.
- Si le joueur ferme la page, il retrouve sa partie en revenant.
- La base contient **environ 100 personnages** parmi les plus populaires.

À la fin de la **Version 2** : les cartes à collectionner et la bibliothèque fonctionnent (voir section 4).

---

## 4. Fonctionnalités

### Version 1 : le jeu du jour

1. **Personnage du jour** : choisi selon la date, numéroté (« Héros du Jour n°12 »).
2. **Saisie avec suggestions** : on tape quelques lettres, une liste de personnages correspondants apparaît. La recherche ignore majuscules et accents, et trouve aussi les autres noms (ex. « Peter Parker » trouve Spider-Man). On ne peut proposer qu'un personnage de la liste, et pas deux fois le même.
3. **Comparaison sur 7 critères**, affichée en une ligne de cases par essai (le dernier essai en haut) :

| Critère | Valeurs possibles | Règle |
|---|---|---|
| Univers | Marvel, DC, Manga, Indé | 🟩 identique / 🟥 différent |
| Camp | Héros, Méchant, Anti-héros | 🟩 / 🟥 |
| Genre | Homme, Femme, Autre | 🟩 / 🟥 |
| Espèce | Humain, Mutant, Humain modifié, Alien, Dieu, Robot/IA, Démon, Mort-vivant, Hybride/Animal, Autre | 🟩 / 🟥 |
| Pouvoirs | liste fixe (voir ci-dessous), plusieurs possibles | 🟩 tous identiques / 🟧 au moins un en commun / 🟥 aucun |
| Groupe | Avengers, X-Men, Justice League, Akatsuki, etc., ou « Aucun » ; plusieurs possibles | 🟩 / 🟧 / 🟥 |
| 1ʳᵉ apparition | année | 🟩 identique / 🟥 avec ⬆️ (le mystère est plus récent) ou ⬇️ (plus ancien) |

   **Liste fixe des pouvoirs** (pour que les comparaisons marchent) : Force surhumaine, Vitesse, Vol, Résistance/Guérison, Magie, Technologie/Gadgets, Combat/Arts martiaux, Armes, Psychique/Télépathie, Énergie/Rayons, Contrôle des éléments, Métamorphose, Aucun.

   **Accessibilité** : en plus des couleurs, chaque case porte un petit symbole (✓, ~, ✗) pour les daltoniens.

4. **10 essais maximum**.
5. **Indices de plus en plus précis au fil des essais ratés** (décision de Luca) ; chaque indice s'ajoute au précédent, texte **écrit par nous** (pas de citation copiée d'une œuvre) :
   - après 3 essais ratés : l'**indice** discret (`indice`)
   - après 4 essais ratés : + le **titre de l'œuvre** d'origine (`oeuvre`)
   - après 5, 6, 7 et 8 essais ratés : + la **1ʳᵉ, 2ᵉ, 3ᵉ puis 4ᵉ phrase de la fiche** (`description`), de la plus vague à la plus révélatrice
   (Chaque `description` fait **exactement 4 phrases**, sans point à l'intérieur d'une phrase ; le code la découpe aux points. Ce calendrier est une proposition à confirmer avec Luca à l'étape 6.)
6. **Écran de fin** : victoire (« Trouvé en 4 essais ! ») ou défaite (la réponse est révélée), avec le nom du personnage et sa **fiche détaillée** (`description`).
7. **Bouton Partager** : copie un texte du type ci-dessous, sans révéler la réponse, avec le lien du site. Sur téléphone, utiliser le partage natif si disponible.
   ```
   Héros du Jour n°12 — 4/10
   🟥🟩🟥🟧🟥🟥⬆️
   🟩🟩🟥🟧🟥🟥⬇️
   🟩🟩🟩🟧🟩🟥⬆️
   🟩🟩🟩🟩🟩🟩🟩
   ```
8. **Compte à rebours** jusqu'au prochain personnage (minuit, heure du téléphone).
9. **Sauvegarde de la partie en cours** dans le navigateur du joueur.
10. **Fenêtre « Comment jouer »** (bouton « ? »), ouverte automatiquement à la première visite.
11. **Page de vérification des fiches** pour Luca (voir section 5).

### Version 2 : les cartes à collectionner

1. **Gagner une carte** : quand le joueur trouve le personnage du jour, une carte se retourne avec une animation et rejoint sa collection.
2. **Rareté selon le nombre d'essais** :
   - 1 à 3 essais : **Légendaire** (cadre doré, effet brillant)
   - 4 à 6 essais : **Rare** (cadre argenté)
   - 7 à 10 essais : **Commune**
   - personnage non trouvé : pas de carte
3. **Contenu de la carte** : nom, univers, camp, espèce, pouvoirs, groupe, année, courte description, date d'obtention, nombre d'essais, rareté.
4. **Visuel sans image officielle** : couleur de fond selon l'univers, grande icône selon l'espèce ou le pouvoir principal, cadre selon la rareté. Prévoir un emplacement d'illustration qu'on pourra remplir plus tard avec des dessins originaux.
5. **Bibliothèque** : grille de toutes les cartes, avec des cases « ? » pour celles qui manquent et un compteur (« 23 / 100 »). Toucher une carte l'affiche en grand.
6. **Tri et filtres** : par univers, par rareté, par date d'obtention.
7. **Amélioration** : si un personnage revient dans le calendrier et que le joueur fait mieux, sa carte passe à une rareté supérieure (jamais inférieure).

### Plus tard

- Statistiques : parties jouées, % de victoires, série de jours d'affilée, répartition des essais
- Ajouter régulièrement de nouveaux personnages
- Modes « Marvel uniquement », « DC uniquement », « Manga uniquement »
- Mode entraînement : personnage au hasard, parties illimitées, sans carte à gagner
- Archives : rejouer les jours passés et récupérer les cartes manquées
- Code de sauvegarde : exporter et importer sa collection pour changer de téléphone

### Idées futures (ambitieuses, pas avant que tout le reste soit solide)

- Illustrations originales sur les cartes (dessins de Luca ou d'artistes)
- Mode tatouage (« devine le style »)
- Version anglaise
- Comptes joueurs, collection sauvegardée en ligne, classement entre amis

---

## 5. Parcours utilisateur

### Écran 1 : le jeu (page d'accueil)

- En haut : le titre **Héros du Jour**, le numéro et la date du jour, un bouton « ? » (règles). En Version 2, un bouton « Ma collection ».
- Au centre : une grande case « Tape un nom de personnage… ». En tapant, une liste de suggestions s'ouvre en dessous (nom + univers). Toucher une suggestion valide l'essai.
- En dessous : les en-têtes des 7 critères, puis une ligne de cases par essai. Sur téléphone, les 7 cases doivent tenir sur la largeur de l'écran (cases compactes, texte court) ; si vraiment impossible, défilement horizontal du tableau seulement, jamais de la page entière.
- Un compteur « Essai 3 / 10 ».
- Après 3 essais ratés : un encadré « Indice » apparaît, puis il s'enrichit après 5, 7 et 9 essais ratés (voir section 4, point 5).

### Écran 2 : la fin de partie (fenêtre par-dessus le jeu)

- Victoire : « Bravo ! Trouvé en 4 essais », nom et description du perso, bouton **Partager**, compte à rebours « Prochain héros dans 05:12:47 ». En Version 2, la carte gagnée se retourne ici.
- Défaite : « Raté ! C'était… », même contenu, sans carte.
- On peut fermer la fenêtre et revoir sa grille ; si on recharge la page, la partie terminée reste affichée.

### Écran 3 : Comment jouer (fenêtre)

Explication courte des règles, des couleurs et des flèches, avec un exemple de ligne.

### Écran 4 : Ma collection (Version 2)

Grille de cartes, compteur, filtres. Toucher une carte l'ouvre en grand.

### Page de vérification (pour Luca, pas pour les joueurs)

Une page simple (`verification.html`) qui affiche **tous les personnages dans un tableau lisible** avec tous leurs critères, triables, pour que Luca relise les fiches facilement et signale les erreurs. Elle affiche aussi le calendrier : quel personnage tombe quel jour. Elle n'est pas liée depuis le jeu.

---

## 6. Choix techniques

L'objectif est d'avoir **le moins de choses possible à installer, à lancer et à maintenir**.

| Besoin | Choix | Pourquoi |
|---|---|---|
| Le site | **HTML, CSS et JavaScript simples**, sans framework, sans étape de « construction » | Rien à installer. On ouvre `index.html` dans le navigateur et ça marche. Facile à relire et à faire durer des années. |
| Chargement des scripts | Balises `<script>` classiques (pas de modules ES) | Le site fonctionne même en double-cliquant sur `index.html`, sans serveur local. |
| Les personnages | Un fichier `data/personnages.js` qui contient la liste (`window.PERSONNAGES = [...]`) | Lisible, modifiable à la main, fonctionne sans serveur. |
| Le calendrier | Un fichier `data/calendrier.js` : la liste ordonnée des identifiants de personnages, mélangée une fois pour toutes | Tout le monde a le même personnage le même jour, sans serveur. |
| La sauvegarde | `localStorage` du navigateur (petite mémoire propre à chaque navigateur) | Pas de base de données ni de comptes. Toujours entourer les lectures et écritures de `try/catch`. |
| La mise en ligne | **Vercel** (décision changée avec Luca : il avait déjà un compte, lié à GitHub). Adresse : https://heros-du-jour.vercel.app/ | Gratuit pour un projet perso, et la mise à jour du site se fait automatiquement en envoyant le code sur GitHub. GitHub Pages a été supprimé. |
| Sauvegarde des versions | **git** + un dépôt GitHub `heros-du-jour` | Permet de revenir en arrière et sert aussi à la mise en ligne. |
| Dépendances externes | **Aucune** au départ. Une police Google Fonts est acceptable pour le style. | Rien qui puisse casser tout seul dans 2 ans. |

### Organisation des fichiers (suggestion)

```
heros-du-jour/
├── CLAUDE.md
├── BRIEF.md
├── index.html          ← le jeu
├── verification.html   ← relecture des fiches (pour Luca)
├── css/
│   ├── base.css, jeu.css, cartes.css, fenetres.css   (le style, découpé par thème)
│   └── verification.css
├── js/
│   ├── outils.js       ← fonctions communes (dates, texte sans accents…)
│   ├── stockage.js     ← lecture/écriture de la sauvegarde
│   ├── jeu.js          ← logique du jeu et comparaisons
│   ├── affichage.js    ← tout ce qui touche à l'écran
│   └── collection.js   ← Version 2
└── data/
    ├── personnages.js
    └── calendrier.js
```

### Règles importantes sur les données

- **Fiche d'un personnage** (exemple) :
  ```js
  {
    id: "spider-man",
    nom: "Spider-Man",
    autresNoms: ["Peter Parker", "L'Homme-Araignée"],
    univers: "Marvel",
    camp: "Héros",
    genre: "Homme",
    espece: "Humain modifié",
    pouvoirs: ["Force surhumaine", "Vitesse", "Psychique/Télépathie"],
    groupes: ["Avengers"],
    annee: 1962,
    oeuvre: "Amazing Fantasy",
    indice: "Un jeune qui doit concilier une vie ordinaire compliquée avec une double vie.",
    description: "Orphelin élevé par son oncle et sa tante, ce lycéen timide est mordu pendant une démonstration scientifique…"
  }
  ```
- **Deux textes par personnage** (décision de Luca) : `indice` = court et discret, premier indice de la partie, montré après 3 essais ratés (il ne doit trahir ni l'équipe, ni le costume, ni les proches, ni le nom) ; `description` = la fiche détaillée en **4 phrases** (de la plus vague à la plus révélatrice), dévoilée phrase par phrase au fil des essais ratés (voir section 4, point 5), puis montrée en entier à la fin de la partie. Ni l'indice ni la fiche ne contiennent le nom du personnage ni un de ses surnoms (vérifié par un contrôle automatique).
- **Dates de 1ʳᵉ apparition** : année de la date de couverture pour les comics, année de publication dans le magazine pour les mangas. Tous les faits ont été recoupés avec des sources (Wikipédia anglophone surtout) en octobre 2026.
- Le champ facultatif `averifier` contient un doute à trancher par Luca (à supprimer une fois vérifié).
- Les valeurs de chaque critère viennent **uniquement des listes fixes** de la section 4 (un fichier de constantes les définit). Pas de variantes d'orthographe.
- `id` ne change **jamais** une fois créé : la sauvegarde des joueurs et leurs cartes en dépendent.
- **Choix des ~100 personnages** : les plus populaires de chaque univers, avec un mélange de héros, méchants et anti-héros. Répartition indicative : ~35 Marvel, ~25 DC, ~30 manga, ~10 indé. Exemples d'indé : Hellboy, Spawn, Invincible, Omni-Man, les Tortues Ninja, Usagi Yojimbo, Judge Dredd, Rick Grimes. Luca pourra ajouter ses favoris.
- **Exactitude** : signaler à Luca les infos dont tu n'es pas sûr (année, espèce…) dans la page de vérification (marque « à vérifier »). C'est lui qui tranche.

### Règles importantes sur le calendrier

- Une constante `DATE_LANCEMENT` fixe le jour n°1. Le numéro du jour = nombre de jours écoulés depuis le lancement + 1, selon la date locale du téléphone.
- Personnage du jour = `calendrier[(numero - 1) % calendrier.length]`.
- **Ne jamais réordonner ni supprimer des entrées passées du calendrier.** Les nouveaux personnages s'ajoutent **à la fin**. Sinon les parties et les cartes des joueurs deviennent incohérentes.
- Prévoir un **mode test** : ajouter `?perso=spider-man` à l'adresse force le personnage mystère, sans toucher à la sauvegarde. Il sert à Luca pour tester. Ne pas en parler aux joueurs. Autre outil de test pour Luca : ajouter `?recommencer` à l'adresse efface la partie du jour sauvegardée dans son navigateur (pour rejouer la vraie partie du jour).

### Style visuel

- Ambiance **comics** : couleurs vives, contours épais, police marquée pour les titres, petit effet de trame (points), avec sobriété pour rester lisible.
- Pensé **d'abord pour le téléphone**, puis adapté à l'ordinateur.
- Mode sombre automatique si le téléphone est en mode sombre.
- **Aucune image, logo ou nom de marque officiel** (pas de « Marvel » dans le titre du site, pas de dessins de personnages). Le nom de l'univers peut apparaître comme simple information dans les critères.

---

## 7. Plan de développement

Chaque étape est petite. **À la fin de chaque étape** : expliquer à Luca en 2 ou 3 phrases ce qui a été fait, lui donner le test à faire, attendre sa validation, puis sauvegarder avec git.

### Étape 0 : Préparer l'ordinateur — ✅ TERMINÉE (validée par Luca)

- Vérifier le système (Windows / Mac) et si **git** est installé. Sinon, guider Luca pas à pas pour l'installer.
- Aider Luca à créer un **compte GitHub** (gratuit) s'il n'en a pas, puis connecter git à ce compte.
- Créer le dossier du projet et la première sauvegarde git.
- ✅ **Test pour Luca :** « Va sur github.com, connecte-toi : tu dois voir un projet nommé **heros-du-jour**. »

### Étape 1 : La première page — ✅ TERMINÉE (validée par Luca)

- Créer `index.html` + `style.css` avec le titre, la date du jour et le style de base.
- ✅ **Test :** « Ouvre le dossier du projet et double-clique sur `index.html`. Tu dois voir le titre **Héros du Jour** et la date d'aujourd'hui. »

### Étape 2 : Mise en ligne dès maintenant — ✅ TERMINÉE (validée par Luca) : https://heros-du-jour.vercel.app/ (passé de GitHub Pages à Vercel à la demande de Luca)

- Activer GitHub Pages pour que Luca puisse tester sur son téléphone à chaque étape.
- ✅ **Test :** « Ouvre ce lien sur ton téléphone : [lien]. Tu dois voir la même page que sur l'ordi. Ajoute-le à tes favoris. »

### Étape 3 : Les personnages — ✅ TERMINÉE (validée par Luca) : 127 personnages vérifiés

- Créer la liste fixe des valeurs de critères, `personnages.js` (~100 fiches) et `calendrier.js`.
- Créer `verification.html`.
- ✅ **Test :** « Ouvre `verification.html`. Tu dois voir un tableau d'environ 100 personnages. Relis-les à ton rythme et dis-moi tout ce qui te paraît faux, surtout les lignes marquées "à vérifier". »
- Corriger selon les retours de Luca (ça peut se faire en parallèle des étapes suivantes).

### Étape 4 : La case de saisie et les suggestions — ✅ TERMINÉE (validée par Luca)

- ✅ **Test :** « Tape "bat" : tu dois voir Batman (et d'autres noms qui contiennent "bat"). Tape "peter parker" : tu dois voir Spider-Man. Tape "zzz" : aucune suggestion. »

### Étape 5 : Les cases de couleur — ✅ TERMINÉE (validée par Luca)

- Comparer l'essai au personnage mystère et afficher la ligne de 7 cases.
- ✅ **Test :** « Ouvre la page en ajoutant `?perso=batman` à la fin du lien. Propose Superman : Univers doit être vert (DC), Camp vert (Héros), Pouvoirs rouge… Propose Batman : tout doit être vert. »

### Étape 6 : Le personnage du jour et la fin de partie — ✅ TERMINÉE (validée par Luca)

- Personnage selon la date, numéro du jour, limite de 10 essais, indices progressifs (dès 3 essais ratés, voir section 4), écrans de victoire et de défaite.
- ✅ **Test :** « Avec `?perso=thanos`, trouve Thanos : un écran "Bravo" doit s'afficher. Recharge avec `?perso=goku` et rate 10 fois : la réponse "Goku" doit s'afficher. Après 3 essais ratés, le premier indice doit apparaître, puis il doit s'enrichir à chaque essai raté suivant. »

### Étape 7 : La sauvegarde de la partie — ✅ TERMINÉE (validée par Luca)

- ✅ **Test :** « Fais 3 essais sur la vraie page du jour, ferme l'onglet, rouvre-le : tes 3 essais doivent être toujours là. »

### Étape 8 : Partager et compte à rebours — ✅ TERMINÉE (validée par Luca)

- ✅ **Test :** « Termine une partie sur ton téléphone, appuie sur Partager et envoie-le-toi sur WhatsApp. Tu dois voir les carrés de couleur et le lien, mais pas le nom du personnage. Le compte à rebours doit défiler. »

### Étape 9 : Règles et finitions — ✅ TERMINÉE (validée par Luca)

- Fenêtre « Comment jouer », finitions visuelles, vérification de l'affichage sur petit écran, mode sombre.
- ✅ **Test :** « Ouvre le site dans une fenêtre de navigation privée sur ton téléphone : les règles doivent s'afficher toutes seules. Tout doit être lisible sans zoomer. »

### Étape 10 : Version 1 terminée 🎉

- Mise en ligne finale, choix d'une `DATE_LANCEMENT`, remise à zéro de toute donnée de test.
- ✅ **Test :** « Envoie le lien à 2 ou 3 amis. Demain, vérifie que le personnage a bien changé et que le numéro a augmenté. » Recueillir leurs retours avec Luca avant d'attaquer la Version 2.

### Étape 11 : Gagner une carte (Version 2) — ✅ TERMINÉE (validée par Luca)

Choix faits : les cartes sont rangées dans le navigateur (`heros-du-jour-collection`) ; en mode test `?perso=` elles vont dans une collection de test séparée (`heros-du-jour-collection-test`), effacée avec `?perso=...&recommencer`. Si la carte du personnage est déjà possédée, on garde l'ancienne (la montée de rareté est pour l'étape 13). La carte affiche une courte description = 1ʳᵉ + 4ᵉ phrase de la fiche. L'icône vient de l'espèce (émojis, aucune image officielle) ; l'emplacement d'illustration est prêt pour de futurs dessins originaux.

- Création de la carte à la victoire, calcul de la rareté, animation de retournement, enregistrement dans la collection.
- ✅ **Test :** « Avec `?perso=hulk` en mode test, trouve Hulk en 2 essais : une carte dorée Légendaire doit se retourner. » (Le mode test peut, pour ce test, enregistrer dans une collection de test séparée, à effacer ensuite.)

### Étape 12 : La bibliothèque — ✅ TERMINÉE (validée par Luca)

- Page ou écran « Ma collection » : grille, cases « ? », compteur, carte en grand.
- ✅ **Test :** « Touche "Ma collection" : tu dois voir ta carte et des cases "?" pour les autres, avec "1 / 100". Touche ta carte : elle s'affiche en grand. »

### Étape 13 : Tri et amélioration des cartes — ✅ TERMINÉE (validée par Luca)

Choix faits : trois menus dans « Ma collection » (Trier : ordre de la liste / les plus rares d'abord / les plus récentes d'abord ; Univers ; Rareté). Une carte rejouée avec une rareté plus haute est remplacée (message « Carte améliorée : Rare → Légendaire ! ») ; à rareté égale ou inférieure on garde l'ancienne carte. La date d'obtention d'une carte améliorée est celle de l'amélioration. Pour tester l'amélioration en mode test, ne pas mettre `&recommencer` (il efface la collection de test).

- ✅ **Test :** « Trie par rareté : les Légendaires doivent être en premier. » Et vérifier qu'une carte rejouée avec un meilleur score monte en rareté, jamais l'inverse.

### Étape 14 : Version 2 terminée 🎉 — mise en ligne faite (https://heros-du-jour.vercel.app/), en attente du test de Luca sur téléphone

Rappel : l'étape 10 (lancement officiel : choix de la `DATE_LANCEMENT`, remise à zéro des données de test, envoi aux amis) reste à faire quand Luca le décidera. La date actuelle (`2026-10-14`) est provisoire.

### Améliorations décidées avec Luca (avant le lancement)

Même méthode qu'avant : une étape à la fois, test précis, validation de Luca, puis git.

- **Étape 15 : Sauvegarder ses cartes via une connexion Google** (réalisée le 16 octobre 2026, connexion testée et validée par Luca en local, mise en ligne ensuite ; service : Firebase, projet `herosdujour`, offre gratuite Spark ; données : e-mail + identifiant Google + cartes ; bouton « Mon compte » dans l'en-tête, fenêtre de connexion / déconnexion / suppression, page `confidentialite.html`, fichier `js/compte.js` ; règles Firestore publiées par Luca : seul le joueur lit/écrit son document `joueurs/{uid}`) — le joueur se connecte avec son compte Google (uniquement Google, pas de mot de passe chez nous) et retrouve sa collection sur tous ses appareils. Cela demande un serveur / une base de données (service en ligne) : **ne pas commencer sans en avoir d'abord discuté avec Luca** (choix du service, données collectées : RGPD, minimum possible, coût éventuel ; ne jamais dépenser sans son accord). La sauvegarde doit **fusionner** avec ce que le joueur a déjà (on ne perd jamais de carte, jamais de rareté). *(Une première idée, le « code de sauvegarde » à copier-coller, a été réalisée puis **annulée** par Luca : elle n'est pas dans le projet.)*
- **Version 3** : correspond à l'étape 15 ci-dessus (comptes via Google).
- **Pause** : levée. La prochaine étape est la 15 (connexion Google), à discuter avec Luca avant de coder.
- **🎨 Refonte du design (réalisée et validée par Luca le 15 octobre 2026 « pour le moment » ; il pourra encore la retoucher à la finalisation du site)** — l'objectif est un site qui fasse moins « fait par une IA ». Le jeu accueillera à terme **toute la fiction** (films, séries, jeux vidéo, livres, pas seulement comics et manga) : le design ne doit donc pas être « comics » ni « manga ». Concept retenu : **« Le classeur de casting »** = mélange des idées 1 (fichier de casting : fiches de papier, post-it pour les indices, onglets, tampon du numéro, emplacement photo vide pour de futures illustrations) et 2 (album de vignettes : « Ma collection » avec emplacements numérotés, vignettes à bande de couleur d'univers et feuille dorée / argentée / bronze selon la rareté). Une seule police Google Fonts (Jost). Plus d'émojis dans l'interface (icônes dessinées). Système de couleurs par univers **extensible** (Marvel, DC, Manga, Indé + Films, Séries… à venir). Maquette à ouvrir par double-clic : `maquettes/casting-et-album.html`. Étapes prévues : maquette validée → application au vrai site écran par écran (en-tête, saisie, grille, indices, fenêtres, cartes, collection) avec validation de Luca à chaque fois. Le skill `frontend-design` est installé dans `.claude/skills/` (dossier ignoré par git).
- **Thème par défaut : sombre** (décidé par Luca le 16 octobre 2026) : le jeu s'ouvre en mode sombre, quel que soit le réglage du téléphone ; le bouton soleil / lune bascule, et le choix du joueur est retenu.
- **Étape 15 bis : L'essai offert** (réalisée et validée par Luca le 16 octobre 2026) — au début de chaque partie, le jeu compare d'office un personnage au mystère (ligne de 7 cases déjà affichée, étiquette « essai offert », tout en bas de la liste). Il **ne compte pas** dans les 10 essais ni dans la rareté de la carte, n'apparaît pas dans le texte de partage, et n'est pas proposé dans la recherche. Même choix pour tous les joueurs d'un jour : un personnage ayant 2 ou 3 cases vertes (année exclue) avec le mystère, tiré avec un calcul qui ne dépend que du numéro du jour et de l'identifiant (stable quand on ajoute des personnages ; s'élargit tout seul si aucun personnage ne convient, par exemple pour un nouvel univers). Il est gardé dans la sauvegarde du jour. La fenêtre « ? » l'explique. Les statistiques (étape 16) devront l'ignorer.
- **Étape 16 : Statistiques, série de jours et profil** (réalisée et validée par Luca le 16 octobre 2026 ; fichiers `js/statistiques.js`, `js/profil.js`, `css/profil.css`, `css/fiches.css` ; ordre validé : vitrine, statistiques avec « les 14 derniers jours » AVANT « en combien d'essais ? », collection, compte ; la série compte les jours JOUÉS d'affilée, gagnés ou perdus) — un écran « Mon profil », qui marche avec ou sans compte (sans compte : statistiques sur l'appareil ; avec le compte Google : elles suivent le joueur). Contenu : (1) statistiques : parties jouées, % de victoires, série de jours d'affilée et meilleure série, répartition des essais ; (2) résumé de la collection (cartes par rareté et par univers) ; (3) une **carte favorite en vitrine** choisie parmi ses cartes (pas de photo ni de pseudo) ; (4) la partie compte (connexion, déconnexion, suppression), qui quitte la petite fenêtre « Mon compte ». Méthode : on note le résultat de **chaque jour joué** (numéro du jour, gagné ou non, nombre d'essais) ; les statistiques sont calculées à partir de cet historique, ce qui permet de fusionner plusieurs appareils sans compter deux fois le même jour. L'essai offert n'y compte pas. Ordre de travail : maquette (`maquettes/profil.html`) validée par Luca, puis branchement au vrai jeu.
- **💡 Idée pour plus tard, pas une étape : un pseudo** (et peut-être des classements entre amis). Ne pas l'ajouter maintenant : ce serait une donnée personnelle de plus (à mettre dans la page Confidentialité et dans `CLAUDE.md`). À reprendre seulement si on fait des classements.
- **Étape 17 : Cases qui se révèlent une par une** (réalisée et validée par Luca le 16 octobre 2026 ; fichiers `js/effets.js`, `css/effets.css` ; les cases se retournent toutes les 280 ms, la fenêtre de fin et le compteur attendent la fin du retournement ; secousse de la saisie + message « Déjà proposé » ; confettis (plus nombreux selon la rareté) à la victoire ; tout coupé par « moins d'animations ») — les 7 cases se retournent l'une après l'autre à chaque essai ; petits effets (secousse si le nom est déjà joué, confettis à la victoire). Respecter « moins d'animations » du téléphone.
- **Étape 18 : Parties bonus et entraînement** (réalisée et validée par Luca le 16 octobre 2026 ; décidée avec lui : **5 parties bonus par jour**, chacune avec **une carte à gagner**, donc jusqu'à 6 cartes par jour avec la partie du jour ; fichier `js/bonus.js`) — un personnage différent à chaque partie bonus, tiré au hasard (jamais le personnage du jour, en priorité parmi les cartes que le joueur n'a pas encore pour l'aider à compléter sa collection) ; une partie bonus commencée est gardée (impossible de changer de personnage en rechargeant) ; le nombre de parties bonus lancées dans la journée est rangé avec les statistiques et suit le compte Google (pas 5 de plus sur un autre appareil) ; après les 5, **entraînement libre** sans limite et sans carte (rien n'est gardé). Aucune partie bonus ni entraînement ne compte dans les statistiques ni la série ; pas de bouton Partager ; essai offert aussi ; indisponible en mode test (?perso=). Le « ? » et la page Confidentialité sont à jour.

- **💡 Idées à réfléchir plus tard (étape pas encore choisie, aucune décision prise, ne pas coder sans accord de Luca)** :
  1. **Un personnage différent par joueur chaque jour**, pour limiter la triche (qu'un ami ne souffle pas la réponse). Attention : ça change le cœur du jeu (« tout le monde devine le même personnage ») et le texte de partage ne se comparerait plus de la même façon. Pistes à discuter : personnage différent par joueur mais tiré d'une même liste ; ou garder le même pour tous et ajouter un mode supplémentaire.
  2. **Pouvoir débloquer plusieurs personnages par jour**, car avec beaucoup de personnages la collection serait impossible à compléter. Pistes à discuter : des parties supplémentaires qui donnent des cartes (lien avec le mode entraînement de l'étape 18), un nombre de parties bonus par jour, etc.
  Ces deux idées sont liées : à décider ensemble, probablement après la connexion Google (étape 15) et les statistiques (étape 16).

- **Étape 19 : Nouveaux personnages (films, séries, jeux vidéo, livres) et colonne « Thème »** (réalisée et validée par Luca le 16 octobre 2026 ; le « ? » explique la règle du thème de première apparition) — la colonne « Univers » du jeu s'appelle maintenant **« Thème »** (le champ reste `univers` dans les données) : pour les comics, l'éditeur (Marvel, DC) ou « Indé » ; sinon le support de la toute première apparition (Manga, Films, Séries, Jeux vidéo, Livres), comme pour l'année. **48 personnages ajoutés** (12 par nouveau thème, les plus populaires), ce qui fait **175 personnages** ; nouveaux groupes (Ordre Jedi, Alliance rebelle, Empire galactique, Skynet, Zion, Starfleet, Confrérie des Assassins, Ordre du Phénix, Mangemorts, Communauté de l'Anneau) et nouvelles couleurs de thème (Jeux vidéo : bleu clair, Livres : brun). Dates et œuvres vérifiées en ligne pour les cas douteux (Geralt 1986, Homer 1987, Solid Snake 1987, Arsène Lupin 1905, Spock 1966, Daryl Dixon 2010). Contrôles automatiques : 4 phrases par description, valeurs autorisées, aucun nom dans les textes d'indice. Les nouveaux personnages sont à la FIN du calendrier : **avant le lancement officiel (étape 10), mélanger le calendrier pour alterner les thèmes dès les premiers jours** (c'est permis tant que le jeu n'est pas lancé).
- **🗺️ Feuille de route après l'étape 18 (liste donnée par Luca le 16 octobre 2026, ordre pas encore décidé)** :
  1. **Ajouter d'autres personnages, de tous types de fiction** (films, séries, jeux vidéo, livres…) : nouveaux univers + couleurs, vérification des fiches comme pour les 127 premiers (descriptions de 4 phrases, indice, années vérifiées), mise à jour du calendrier (nouveaux personnages ajoutés à la fin, jamais d'`id` modifié).
  2. **Ajouter les images des personnages sur les cartes** (à la place des silhouettes). **Décision de Luca (16 octobre 2026) : ce seront des images officielles trouvées sur Internet**, projet gratuit et sans revenus, droits laissés à leurs ayants droit ; toujours interdit : images générées par IA, logos, textes officiels. Règles de travail : c'est Luca qui trouve et ajoute les fichiers (Claude ne télécharge pas d'images) ; chaque image est créditée (champ `credit` dans les données) ; une page « Mentions légales » (à créer avec la mise à jour de la page Confidentialité) dit que les images appartiennent à leurs ayants droit et donne une adresse pour demander un retrait, à traiter vite ; images légères (environ 600 px de large, WebP ou JPEG) ; les cartes sans image gardent la silhouette. Risque expliqué à Luca : « gratuit » ne donne pas de droit sur les images (pas d'exception générale en France), un ayant droit peut demander le retrait, voire plus ; à lui de l'assumer.
  3. **Éventuellement d'autres modes de jeu** (à imaginer avec Luca).
  4. **Classement en ligne** : demande un pseudo (donnée personnelle de plus : page Confidentialité, `CLAUDE.md`), des règles de sécurité contre la triche (les scores viennent du téléphone du joueur), et probablement un classement entre amis plutôt que public. À discuter avant de commencer.
  5. **Sortie officielle** (étape 10 ci-dessus).

- Mise en ligne, test sur téléphone, retours des amis.

---

## 8. Règles de travail

1. **Une étape à la fois.** Ne jamais commencer l'étape suivante sans la validation de Luca.
2. **Montrer le résultat avant de continuer**, avec un test précis : quoi ouvrir, où cliquer, quoi voir.
3. **Garder le code simple** : des noms de fichiers, de fonctions et de variables clairs, **en français** ; un petit commentaire en français au-dessus de chaque fonction pour dire à quoi elle sert. Pas d'astuce compliquée quand une solution simple existe.
4. **Sauvegarder avec git après chaque étape validée**, avec un message clair en français (ex. « Étape 4 : suggestions quand on tape un nom »). Envoyer ensuite sur GitHub pour mettre le site à jour.
5. **Ne jamais mettre en ligne quelque chose de cassé.** Tester soi-même avant de demander à Luca.
6. **Si quelque chose casse**, l'expliquer simplement, proposer de revenir à la dernière version qui marchait (grâce à git), puis corriger.
7. **Pas de nouvelle bibliothèque ou d'outil externe** sans vraie nécessité. Si c'est indispensable, l'expliquer en une phrase.
8. **Respecter les règles du calendrier et des identifiants** (section 6) : ne jamais casser les sauvegardes des joueurs.
9. **Demander à Luca avant toute action qui coûte de l'argent, publie quelque chose sous son nom en dehors du projet, ou supprime des fichiers.**
10. **Tenir ce brief à jour** : quand une décision change avec Luca, la noter ici. Cocher les étapes terminées.

---

## 9. Hors-périmètre

Claude Code **ne doit pas** :

- utiliser des **images, dessins, logos ou noms de marque officiels** (Marvel, DC, éditeurs de manga…) comme visuels du site, ni copier des citations ou des textes des œuvres
- générer des images par intelligence artificielle pour les cartes
- créer des **comptes joueurs**, une base de données, un serveur ou un système de connexion (c'est pour une version future, après discussion)
- ajouter de la **publicité**, des paiements, des achats dans le jeu ou du traçage des visiteurs
- collecter des données personnelles des joueurs
- utiliser un framework (React, Vue…) ou un outil qui nécessite une « construction » du site
- prendre un hébergement payant ou un nom de domaine payant sans l'accord de Luca
- faire plusieurs étapes d'un coup, ou ajouter des fonctionnalités non demandées
- faire quoi que ce soit lié au métier de Luca (plomberie) : ce projet est un loisir
