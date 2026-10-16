// Rejouer un jour passé (le « rattrapage »).
// Le joueur qui a raté un jour peut jouer le personnage mystère de ce jour-là, avec des limites pour garder tout son intérêt
// à la partie du jour :
//  - au plus 3 jours rattrapés par jour (le compteur est séparé de celui des parties bonus et suit le compte Google) ;
//  - seulement les 30 derniers jours ; un jour déjà joué (ou déjà rattrapé, gagné ou perdu) ne se rejoue pas ;
//  - la carte gagnée ne peut pas dépasser « Rare » (la Légendaire est réservée à ceux qui jouent le jour même) ;
//  - un jour rattrapé ne compte pas dans la série de jours d'affilée ; il est compté à part dans les statistiques.
// Le rattrapage en cours est rangé ici, pour qu'on ne puisse pas recommencer en rechargeant la page.

const CLE_RATTRAPAGE = "heros-du-jour-rattrapage";
const MAX_RATTRAPAGES = 3;          // le nombre de jours qu'on peut rattraper par jour
const JOURS_RATTRAPABLES = 30;      // on remonte au plus 30 jours en arrière

// Lit le rattrapage en cours : { date, enCours: { jour, numero, essais, offert, difficulte } ou null }. Valable seulement aujourd'hui.
function lireRattrapage() {
  const aujourdhui = texteDeLaDate(new Date());
  const vide = { date: aujourdhui, enCours: null };
  try {
    const texte = localStorage.getItem(CLE_RATTRAPAGE);
    if (!texte) return vide;
    const donnees = JSON.parse(texte);
    if (!donnees || donnees.version !== 1 || donnees.date !== aujourdhui) return vide;
    const c = donnees.enCours;
    const difficulte = c && window.DIFFICULTES[c.difficulte] ? c.difficulte : "normal";
    if (c && /^\d{4}-\d{2}-\d{2}$/.test(c.jour) && Number.isInteger(c.numero) && c.numero >= 1
        && Array.isArray(c.essais) && c.essais.length < window.DIFFICULTES[difficulte].essais
        && c.essais.every(id => typeof id === "string" && trouverPersonnage(id)) && new Set(c.essais).size === c.essais.length
        && !c.essais.includes(mystereDuNumero(c.numero).id)) {
      return { date: aujourdhui, enCours: { jour: c.jour, numero: c.numero, essais: c.essais, offert: typeof c.offert === "string" ? c.offert : null, difficulte } };
    }
    return vide;
  } catch (erreur) {
    return vide;
  }
}

function ecrireRattrapage(rattrapage) {
  try {
    localStorage.setItem(CLE_RATTRAPAGE, JSON.stringify({ version: 1, date: rattrapage.date, enCours: rattrapage.enCours }));
  } catch (erreur) {
    // pas grave : le rattrapage continuera, mais ne sera pas retrouvé après un rechargement
  }
}

// Combien de jours ont été rattrapés (lancés) aujourd'hui, et combien il en reste.
function rattrapagesFaits() {
  const compteur = lireStats().rattrapageJour;
  return compteur && compteur.date === texteDeLaDate(new Date()) ? compteur.faites : 0;
}

function rattrapagesRestants() {
  return Math.max(0, MAX_RATTRAPAGES - rattrapagesFaits());
}

function noterUnRattrapage() {
  const stats = lireStats();
  stats.rattrapageJour = { date: texteDeLaDate(new Date()), faites: Math.min(MAX_RATTRAPAGES, rattrapagesFaits() + 1) };
  ecrireStats(stats);
}

// La date (« 2026-10-12 ») du jour numéro n.
function dateDuNumero(n) {
  return texteDeLaDate(dateDepuisTexte(window.DATE_LANCEMENT, n - 1));
}

// La liste des jours passés qu'on peut afficher (les 30 derniers, du plus récent au plus ancien), avec leur état :
// "disponible", "en-cours", "joue-gagne", "joue-perdu", "rattrape-gagne" ou "rattrape-perdu".
function joursARattraper() {
  const stats = lireStats();
  const enCours = lireRattrapage().enCours;
  const aujourdhui = numeroDuJour();
  const liste = [];
  for (let n = aujourdhui - 1; n >= Math.max(1, aujourdhui - JOURS_RATTRAPABLES); n--) {
    const date = dateDuNumero(n);
    let etat = "disponible";
    if (stats.jours[date]) etat = stats.jours[date].gagne ? "joue-gagne" : "joue-perdu";
    else if (stats.rattrapages[date]) etat = stats.rattrapages[date].gagne ? "rattrape-gagne" : "rattrape-perdu";
    else if (enCours && enCours.jour === date) etat = "en-cours";
    liste.push({ numero: n, date, etat });
  }
  return liste;
}

// Lance le rattrapage d'un jour (ou reprend celui qui est en cours). Renvoie vrai si la partie est prête.
// Remplace la partie affichée (partie.…) : à l'appelant de redessiner l'écran.
function lancerUnRattrapage(date) {
  if (partie.modeTest) return false;
  const rattrapage = lireRattrapage();

  // Un rattrapage est déjà commencé : on le reprend (impossible d'en changer en le quittant)
  if (rattrapage.enCours) {
    const en = rattrapage.enCours;
    reglerLaPartie(mystereDuNumero(en.numero), "rattrapage", 0, en.difficulte, en.numero);
    partie.jourRattrape = en.jour;
    partie.essais = en.essais.slice();
    preparerEssaiOffert(en.offert);
    return true;
  }

  const jour = joursARattraper().find(j => j.date === date);
  if (!jour || jour.etat !== "disponible" || rattrapagesRestants() <= 0) return false;

  noterUnRattrapage();
  reglerLaPartie(mystereDuNumero(jour.numero), "rattrapage", 0, undefined, jour.numero);
  partie.jourRattrape = jour.date;
  preparerEssaiOffert(null);
  rattrapage.enCours = { jour: jour.date, numero: jour.numero, essais: [], offert: partie.offert, difficulte: partie.difficulte };
  ecrireRattrapage(rattrapage);
  return true;
}

// Range le rattrapage en cours (appelée après chaque essai). Un rattrapage fini n'est plus « en cours ».
function sauvegarderLeRattrapage() {
  const rattrapage = lireRattrapage();
  rattrapage.enCours = partie.statut === "en cours"
    ? { jour: partie.jourRattrape, numero: partie.numero, essais: partie.essais.slice(), offert: partie.offert, difficulte: partie.difficulte }
    : null;
  ecrireRattrapage(rattrapage);
}
