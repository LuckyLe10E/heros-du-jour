// Listes fixes des valeurs possibles pour chaque critère.
// Les fiches de personnages (personnages.js) n'ont le droit d'utiliser QUE ces valeurs,
// sinon les comparaisons du jeu ne marchent pas. Pas de variantes d'orthographe.

window.CRITERES = {
  // Le « thème » (colonne « Thème » du jeu) : d'où vient le personnage. Pour les comics : l'éditeur (Marvel, DC) ou « Indé » ;
  // sinon, le support de sa toute première apparition (Manga, Films, Séries, Jeux vidéo, Livres).
  // Le champ s'appelle toujours « univers » dans personnages.js.
  univers: ["Marvel", "DC", "Manga", "Indé", "Films", "Séries", "Jeux vidéo", "Livres"],

  camps: ["Héros", "Méchant", "Anti-héros"],

  genres: ["Homme", "Femme", "Autre"],

  especes: [
    "Humain", "Mutant", "Humain modifié", "Alien", "Dieu",
    "Robot/IA", "Démon", "Mort-vivant", "Hybride/Animal", "Autre"
  ],

  pouvoirs: [
    "Force surhumaine", "Vitesse", "Vol", "Résistance/Guérison", "Magie",
    "Technologie/Gadgets", "Combat/Arts martiaux", "Armes", "Psychique/Télépathie",
    "Énergie/Rayons", "Contrôle des éléments", "Métamorphose", "Aucun"
  ],

  // On peut ajouter des groupes à la fin de la liste, jamais en enlever.
  groupes: [
    // Marvel
    "Avengers", "X-Men", "X-Force", "Confrérie des Mutants", "Quatre Fantastiques",
    "Gardiens de la Galaxie", "Hydra",
    // DC
    "Justice League", "Teen Titans", "Suicide Squad", "Birds of Prey",
    // Manga
    "Guerriers Z", "Équipe 7", "Akatsuki", "Équipage du Chapeau de Paille",
    "Bataillon d'exploration", "Classe 1-A", "Pourfendeurs de démons",
    "Lycée de Jujutsu", "Alchimistes d'État", "Association des Héros",
    "Shinigami", "Hunters", "Fairy Tail", "Sailor Guerrières",
    // Indé
    "BPRD", "Gardiens du Globe", "Tortues Ninja", "Juges", "Les Sauveurs",
    // Films
    "Ordre Jedi", "Alliance rebelle", "Empire galactique", "Skynet", "Zion",
    // Séries
    "Starfleet",
    // Jeux vidéo
    "Confrérie des Assassins",
    // Livres
    "Ordre du Phénix", "Mangemorts", "Communauté de l'Anneau",
    // Aucun groupe
    "Aucun"
  ]
};

// L'ADRESSE OFFICIELLE DU SITE. Le message de partage et l'image des cartes partagées utilisent l'adresse que le joueur a
// dans son navigateur AU MOMENT du partage (elles suivent donc tout seules un futur nom de domaine) ; cette adresse-ci ne sert
// que de secours (page ouverte en local ou par double-clic). Les balises d'aperçu de lien dans index.html, elles, exigent une
// adresse complète écrite à la main : voir la liste de contrôle dans BRIEF.md, « Changer l'adresse du site ».
window.SITE = {
  adresse: "https://heros-du-jour.vercel.app/",   // avec https:// et la barre finale
  affichage: "heros-du-jour.vercel.app"           // la version courte, écrite sur les images
};

// L'adresse e-mail où les joueurs peuvent signaler une erreur sur la fiche d'un personnage (lien « Signaler une erreur »).
window.ADRESSE_CONTACT = "jourduheros@gmail.com";

// Les personnages dont les cartes figurent dans l'image d'aperçu du lien partagé (images/apercu.jpg, fabriquée avec
// maquettes/apercu.html). Le jour où l'un d'eux est le personnage du jour, l'aperçu le montrerait : la page de vérification
// du calendrier signale ces jours, et il faut alors remplacer l'image par une autre paire de cartes (voir BRIEF.md, étape 20).
window.PERSONNAGES_APERCU = ["gandalf", "yoda"];

// La grande icône de chaque carte, selon l'espèce du personnage (de simples émojis, aucune image officielle).
window.ICONES_ESPECES = {
  "Humain": "👤",
  "Mutant": "🧬",
  "Humain modifié": "💥",
  "Alien": "👽",
  "Dieu": "⚡",
  "Robot/IA": "🤖",
  "Démon": "😈",
  "Mort-vivant": "💀",
  "Hybride/Animal": "🐾",
  "Autre": "✨"
};

// Versions courtes des pouvoirs et des groupes, pour qu'ils tiennent dans les petites cases
// du jeu (téléphone). Un nom absent de ces listes est affiché tel quel.
window.NOMS_COURTS = {
  "Résistance/Guérison": "Résist.",
  "Technologie/Gadgets": "Techno",
  "Combat/Arts martiaux": "Combat",
  "Force surhumaine": "Force",
  "Psychique/Télépathie": "Psy",
  "Énergie/Rayons": "Énergie",
  "Contrôle des éléments": "Éléments",
  "Métamorphose": "Métam.",
  "Confrérie des Mutants": "Confrérie",
  "Quatre Fantastiques": "Fantastic 4",
  "Gardiens de la Galaxie": "Gardiens Galaxie",
  "Équipage du Chapeau de Paille": "Chapeau de Paille",
  "Bataillon d'exploration": "Bataillon",
  "Pourfendeurs de démons": "Chasseurs de démons",
  "Lycée de Jujutsu": "Lycée Jujutsu",
  "Alchimistes d'État": "Alchimie d'État",
  "Les Sauveurs": "Sauveurs",
  "Association des Héros": "Assoc. Héros",
  "Gardiens du Globe": "Gardiens Globe",
  "Sailor Guerrières": "Sailor",
  "Alliance rebelle": "Rebelles",
  "Empire galactique": "Empire",
  "Ordre Jedi": "Jedi",
  "Confrérie des Assassins": "Assassins",
  "Ordre du Phénix": "Phénix",
  "Mangemorts": "Mange-morts",
  "Communauté de l'Anneau": "Anneau"
};
