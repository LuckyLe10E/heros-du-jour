// Les succès : des médailles à débloquer en jouant. Rien d'autre qu'une fierté pour l'instant (pas de récompense).
//
// Les succès débloqués sont rangés avec les statistiques ({ id: date }) : ils ne disparaissent jamais, même si les données
// changent ensuite (par exemple si on ajoute un personnage à un thème déjà complété). Ils suivent le compte Google.
// En mode test (?perso=...), aucun succès ne se débloque.

// Les groupes de succès, dans l'ordre d'affichage. « couleur » = la couleur de la médaille une fois débloquée.
const GROUPES_DE_SUCCES = [
  { cle: "pas", titre: "Premiers pas", classe: "g-pas" },
  { cle: "maitrise", titre: "Maîtrise", classe: "g-maitrise" },
  { cle: "serie", titre: "Série de jours", classe: "g-serie" },
  { cle: "collection", titre: "Collection", classe: "g-collection" },
  { cle: "themes", titre: "Un thème au complet", classe: "g-themes" },
  { cle: "bonus", titre: "Parties bonus", classe: "g-bonus" },
  { cle: "fun", titre: "Pour le plaisir", classe: "g-fun" }
];

// Les raccourcis de ce que chaque succès regarde (rassemblés une fois par vérification, voir rassemblerLesDonnees).
// condition(d) : vrai quand le succès est mérité. progres(d) : [où on en est, objectif] (facultatif, pour les succès à compter).
const SUCCES = [
  // ----- Premiers pas -----
  { id: "premiere-partie", groupe: "pas", marque: "1", nom: "Première partie", description: "Jouer une partie.",
    condition: d => d.parties >= 1 },
  { id: "premiere-victoire", groupe: "pas", marque: "✓", nom: "Première victoire", description: "Trouver un personnage.",
    condition: d => d.victoires >= 1 || d.cartes.length >= 1 },
  { id: "premiere-carte", groupe: "pas", marque: "1", nom: "Première carte", description: "Gagner ta première carte.",
    condition: d => d.cartes.length >= 1 },

  // ----- Maîtrise -----
  { id: "du-premier-coup", groupe: "maitrise", marque: "!", nom: "Du premier coup", description: "Trouver un personnage dès le premier essai.",
    condition: d => d.cartes.some(c => c.essais === 1) || d.victoiresEn1 >= 1 },
  { id: "dix-victoires-rapides", groupe: "maitrise", marque: "10", nom: "Œil de lynx", description: "Gagner 10 parties du jour en 3 essais ou moins (hors mode Facile).",
    condition: d => d.victoiresRapides >= 10, progres: d => [Math.min(d.victoiresRapides, 10), 10] },
  { id: "dix-sans-faute", groupe: "maitrise", marque: "10", nom: "Sans faute", description: "Gagner 10 parties du jour de suite sans en perdre une.",
    condition: d => d.meilleureSerieDeVictoires >= 10, progres: d => [Math.min(d.meilleureSerieDeVictoires, 10), 10] },

  // ----- Série de jours -----
  { id: "serie-3", groupe: "serie", marque: "3j", nom: "Trois jours", description: "Jouer 3 jours d'affilée.",
    condition: d => d.meilleureSerie >= 3, progres: d => [Math.min(d.meilleureSerie, 3), 3] },
  { id: "serie-7", groupe: "serie", marque: "7j", nom: "Une semaine", description: "Jouer 7 jours d'affilée.",
    condition: d => d.meilleureSerie >= 7, progres: d => [Math.min(d.meilleureSerie, 7), 7] },
  { id: "serie-30", groupe: "serie", marque: "30j", nom: "Un mois", description: "Jouer 30 jours d'affilée.",
    condition: d => d.meilleureSerie >= 30, progres: d => [Math.min(d.meilleureSerie, 30), 30] },

  // ----- Collection -----
  { id: "cartes-10", groupe: "collection", marque: "10", nom: "Dix cartes", description: "Avoir 10 cartes dans ta collection.",
    condition: d => d.cartes.length >= 10, progres: d => [Math.min(d.cartes.length, 10), 10] },
  { id: "cartes-50", groupe: "collection", marque: "50", nom: "Cinquante cartes", description: "Avoir 50 cartes dans ta collection.",
    condition: d => d.cartes.length >= 50, progres: d => [Math.min(d.cartes.length, 50), 50] },
  { id: "cartes-100", groupe: "collection", marque: "100", nom: "Cent cartes", description: "Avoir 100 cartes dans ta collection.",
    condition: d => d.cartes.length >= 100, progres: d => [Math.min(d.cartes.length, 100), 100] },
  { id: "premiere-legendaire", groupe: "collection", marque: "L", nom: "Première légende", description: "Gagner une carte Légendaire.",
    condition: d => d.legendaires >= 1 },
  { id: "dix-legendaires", groupe: "collection", marque: "L10", nom: "Dix légendes", description: "Avoir 10 cartes Légendaires.",
    condition: d => d.legendaires >= 10, progres: d => [Math.min(d.legendaires, 10), 10] }
];

