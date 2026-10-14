// Version 2 : les cartes à collectionner (les données : rareté, création, enregistrement).
// Chaque fois que le joueur trouve le personnage du jour, il gagne la carte de ce personnage.
// La collection est rangée dans le navigateur du joueur, comme la partie (try/catch partout).
// En mode test (?perso=...), la collection est SÉPARÉE de la vraie : elle ne touche jamais aux vraies cartes.

const CLE_COLLECTION = "heros-du-jour-collection";
const CLE_COLLECTION_TEST = "heros-du-jour-collection-test";

// Les trois raretés. "ordre" sert à comparer : plus c'est grand, plus c'est rare.
const RARETES = {
  legendaire: { nom: "Légendaire", ordre: 3 },
  rare:       { nom: "Rare",       ordre: 2 },
  commune:    { nom: "Commune",    ordre: 1 }
};

// La rareté selon le nombre d'essais : 1 à 3 = Légendaire, 4 à 6 = Rare, 7 à 10 = Commune.
function calculerRarete(nombreEssais) {
  if (nombreEssais <= 3) return "legendaire";
  if (nombreEssais <= 6) return "rare";
  return "commune";
}

// Le nom sous lequel la collection est rangée (la vraie, ou celle des tests).
function cleDeLaCollection() {
  return partie.modeTest ? CLE_COLLECTION_TEST : CLE_COLLECTION;
}

// Vérifie qu'une carte rangée dans le navigateur est valide (personnage connu, rareté connue, essais réalistes).
function carteValide(carte) {
  return Boolean(carte)
    && typeof carte.id === "string" && Boolean(trouverPersonnage(carte.id))
    && Boolean(RARETES[carte.rarete])
    && Number.isInteger(carte.essais) && carte.essais >= 1 && carte.essais <= MAX_ESSAIS
    && typeof carte.date === "string"
    && Number.isInteger(carte.numero);
}

// Lit la collection. Renvoie un objet { cartes: { "hulk": {...}, ... } }.
// Les cartes abîmées sont ignorées ; s'il n'y a rien (ou si le navigateur refuse), la collection est vide.
function lireCollection() {
  const collection = { cartes: {} };
  try {
    const texte = localStorage.getItem(cleDeLaCollection());
    if (!texte) return collection;
    const donnees = JSON.parse(texte);
    if (donnees && donnees.version === 1 && donnees.cartes && typeof donnees.cartes === "object") {
      Object.keys(donnees.cartes).forEach(id => {
        if (carteValide(donnees.cartes[id]) && donnees.cartes[id].id === id) collection.cartes[id] = donnees.cartes[id];
      });
    }
  } catch (erreur) {
    // collection illisible : on la considère vide
  }
  return collection;
}

// Range la collection dans le navigateur.
function ecrireCollection(collection) {
  try {
    localStorage.setItem(cleDeLaCollection(), JSON.stringify({ version: 1, cartes: collection.cartes }));
  } catch (erreur) {
    // pas grave : la carte sera quand même montrée, mais pas retrouvée au prochain chargement
  }
}

// Efface la collection de TEST (jamais la vraie). Sert à Luca avec ?recommencer en mode test.
function effacerCollectionDeTest() {
  try {
    localStorage.removeItem(CLE_COLLECTION_TEST);
  } catch (erreur) {
    // rien à faire
  }
}

// La date d'aujourd'hui au format « 2026-10-14 » (heure locale).
function dateDuJourEnTexte() {
  const maintenant = new Date();
  const deuxChiffres = nombre => String(nombre).padStart(2, "0");
  return maintenant.getFullYear() + "-" + deuxChiffres(maintenant.getMonth() + 1) + "-" + deuxChiffres(maintenant.getDate());
}

// Fabrique la carte gagnée pendant cette partie (le personnage trouvé, le nombre d'essais, la date…).
function creerCarteDeLaPartie() {
  return {
    id: partie.mystere.id,
    rarete: calculerRarete(partie.essais.length),
    essais: partie.essais.length,
    date: dateDuJourEnTexte(),
    numero: partie.numero
  };
}

// À la victoire : le joueur gagne la carte du personnage et elle rejoint sa collection.
// Si la carte est déjà dans la collection, on garde l'ancienne (la montée de rareté viendra à l'étape 13).
// Résultat dans partie.carte (la carte à montrer) et partie.carteNouvelle (vrai si elle vient d'être gagnée).
function gagnerLaCarte() {
  const collection = lireCollection();
  const existante = collection.cartes[partie.mystere.id];
  if (existante) {
    partie.carte = existante;
    partie.carteNouvelle = false;
    return;
  }
  const carte = creerCarteDeLaPartie();
  collection.cartes[carte.id] = carte;
  ecrireCollection(collection);
  partie.carte = carte;
  partie.carteNouvelle = true;
}

// Quand on recharge la page avec une partie déjà gagnée : on retrouve la carte dans la collection
// (ou, si elle n'y est pas, on la refabrique à partir de la partie). Pas d'animation dans ce cas.
function retrouverLaCarte() {
  const existante = lireCollection().cartes[partie.mystere.id];
  partie.carte = existante || creerCarteDeLaPartie();
  partie.carteNouvelle = false;
  partie.carteRevelee = true;
}
