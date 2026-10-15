# Héros du Jour

Jeu web gratuit (téléphone + ordinateur) : chaque jour, tout le monde devine le même personnage de fiction (Marvel, DC, manga, indé ; héros et méchants) grâce à 7 critères en cases de couleur. Version 2 : chaque personnage trouvé devient une carte à collectionner dans une bibliothèque.

**Le brief complet est dans `BRIEF.md`. Le relire au début de chaque session**, et regarder quelle est la prochaine étape non cochée du plan (section 7).

## Avec qui tu travailles

- **Luca ne sait pas coder.** Tu fais tout le travail technique toi-même (code, commandes, installations, git, mise en ligne).
- Parle-lui **en français, simplement, sans jargon**. Un mot technique = une phrase d'explication.
- **Ne lui demande jamais de choisir une technologie.** Tu choisis l'option la plus simple et tu l'expliques en une phrase.
- S'il doit agir lui-même : instructions numérotées, une action par ligne, en disant ce qu'il doit voir.

## Technique (déjà décidé)

- HTML + CSS + JavaScript simples, sans framework ni étape de construction, scripts classiques (pas de modules) : `index.html` doit marcher en double-clic.
- Données dans `data/personnages.js` et `data/calendrier.js`. Sauvegarde des joueurs dans `localStorage` (toujours avec `try/catch`).
- Mise en ligne avec Vercel (https://heros-du-jour.vercel.app/, branché sur le dépôt GitHub `LuckyLe10E/heros-du-jour` : chaque envoi sur `main` met le site à jour). Identité git du projet : `LuckyLe10E`. Aucune dépendance externe, sauf une police Google Fonts et **Firebase** (connexion Google facultative + sauvegarde des cartes en ligne ; offre gratuite Spark, sans carte bancaire ; décidé avec Luca le 16 octobre 2026). Le jeu doit toujours marcher sans compte.
- **Ne jamais modifier un `id` de personnage, ni réordonner ou supprimer les entrées passées du calendrier.** Nouveaux personnages ajoutés à la fin.

## Règles de travail

1. **Une étape à la fois.** Attendre la validation de Luca avant la suivante.
2. **Montrer le résultat** avec un test précis : « ouvre ça, tape ça, tu dois voir ça ».
3. **Code simple et lisible**, noms et commentaires en français.
4. **git après chaque étape validée** (message clair en français), puis envoi sur GitHub.
5. Tester soi-même avant de montrer. Ne jamais mettre en ligne quelque chose de cassé.
6. En cas de problème : expliquer simplement, revenir à la dernière version qui marche si besoin.
7. Demander avant toute dépense, publication hors projet ou suppression de fichiers.
8. Mettre à jour `BRIEF.md` quand une décision change, et cocher les étapes faites.

## Interdit

logos ou textes officiels des œuvres · images générées par IA · images officielles autres que celles de personnages choisies et fournies par Luca (décision de Luca du 16 octobre 2026 : images de personnages trouvées sur Internet, projet gratuit et sans revenus, droits restant à leurs ayants droit ; Claude ne télécharge jamais d'images lui-même, Luca les ajoute ; chaque image est créditée et la page « Mentions légales » donne une adresse pour demander son retrait) · autres comptes que la connexion Google facultative · serveur à nous · pub, paiements, traçage · collecte de données au-delà de l'e-mail + identifiant Google + cartes/statistiques · frameworks · fonctionnalités non demandées · plusieurs étapes d'un coup.