// Un succès par thème complété (créés à partir de la liste des thèmes du jeu : un nouveau thème a donc son succès tout seul).
const MARQUES_DES_THEMES = { "Marvel": "Mv", "DC": "DC", "Manga": "Mg", "Indé": "In", "Films": "Fi", "Séries": "Sé", "Jeux vidéo": "JV", "Livres": "Li" };
window.CRITERES.univers.forEach(theme => {
  SUCCES.push({
    id: "theme-" + simplifier(theme).replace(/ /g, "-"), groupe: "themes", theme,
    marque: MARQUES_DES_THEMES[theme] || theme.slice(0, 2), nom: "Tout « " + theme + " »",
    description: "Avoir toutes les cartes du thème « " + theme + " ».",
    condition: d => d.parTheme[theme] && d.parTheme[theme].possedees >= d.parTheme[theme].total,
    progres: d => [d.parTheme[theme] ? d.parTheme[theme].possedees : 0, d.parTheme[theme] ? d.parTheme[theme].total : 0]
  });
});

SUCCES.push(
  // ----- Parties bonus -----
  { id: "bonus-5-jour", groupe: "bonus", marque: "5", nom: "Journée bonus", description: "Lancer les 5 parties bonus dans la même journée.",
    condition: d => d.bonusDuJour >= MAX_BONUS, progres: d => [Math.min(d.bonusDuJour, MAX_BONUS), MAX_BONUS] },
  { id: "bonus-25", groupe: "bonus", marque: "25", nom: "Habitué du bonus", description: "Lancer 25 parties bonus en tout.",
    condition: d => d.totalBonus >= 25, progres: d => [Math.min(d.totalBonus, 25), 25] },

  // ----- Pour le plaisir -----
  { id: "jour-et-nuit", groupe: "fun", marque: "J/N", nom: "Jour et nuit", description: "Finir une partie avant 7 h et une autre après 23 h.",
    condition: d => Boolean(d.succes._matin && d.succes._nuit) },
  { id: "pile-a-lheure", groupe: "fun", marque: "1 an", nom: "Pile à l'heure", description: "Jouer le jour de l'anniversaire du jeu.",
    condition: d => d.anniversaire }
);

// ---------- Rassembler ce que les succès regardent ----------

