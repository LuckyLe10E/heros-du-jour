// Les données du profil : le résultat de chaque jour joué (pour les statistiques et la série) et la carte favorite.
// Rangées dans le navigateur du joueur, comme la partie et la collection (try/catch partout), et sauvegardées
// en ligne avec le compte Google si le joueur est connecté (voir compte.js).
// En mode test (?perso=...), on ne note rien : les statistiques ne comptent que les vraies parties.
//
// On ne range pas des totaux mais le résultat de CHAQUE JOUR : { "2026-10-15": { gagne: true, essais: 3 }, ... }.
// Les statistiques sont calculées à partir de là. Ainsi, quand on fusionne deux appareils, un même jour
// n'est jamais compté deux fois.

const CLE_STATS = "heros-du-jour-stats";

// Écrit une date au format « 2026-10-15 » (heure locale).
function texteDeLaDate(date) {
  const deuxChiffres = nombre => String(nombre).padStart(2, "0");
  return date.getFullYear() + "-" + deuxChiffres(date.getMonth() + 1) + "-" + deuxChiffres(date.getDate());
}

// Vérifie le résultat d'un jour rangé dans le navigateur (ou reçu du compte en ligne).
function jourValide(date, jour) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
    && Boolean(jour) && typeof jour.gagne === "boolean"
    && Number.isInteger(jour.essais) && jour.essais >= 1 && jour.essais <= MAX_ESSAIS;
}

// Ne garde que les jours valides d'une liste { date: { gagne, essais } }.
function nettoyerLesJours(jours) {
  const propres = {};
  if (jours && typeof jours === "object") {
    Object.keys(jours).forEach(date => {
      if (jourValide(date, jours[date])) propres[date] = { gagne: jours[date].gagne, essais: jours[date].essais };
    });
  }
  return propres;
}

// Vérifie la carte favorite : { id, maj } (maj = le moment du choix, pour savoir laquelle est la plus récente).
function favoriValide(favori) {
  return Boolean(favori) && typeof favori.id === "string" && Boolean(trouverPersonnage(favori.id))
    && Number.isFinite(favori.maj);
}

// Vérifie le compteur de parties bonus : { date, faites } (combien de parties bonus ont été lancées ce jour-là).
function bonusValide(bonus) {
  return Boolean(bonus) && /^\d{4}-\d{2}-\d{2}$/.test(bonus.date)
    && Number.isInteger(bonus.faites) && bonus.faites >= 0 && bonus.faites <= MAX_BONUS;
}

// Lit les données du profil. Renvoie { jours: {...}, favori: {id, maj} ou null, bonus: {date, faites} ou null }.
function lireStats() {
  const stats = { jours: {}, favori: null, bonus: null };
  try {
    const texte = localStorage.getItem(CLE_STATS);
    if (!texte) return stats;
    const donnees = JSON.parse(texte);
    if (donnees && donnees.version === 1) {
      stats.jours = nettoyerLesJours(donnees.jours);
      if (favoriValide(donnees.favori)) stats.favori = { id: donnees.favori.id, maj: donnees.favori.maj };
      if (bonusValide(donnees.bonus)) stats.bonus = { date: donnees.bonus.date, faites: donnees.bonus.faites };
    }
  } catch (erreur) {
    // données illisibles : on repart de zéro
  }
  return stats;
}

function ecrireStats(stats) {
  try {
    localStorage.setItem(CLE_STATS, JSON.stringify({ version: 1, jours: stats.jours, favori: stats.favori, bonus: stats.bonus }));
  } catch (erreur) {
    // pas grave : les statistiques ne seront pas retrouvées au prochain chargement
  }
}

// ---------- Noter la partie du jour ----------

// Quand la partie du jour est finie (gagnée ou perdue), on note le résultat de la journée.
// On peut l'appeler plusieurs fois sans risque (au chargement de la page aussi) : un jour n'est noté qu'une fois.
function noterLaJournee() {
  if (partie.modeTest || partie.mode !== "jour" || partie.statut === "en cours") return;   // seules les parties du jour comptent
  const stats = lireStats();
  const date = texteDeLaDate(dateDepuisTexte(window.DATE_LANCEMENT, partie.numero - 1));   // la date de CETTE partie
  const jour = { gagne: partie.statut === "gagne", essais: partie.essais.length };
  stats.jours[date] = meilleureJournee(stats.jours[date], jour);
  ecrireStats(stats);
}

// ---------- Fusionner (appareil + compte en ligne) ----------

// Entre deux résultats du même jour : une victoire passe avant une défaite, puis le moins d'essais.
function meilleureJournee(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.gagne !== b.gagne) return a.gagne ? a : b;
  return a.essais <= b.essais ? a : b;
}

function fusionnerJours(joursA, joursB) {
  const fusion = {};
  new Set(Object.keys(joursA).concat(Object.keys(joursB))).forEach(date => {
    fusion[date] = meilleureJournee(joursA[date], joursB[date]);
  });
  return fusion;
}

