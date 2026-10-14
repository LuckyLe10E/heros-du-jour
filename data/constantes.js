// Listes fixes des valeurs possibles pour chaque critère.
// Les fiches de personnages (personnages.js) n'ont le droit d'utiliser QUE ces valeurs,
// sinon les comparaisons du jeu ne marchent pas. Pas de variantes d'orthographe.

window.CRITERES = {
  univers: ["Marvel", "DC", "Manga", "Indé"],

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
    // Aucun groupe
    "Aucun"
  ]
};
