// La logique du jeu (pas l'affichage).

// Cherche un personnage par son identifiant, par exemple "batman".
function trouverPersonnage(id) {
  return window.PERSONNAGES.find(p => p.id === id);
}

// Le nombre maximum d'essais par partie.
const MAX_ESSAIS = 10;

// Le numéro du jour : 1 le jour du lancement, 2 le lendemain, etc. (selon la date du téléphone).
function numeroDuJour() {
  return joursEntre(window.DATE_LANCEMENT, new Date()) + 1;
}

// Choisit le personnage mystère du jour : calendrier[(numéro - 1) % nombre de personnages].
// Mode test : si l'adresse finit par ?perso=batman, c'est ce personnage (réservé à Luca, pour tester).
function choisirMystere() {
  const idDemande = new URLSearchParams(window.location.search).get("perso");
  if (idDemande) {
    const personnage = trouverPersonnage(idDemande);
    if (personnage) return { personnage, modeTest: true };
    console.warn("Mode test : personnage inconnu « " + idDemande + " », il est ignoré.");
  }
  const total = window.CALENDRIER.length;
  const position = ((numeroDuJour() - 1) % total + total) % total;   // reste toujours entre 0 et total - 1
  return { personnage: trouverPersonnage(window.CALENDRIER[position]), modeTest: false };
}

// L'état de la partie en cours.
const mystere = choisirMystere();
const partie = {
  numero: numeroDuJour(),         // « Héros du Jour n°… »
  mystere: mystere.personnage,    // le personnage à deviner
  modeTest: mystere.modeTest,     // vrai si on a utilisé ?perso=... dans l'adresse
  essais: [],                     // les "id" des personnages déjà proposés, du plus ancien au plus récent
  statut: "en cours"              // "en cours", "gagne" ou "perdu"
};

// Combien d'essais ratés jusqu'ici (tous les essais, sauf le bon).
function nombreEchecs() {
  return partie.essais.filter(id => id !== partie.mystere.id).length;
}

// La liste des indices déjà dévoilés, selon le nombre d'essais ratés. Chaque indice s'ajoute au précédent :
//   3 ratés : l'indice discret   |   4 ratés : le titre de l'œuvre
//   5, 6, 7, 8 ratés : la 1re, 2e, 3e puis 4e phrase de la fiche
// Renvoie une liste de { titre, texte }.
function indicesDevoiles() {
  const echecs = nombreEchecs();
  const indices = [];
  if (echecs >= 3) indices.push({ titre: "Indice", texte: partie.mystere.indice });
  if (echecs >= 4) indices.push({ titre: "Œuvre", texte: partie.mystere.oeuvre });
  decouperEnPhrases(partie.mystere.description).forEach((phrase, i) => {
    if (echecs >= 5 + i) indices.push({ titre: "Détail " + (i + 1), texte: phrase });
  });
  return indices;
}

// Les 7 critères, dans l'ordre où ils s'affichent.
// "genre" de comparaison : "simple" (identique ou pas), "liste" (plusieurs valeurs), "annee" (avec flèche).
const CRITERES_JEU = [
  { cle: "univers",  titre: "Univers",   genre: "simple" },
  { cle: "camp",     titre: "Camp",      genre: "simple" },
  { cle: "genre",    titre: "Genre",     genre: "simple" },
  { cle: "espece",   titre: "Espèce",    genre: "simple" },
  { cle: "pouvoirs", titre: "Pouvoirs",  genre: "liste" },
  { cle: "groupes",  titre: "Groupe",    genre: "liste" },
  { cle: "annee",    titre: "Année",     genre: "annee" }
];

// Compare deux listes (pouvoirs ou groupes) :
// "vert" si elles contiennent exactement les mêmes valeurs, "orange" si au moins une est commune, sinon "rouge".
function comparerListes(listeEssai, listeMystere) {
  const communs = listeEssai.filter(valeur => listeMystere.includes(valeur));
  if (communs.length === listeEssai.length && communs.length === listeMystere.length) return "vert";
  return communs.length > 0 ? "orange" : "rouge";
}