function memesJours(joursA, joursB) {
  const dates = Object.keys(joursA);
  if (dates.length !== Object.keys(joursB).length) return false;
  return dates.every(date => Boolean(joursB[date]) && joursA[date].gagne === joursB[date].gagne && joursA[date].essais === joursB[date].essais);
}

// Entre deux cartes favorites, la dernière choisie l'emporte.
function fusionnerFavoris(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a.maj >= b.maj ? a : b;
}

function memesFavoris(a, b) {
  if (!a || !b) return a === b;
  return a.id === b.id && a.maj === b.maj;
}

// Entre deux compteurs de parties bonus : le plus récent jour l'emporte ; le même jour, le plus grand nombre
// (jouer sur deux appareils ne donne pas 5 parties bonus de plus).
function fusionnerBonus(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.date !== b.date) return a.date > b.date ? a : b;
  return a.faites >= b.faites ? a : b;
}

function memesBonus(a, b) {
  if (!a || !b) return a === b;
  return a.date === b.date && a.faites === b.faites;
}

// Lit les jours, le favori et le compteur bonus reçus du compte en ligne (on ne fait jamais confiance aux données reçues).
function statsDuCompte(donnees) {
  const stats = { jours: {}, favori: null, bonus: null };
  if (donnees) {
    stats.jours = nettoyerLesJours(donnees.jours);
    if (favoriValide(donnees.favori)) stats.favori = { id: donnees.favori.id, maj: donnees.favori.maj };
    if (bonusValide(donnees.bonus)) stats.bonus = { date: donnees.bonus.date, faites: donnees.bonus.faites };
  }
  return stats;
}

// ---------- La carte favorite ----------

// Le joueur choisit sa carte favorite (il doit la posséder).
function choisirLeFavori(id) {
  const stats = lireStats();
  stats.favori = { id, maj: Date.now() };
  ecrireStats(stats);
}

// La carte à montrer en vitrine : le favori choisi (s'il est dans la collection), sinon la plus rare (puis la plus récente).
// Renvoie la carte, ou null si le joueur n'en a aucune.
function carteDeLaVitrine() {
  const cartes = lireCollection().cartes;
  const favori = lireStats().favori;
  if (favori && cartes[favori.id]) return cartes[favori.id];

  let meilleure = null;
  Object.keys(cartes).forEach(id => {
    const carte = cartes[id];
    if (!meilleure) { meilleure = carte; return; }
    const difference = RARETES[carte.rarete].ordre - RARETES[meilleure.rarete].ordre;
    if (difference > 0 || (difference === 0 && carte.date > meilleure.date)) meilleure = carte;
  });
  return meilleure;
}

// ---------- Les calculs ----------

// Calcule tout ce que montre le profil. "aujourdhui" est une date (le jour même, à minuit).
// Série : nombre de jours JOUÉS d'affilée (gagnés ou perdus). Elle reste en vie tant qu'on n'a pas raté un jour entier :
// si on n'a pas encore joué aujourd'hui, elle compte jusqu'à hier.
function calculerStatistiques(jours, aujourdhui) {
  const dates = Object.keys(jours).sort();
  const resultat = {
    parties: dates.length,
    victoires: dates.filter(date => jours[date].gagne).length,
    repartition: new Array(MAX_ESSAIS).fill(0),   // la case 0 = gagné en 1 essai, la case 9 = en 10 essais
    perdues: 0,
    serieActuelle: 0,
    meilleureSerie: 0,
    jouePeutProlonger: false,                     // la série est en vie mais on n'a pas encore joué aujourd'hui
    derniersJours: []                             // les 14 derniers jours, du plus ancien à aujourd'hui
  };

  dates.forEach(date => {
    if (jours[date].gagne) resultat.repartition[jours[date].essais - 1]++;
    else resultat.perdues++;
  });

  const veille = date => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);

  // La série en cours
  let jour = aujourdhui;
  if (!jours[texteDeLaDate(jour)]) {
    jour = veille(jour);
    resultat.jouePeutProlonger = Boolean(jours[texteDeLaDate(jour)]);
  }
  while (jours[texteDeLaDate(jour)]) {
    resultat.serieActuelle++;
    jour = veille(jour);
  }

  // La meilleure série : la plus longue suite de jours qui se suivent
  let courante = 0;
  let precedent = null;
  dates.forEach(date => {
    const jourDate = dateDepuisTexte(date);
    const suit = precedent !== null && Math.round((jourDate - precedent) / 86400000) === 1;
    courante = suit ? courante + 1 : 1;
    resultat.meilleureSerie = Math.max(resultat.meilleureSerie, courante);
    precedent = jourDate;
  });

  for (let i = 13; i >= 0; i--) {
    const date = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate() - i);
    const jourNote = jours[texteDeLaDate(date)];
    resultat.derniersJours.push({ date, etat: jourNote ? (jourNote.gagne ? "gagne" : "perdu") : "vide" });
  }
  return resultat;
}
