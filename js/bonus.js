// Les parties bonus et l'entraînement.
//  - Parties bonus : jusqu'à 5 par jour, un personnage différent pour chaque joueur, avec une carte à gagner (comme la partie du jour).
//  - Ensuite, ou si le joueur préfère : l'entraînement libre, sans limite, sans carte.
// Ni l'un ni l'autre ne compte dans les statistiques ni dans la série (seule la partie du jour compte).
//
// Le nombre de parties bonus lancées aujourd'hui est rangé avec les statistiques (il suit le compte Google : jouer sur
// deux appareils ne donne pas plus de parties). La partie bonus en cours est rangée ici, pour qu'on ne puisse pas
// changer de personnage en rechargeant la page.

const CLE_BONUS = "heros-du-jour-bonus";
const MAX_BONUS = 5;   // le nombre de parties bonus (avec carte) par jour

// Lit les parties bonus du jour : { date, dejaTires: [id...], enCours: {numeroBonus, mystere, essais, offert} ou null }.
// Si la sauvegarde date d'un autre jour, on repart de zéro.
function lireBonus() {
  const aujourdhui = texteDeLaDate(new Date());
  const vide = { date: aujourdhui, dejaTires: [], enCours: null };
  try {
    const texte = localStorage.getItem(CLE_BONUS);
    if (!texte) return vide;
    const donnees = JSON.parse(texte);
    if (!donnees || donnees.version !== 1 || donnees.date !== aujourdhui) return vide;
    const dejaTires = Array.isArray(donnees.dejaTires) ? donnees.dejaTires.filter(id => typeof id === "string") : [];
    let enCours = null;
    const c = donnees.enCours;
    if (c && trouverPersonnage(c.mystere) && Array.isArray(c.essais) && Number.isInteger(c.numeroBonus)
        && c.essais.length < window.DIFFICULTES[window.DIFFICULTES[c.difficulte] ? c.difficulte : "normal"].essais && c.essais.every(id => typeof id === "string" && trouverPersonnage(id))
        && new Set(c.essais).size === c.essais.length && !c.essais.includes(c.mystere)) {
      enCours = { numeroBonus: c.numeroBonus, mystere: c.mystere, essais: c.essais, offert: typeof c.offert === "string" ? c.offert : null,
                  difficulte: window.DIFFICULTES[c.difficulte] ? c.difficulte : "normal" };
    }
    return { date: aujourdhui, dejaTires, enCours };
  } catch (erreur) {
    return vide;
  }
}

function ecrireBonus(bonus) {
  try {
    localStorage.setItem(CLE_BONUS, JSON.stringify({ version: 1, date: bonus.date, dejaTires: bonus.dejaTires, enCours: bonus.enCours }));
  } catch (erreur) {
    // pas grave : la partie bonus continuera, mais ne sera pas retrouvée après un rechargement
  }
}

// Combien de parties bonus ont été lancées aujourd'hui, et combien il en reste.
function partiesBonusFaites() {
  const bonus = lireStats().bonus;
  return bonus && bonus.date === texteDeLaDate(new Date()) ? bonus.faites : 0;
}

function partiesBonusRestantes() {
  return Math.max(0, MAX_BONUS - partiesBonusFaites());
}

// Note qu'une partie bonus vient d'être lancée.
function noterUnePartieBonus() {
  const stats = lireStats();
  stats.bonus = { date: texteDeLaDate(new Date()), faites: Math.min(MAX_BONUS, partiesBonusFaites() + 1) };
  stats.totalBonus = Math.min(100000, (stats.totalBonus || 0) + 1);   // pour le succès « 25 parties bonus »
  ecrireStats(stats);
}

// Le personnage d'une nouvelle partie. Jamais le personnage du jour, ni un personnage déjà tiré aujourd'hui.
// Pour les parties bonus (avecCartes = vrai) : le plus souvent un personnage dont le joueur n'a pas encore la carte (pour l'aider à
// compléter sa collection), mais environ 3 fois sur 10 un personnage dont il a déjà la carte, quand elle peut encore être améliorée
// (rareté plus haute ou difficulté plus haute) : c'est l'occasion de l'améliorer. Si la collection est complète, on ne propose que ça.
function choisirUnMystereSupplementaire(dejaTires, avecCartes) {
  const possedees = lireCollection().cartes;
  const tous = window.PERSONNAGES.filter(p => p.id !== MYSTERE_DU_JOUR.id && !dejaTires.includes(p.id));
  let candidats = tous;
  if (avecCartes) {
    const sommet = RARETES.legendaire.ordre * 10 + window.DIFFICULTES.expert.rang;   // une carte Légendaire Expert ne peut plus monter
    const nouvelles = tous.filter(p => !possedees[p.id]);
    const ameliorables = tous.filter(p => possedees[p.id] && valeurDeLaCarte(possedees[p.id]) < sommet);
    const veutAmeliorer = ameliorables.length > 0 && (nouvelles.length === 0 || Math.random() < 0.3);
    if (veutAmeliorer) candidats = ameliorables;
    else if (nouvelles.length > 0) candidats = nouvelles;
  }
  if (candidats.length === 0) candidats = window.PERSONNAGES.filter(p => p.id !== MYSTERE_DU_JOUR.id);
  return candidats[Math.floor(Math.random() * candidats.length)];
}

// La prochaine partie qu'on peut lancer : "bonus" (reprendre celle en cours, ou en commencer une), ou "entrainement".
function typeDeLaProchainePartie() {
  if (lireBonus().enCours || partiesBonusRestantes() > 0) return "bonus";
  return "entrainement";
}

// Lance (ou reprend) une partie bonus, ou une partie d'entraînement s'il n'y a plus de partie bonus aujourd'hui.
// Remplace la partie affichée (partie.…) : à l'appelant de redessiner l'écran.
function lancerUnePartieSupplementaire() {
  const bonus = lireBonus();

  // Une partie bonus est déjà commencée : on la reprend (impossible de changer de personnage en la quittant)
  if (bonus.enCours) {
    const en = bonus.enCours;
    reglerLaPartie(trouverPersonnage(en.mystere), "bonus", en.numeroBonus, en.difficulte);
    partie.essais = en.essais.slice();
    preparerEssaiOffert(en.offert);
    return;
  }

  if (partiesBonusRestantes() > 0) {
    const personnage = choisirUnMystereSupplementaire(bonus.dejaTires, true);
    noterUnePartieBonus();
    reglerLaPartie(personnage, "bonus", partiesBonusFaites());
    preparerEssaiOffert(null);
    bonus.dejaTires.push(personnage.id);
    bonus.enCours = { numeroBonus: partie.numeroBonus, mystere: personnage.id, essais: [], offert: partie.offert, difficulte: partie.difficulte };
    ecrireBonus(bonus);
    return;
  }

  // Plus de partie bonus aujourd'hui : entraînement libre (rien n'est gardé, pas de carte)
  reglerLaPartie(choisirUnMystereSupplementaire([], false), "entrainement", 0);
  preparerEssaiOffert(null);
}

// Range la partie bonus en cours (appelée après chaque essai). Une partie finie n'est plus « en cours ».
function sauvegarderLaPartieBonus() {
  const bonus = lireBonus();
  bonus.enCours = partie.statut === "en cours"
    ? { numeroBonus: partie.numeroBonus, mystere: partie.mystere.id, essais: partie.essais.slice(), offert: partie.offert, difficulte: partie.difficulte }
    : null;
  ecrireBonus(bonus);
}