// Compare le personnage proposé au personnage mystère, critère par critère.
// Renvoie 7 résultats : { etat: "vert" | "orange" | "rouge", fleche: "haut" | "bas" | null }.
// La flèche (pour l'année) pointe vers le haut si le mystère est plus récent, vers le bas s'il est plus ancien.
function comparerAvecMystere(personnage) {
  return CRITERES_JEU.map(critere => {
    const valeurEssai = personnage[critere.cle];
    const valeurMystere = partie.mystere[critere.cle];

    if (critere.genre === "liste") {
      return { etat: comparerListes(valeurEssai, valeurMystere), fleche: null };
    }
    if (valeurEssai === valeurMystere) return { etat: "vert", fleche: null };
    if (critere.genre === "annee") {
      return { etat: "rouge", fleche: valeurMystere > valeurEssai ? "haut" : "bas" };
    }
    return { etat: "rouge", fleche: null };
  });
}

// Dit si ce personnage a déjà été proposé dans la partie.
function dejaPropose(id) {
  return partie.essais.includes(id);
}

// Note un essai : on ajoute le personnage à la liste (sauf s'il y est déjà ou si la partie est finie),
// puis on regarde si la partie est gagnée (bon personnage) ou perdue (10 essais utilisés).
// Renvoie true si l'essai a été pris en compte.
function ajouterEssai(id) {
  if (partie.statut !== "en cours") return false;
  if (!trouverPersonnage(id) || dejaPropose(id)) return false;

  partie.essais.push(id);
  if (id === partie.mystere.id) {
    partie.statut = "gagne";
  } else if (partie.essais.length >= MAX_ESSAIS) {
    partie.statut = "perdu";
  }
  return true;
}

// Calcule à quel point un texte « ressemble » au début de la saisie du joueur.
// 0 = le nom commence par la saisie, 1 = un mot du nom commence par la saisie,
// 2 = la saisie est quelque part dans le nom, -1 = aucun rapport.
function noteDeCorrespondance(nom, saisie) {
  const nomNeutre = simplifier(nom);
  const nomColle = nomNeutre.replace(/ /g, "");        // « spiderman » : pour taper sans tiret
  const saisieColle = saisie.replace(/ /g, "");

  if (nomNeutre.startsWith(saisie) || nomColle.startsWith(saisieColle)) return 0;
  if (nomNeutre.split(" ").some(mot => mot.startsWith(saisie))) return 1;
  if (nomNeutre.includes(saisie) || nomColle.includes(saisieColle)) return 2;
  return -1;
}

// Renvoie la liste des personnages qui correspondent à ce que le joueur a tapé.
// La recherche regarde le nom ET les autres noms (« Peter Parker » trouve Spider-Man),
// ignore majuscules et accents, et ne propose pas un personnage déjà essayé.
// Chaque résultat : { personnage, nomTrouve } (nomTrouve = le nom qui a correspondu).
function chercherPersonnages(texteTape) {
  const saisie = simplifier(texteTape);
  if (saisie === "") return [];

  const resultats = [];
  window.PERSONNAGES.forEach(p => {
    if (dejaPropose(p.id)) return;

    // On garde le meilleur nom (le nom principal gagne en cas d'égalité)
    let meilleureNote = -1;
    let nomTrouve = p.nom;
    [p.nom, ...p.autresNoms].forEach(nom => {
      const note = noteDeCorrespondance(nom, saisie);
      if (note !== -1 && (meilleureNote === -1 || note < meilleureNote)) {
        meilleureNote = note;
        nomTrouve = nom;
      }
    });

    if (meilleureNote !== -1) resultats.push({ personnage: p, nomTrouve, note: meilleureNote });
  });

  // D'abord les meilleures correspondances, puis l'ordre alphabétique
  resultats.sort((a, b) => a.note - b.note || a.personnage.nom.localeCompare(b.personnage.nom, "fr"));
  return resultats;
}
