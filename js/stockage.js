// La sauvegarde de la partie dans le navigateur du joueur (« localStorage »).
// Rien n'est envoyé sur Internet : tout reste dans le téléphone ou l'ordinateur du joueur.
// Toutes les lectures et écritures sont entourées de try/catch : si le navigateur refuse
// (navigation privée, mémoire pleine…), le jeu marche quand même, il ne retient simplement rien.

const CLE_PARTIE = "heros-du-jour-partie";

// Lit la partie sauvegardée. Renvoie un objet { version, numero, mystere, essais }, ou null s'il n'y en a pas
// (ou si la sauvegarde est abîmée).
function lireSauvegarde() {
  try {
    const texte = localStorage.getItem(CLE_PARTIE);
    if (!texte) return null;
    const donnees = JSON.parse(texte);
    if (donnees && donnees.version === 1 && Array.isArray(donnees.essais)) return donnees;
  } catch (erreur) {
    // sauvegarde illisible : on fait comme s'il n'y en avait pas
  }
  return null;
}

// Écrit la sauvegarde de la partie du jour.
function ecrireSauvegarde(donnees) {
  try {
    localStorage.setItem(CLE_PARTIE, JSON.stringify(donnees));
  } catch (erreur) {
    // pas grave : la partie continue, elle ne sera juste pas retrouvée au prochain chargement
  }
}

// Efface la partie sauvegardée.
function effacerSauvegarde() {
  try {
    localStorage.removeItem(CLE_PARTIE);
  } catch (erreur) {
    // rien à faire
  }
}
