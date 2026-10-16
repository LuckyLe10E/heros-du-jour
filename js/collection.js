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

// La rareté selon le nombre d'essais ET la difficulté :
//  - Normal : 1 à 3 essais = Légendaire, 4 à 6 = Rare, 7 à 10 = Commune ;
//  - Facile : jamais Légendaire (1 à 6 essais = Rare, 7 à 15 = Commune) ;
//  - Expert : plus exigeant (1 à 2 essais = Légendaire, 3 à 4 = Rare, 5 à 6 = Commune).
function calculerRarete(nombreEssais, difficulte) {
  if (difficulte === "expert") {
    if (nombreEssais <= 2) return "legendaire";
    return nombreEssais <= 4 ? "rare" : "commune";
  }
  if (difficulte === "facile") return nombreEssais <= 6 ? "rare" : "commune";
  if (nombreEssais <= 3) return "legendaire";
  if (nombreEssais <= 6) return "rare";
  return "commune";
}

// La difficulté d'une carte : « facile », « normal » ou « expert » (une carte sans marque est une carte Normale).
function difficulteDeLaCarte(carte) {
  return carte && window.DIFFICULTES[carte.mode] ? carte.mode : "normal";
}

// La valeur d'une carte pour savoir laquelle garder : d'abord la rareté, puis (à rareté égale) la difficulté.
// Ainsi une carte ne descend jamais en rareté, et une carte Expert vaut mieux qu'une Normale, qui vaut mieux qu'une Facile.
function valeurDeLaCarte(carte) {
  return RARETES[carte.rarete].ordre * 10 + window.DIFFICULTES[difficulteDeLaCarte(carte)].rang;
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
    && (carte.mode === undefined || Boolean(window.DIFFICULTES[carte.mode]))
    && Number.isInteger(carte.essais) && carte.essais >= 1 && carte.essais <= ESSAIS_MAX_TOUS_MODES
    && typeof carte.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(carte.date)
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
  let rarete = calculerRarete(partie.essais.length, partie.difficulte);
  if (partie.mode === "rattrapage" && rarete === "legendaire") rarete = "rare";   // la Légendaire est réservée à ceux qui jouent le jour même
  const carte = {
    id: partie.mystere.id,
    rarete,
    essais: partie.essais.length,
    date: dateDuJourEnTexte(),
    numero: partie.numero
  };
  if (partie.difficulte !== "normal") carte.mode = partie.difficulte;   // une carte Normale n'a pas de marque
  return carte;
}

// À la victoire : le joueur gagne la carte du personnage et elle rejoint sa collection.
//  - Carte jamais gagnée : elle est ajoutée (partie.carteNouvelle = vrai).
//  - Carte déjà possédée et le joueur a fait MIEUX (rareté plus haute) : la carte est améliorée
//    (partie.carteAmelioree = vrai, partie.ancienneRarete = l'ancienne rareté, partie.ancienneDifficulte = l'ancienne difficulté).
//    « Fait mieux » = rareté plus haute, ou, à rareté égale, difficulté plus haute (Expert > Normal > Facile).
//  - Carte déjà possédée et le joueur n'a pas fait mieux : on garde l'ancienne. Une carte ne descend JAMAIS en rareté.
// Résultat dans partie.carte : la carte à montrer.
function gagnerLaCarte() {
  const collection = lireCollection();
  const existante = collection.cartes[partie.mystere.id];
  const gagnee = creerCarteDeLaPartie();

  partie.carteNouvelle = false;
  partie.carteAmelioree = false;
  partie.ancienneRarete = null;
  partie.ancienneDifficulte = null;

  if (!existante) {
    collection.cartes[gagnee.id] = gagnee;
    ecrireCollection(collection);
    partie.carte = gagnee;
    partie.carteNouvelle = true;
  } else if (valeurDeLaCarte(gagnee) > valeurDeLaCarte(existante)) {
    collection.cartes[gagnee.id] = gagnee;
    ecrireCollection(collection);
    partie.carte = gagnee;
    partie.carteAmelioree = true;
    partie.ancienneRarete = existante.rarete;
    partie.ancienneDifficulte = difficulteDeLaCarte(existante);
  } else {
    partie.carte = existante;
  }
}

// Quand on recharge la page avec une partie déjà gagnée : on retrouve la carte dans la collection
// (ou, si elle n'y est pas, on la refabrique à partir de la partie). Pas d'animation dans ce cas.
function retrouverLaCarte() {
  const existante = lireCollection().cartes[partie.mystere.id];
  partie.carte = existante || creerCarteDeLaPartie();
  partie.carteNouvelle = false;
  partie.carteRevelee = true;
}

// ---------- Fusionner deux collections (appareil + compte en ligne) ----------
// On ne perd jamais de carte, et une carte ne descend jamais en rareté.

// Entre deux versions de la même carte, garde la meilleure : rareté la plus haute, puis difficulté la plus haute (Expert > Normal > Facile),
// puis le moins d'essais, puis la plus ancienne.
function meilleureCarte(a, b) {
  if (!a) return b;
  if (!b) return a;
  const valeurA = valeurDeLaCarte(a);
  const valeurB = valeurDeLaCarte(b);
  if (valeurA !== valeurB) return valeurA > valeurB ? a : b;
  if (a.essais !== b.essais) return a.essais < b.essais ? a : b;
  return a.date <= b.date ? a : b;
}

// Fusionne deux listes de cartes { id: carte } : toutes les cartes des deux, la meilleure version de chacune.
function fusionnerCartes(cartesA, cartesB) {
  const fusion = {};
  new Set(Object.keys(cartesA).concat(Object.keys(cartesB))).forEach(id => {
    fusion[id] = meilleureCarte(cartesA[id], cartesB[id]);
  });
  return fusion;
}

// Vrai si deux listes de cartes sont exactement les mêmes.
function memesCartes(cartesA, cartesB) {
  const idsA = Object.keys(cartesA);
  if (idsA.length !== Object.keys(cartesB).length) return false;
  return idsA.every(id => {
    const a = cartesA[id];
    const b = cartesB[id];
    return Boolean(b) && a.rarete === b.rarete && a.essais === b.essais && a.date === b.date && a.numero === b.numero
      && difficulteDeLaCarte(a) === difficulteDeLaCarte(b);
  });
}

// Lit les cartes reçues du compte en ligne : on ne garde que les cartes valides (on ne fait jamais confiance aux données reçues).
function cartesDuCompte(donnees) {
  const cartes = {};
  if (donnees && donnees.cartes && typeof donnees.cartes === "object") {
    Object.keys(donnees.cartes).forEach(id => {
      const carte = donnees.cartes[id];
      if (carteValide(carte) && carte.id === id) {
        cartes[id] = { id: carte.id, rarete: carte.rarete, essais: carte.essais, date: carte.date, numero: carte.numero };
        if (carte.mode) cartes[id].mode = carte.mode;
      }
    });
  }
  return cartes;
}
