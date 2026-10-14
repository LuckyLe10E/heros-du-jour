// La logique du jeu (pas l'affichage).

// L'état de la partie en cours.
// Étape 4 : on garde seulement la liste des personnages déjà proposés (leurs "id").
const partie = {
  essais: []
};

// Cherche un personnage par son identifiant, par exemple "batman".
function trouverPersonnage(id) {
  return window.PERSONNAGES.find(p => p.id === id);
}

// Dit si ce personnage a déjà été proposé dans la partie.
function dejaPropose(id) {
  return partie.essais.includes(id);
}

// Note un essai : on ajoute le personnage à la liste (sauf s'il y est déjà).
// Renvoie true si l'essai a été pris en compte.
function ajouterEssai(id) {
  if (!trouverPersonnage(id) || dejaPropose(id)) return false;
  partie.essais.push(id);
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