// Une seule fois par vérification : toutes les données utiles, calculées à partir de la sauvegarde.
function rassemblerLesDonnees(contexte) {
  const stats = lireStats();
  const cartes = Object.values(lireCollection().cartes);
  const maintenant = new Date();
  const stat = calculerStatistiques(stats.jours, new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate()));

  // La plus longue suite de victoires du jeu du jour (les jours se suivent dans l'ordre des dates, même avec des jours sautés)
  const dates = Object.keys(stats.jours).sort();
  let suite = 0;
  let meilleureSuite = 0;
  dates.forEach(date => {
    suite = stats.jours[date].gagne ? suite + 1 : 0;
    meilleureSuite = Math.max(meilleureSuite, suite);
  });

  // Les cartes par thème
  const parTheme = {};
  window.PERSONNAGES.forEach(p => {
    parTheme[p.univers] = parTheme[p.univers] || { possedees: 0, total: 0 };
    parTheme[p.univers].total++;
  });
  cartes.forEach(carte => {
    const p = trouverPersonnage(carte.id);
    if (p && parTheme[p.univers]) parTheme[p.univers].possedees++;
  });

  // L'anniversaire du jeu : même jour et même mois que le lancement, une autre année
  const lancement = dateDepuisTexte(window.DATE_LANCEMENT);
  const anniversaire = Boolean(contexte.finDePartie) && maintenant.getDate() === lancement.getDate()
    && maintenant.getMonth() === lancement.getMonth() && maintenant.getFullYear() > lancement.getFullYear();

  return {
    parties: dates.length + stats.totalBonus + Object.keys(stats.rattrapages).length,
    victoires: dates.filter(date => stats.jours[date].gagne).length,
    victoiresEn1: dates.filter(date => stats.jours[date].gagne && stats.jours[date].essais === 1).length,
    victoiresRapides: dates.filter(date => stats.jours[date].gagne && stats.jours[date].essais <= 3 && stats.jours[date].mode !== "facile").length,
    meilleureSerieDeVictoires: meilleureSuite,
    meilleureSerie: stat.meilleureSerie,
    cartes,
    legendaires: cartes.filter(carte => carte.rarete === "legendaire").length,
    parTheme,
    bonusDuJour: partiesBonusFaites(),
    totalBonus: stats.totalBonus,
    succes: stats.succes,
    anniversaire
  };
}

// ---------- Débloquer ----------

// Vérifie tous les succès et débloque ceux qui sont mérités (les notifie). À appeler quand quelque chose a pu changer :
// fin de partie (contexte.finDePartie), lancement d'une partie bonus, chargement de la page, réception des données du compte.
function verifierLesSucces(contexte) {
  if (partie.modeTest) return [];
  contexte = contexte || {};
  const stats = lireStats();
  const aujourdhui = texteDeLaDate(new Date());
  let changement = false;

  // Les repères de l'heure (pour « Jour et nuit ») : posés quand une partie se termine
  if (contexte.finDePartie) {
    const heure = new Date().getHours();
    if (heure < 7 && !stats.succes._matin) { stats.succes._matin = aujourdhui; changement = true; }
    if (heure >= 23 && !stats.succes._nuit) { stats.succes._nuit = aujourdhui; changement = true; }
    if (changement) ecrireStats(stats);
  }

  const donnees = rassemblerLesDonnees(contexte);
  const nouveaux = [];
  SUCCES.forEach(succes => {
    if (stats.succes[succes.id]) return;
    let merite = false;
    try {
      merite = Boolean(succes.condition(donnees));
    } catch (erreur) {
      merite = false;
    }
    if (merite) {
      stats.succes[succes.id] = aujourdhui;
      nouveaux.push(succes);
    }
  });

  if (nouveaux.length > 0 || changement) ecrireStats(stats);
  if (nouveaux.length > 0) {
    annoncerLesSucces(nouveaux);
    if (!document.getElementById("ecran-profil").hidden) afficherLesSucces();
    if (typeof synchroniserLesCartes === "function") synchroniserLesCartes();   // si le joueur est connecté, ils partent en ligne
  }
  return nouveaux;
}

// ---------- La notification « Succès débloqué » ----------

const fileDesNotifications = [];
let notificationEnCours = false;

// Montre les succès débloqués l'un après l'autre (au maximum 3 d'affilée : le reste est résumé en une ligne).
function annoncerLesSucces(liste) {
  liste.slice(0, 3).forEach(succes => fileDesNotifications.push({ marque: succes.marque, titre: "Succès débloqué", texte: succes.nom, classe: classeDuGroupe(succes) }));
  if (liste.length > 3) {
    fileDesNotifications.push({ marque: "+" + (liste.length - 3), titre: "Succès débloqués", texte: (liste.length - 3) + " autres dans ton profil", classe: "g-pas" });
  }
  montrerLaNotificationSuivante();
}

function classeDuGroupe(succes) {
  const groupe = GROUPES_DE_SUCCES.find(g => g.cle === succes.groupe);
  return (groupe ? groupe.classe : "g-pas") + (succes.theme ? " " + classeDuTheme(succes.theme) : "");
}

function montrerLaNotificationSuivante() {
  if (notificationEnCours || fileDesNotifications.length === 0) return;
  const suivante = fileDesNotifications.shift();
  notificationEnCours = true;

  const zone = document.getElementById("notification-succes");
  zone.innerHTML = "";
  const medaille = creerElement("span", "medaille debloque " + suivante.classe, suivante.marque);
  medaille.setAttribute("aria-hidden", "true");
  const textes = creerElement("span", "notification-textes");
  textes.appendChild(creerElement("small", "", suivante.titre));
  textes.appendChild(creerElement("strong", "", suivante.texte));
  zone.appendChild(medaille);
  zone.appendChild(textes);
  zone.hidden = false;
  zone.classList.remove("sortie");

  setTimeout(() => {
    zone.classList.add("sortie");
    setTimeout(() => {
      zone.hidden = true;
      notificationEnCours = false;
      montrerLaNotificationSuivante();
    }, animationsReduites() ? 0 : 350);
  }, 3800);
}

// ---------- L'affichage dans le profil ----------

function afficherLesSucces() {
  const stats = lireStats();
  const donnees = rassemblerLesDonnees({});
  const liste = document.getElementById("succes-liste");
  liste.innerHTML = "";

  const debloques = SUCCES.filter(succes => stats.succes[succes.id]).length;
  document.getElementById("succes-compteur").textContent = debloques + " sur " + SUCCES.length;
  document.getElementById("succes-barre").style.width = Math.round(100 * debloques / SUCCES.length) + "%";
  document.getElementById("succes-progres").setAttribute("aria-label", debloques + " succès sur " + SUCCES.length);

  GROUPES_DE_SUCCES.forEach(groupe => {
    const succesDuGroupe = SUCCES.filter(succes => succes.groupe === groupe.cle);
    if (succesDuGroupe.length === 0) return;
    liste.appendChild(creerElement("h3", "sous-titre", groupe.titre));
    const ul = creerElement("ul", "succes-groupe");
    succesDuGroupe.forEach(succes => {
      const date = stats.succes[succes.id];
      const ligne = creerElement("li", "succes-ligne" + (date ? " obtenu" : ""));
      const medaille = creerElement("span", "medaille " + (date ? "debloque " : "") + classeDuGroupe(succes), succes.marque);
      medaille.setAttribute("aria-hidden", "true");
      ligne.appendChild(medaille);

      const textes = creerElement("span", "succes-textes");
      textes.appendChild(creerElement("strong", "", succes.nom));
      textes.appendChild(creerElement("span", "succes-description", succes.description));
      let detail = "";
      if (date) {
        detail = "Obtenu le " + dateDepuisTexte(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      } else if (succes.progres) {
        const [fait, objectif] = succes.progres(donnees);
        detail = fait + " sur " + objectif;
      }
      if (detail) textes.appendChild(creerElement("span", "succes-detail", detail));
      ligne.appendChild(textes);
      ul.appendChild(ligne);
    });
    liste.appendChild(ul);
  });
}
