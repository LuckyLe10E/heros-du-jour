// Tout ce qui touche à l'écran du jeu.

// Les éléments de la page qu'on utilise souvent
const champSaisie = document.getElementById("saisie");
const listeSuggestions = document.getElementById("suggestions");
const listeEssais = document.getElementById("liste-essais");
const compteurEssais = document.getElementById("compteur-essais");

let suggestionsAffichees = [];   // les résultats de la recherche actuellement visibles
let suggestionChoisie = -1;      // la ligne mise en évidence (clavier), -1 = aucune

// Ferme la liste de suggestions.
function fermerSuggestions() {
  listeSuggestions.hidden = true;
  listeSuggestions.innerHTML = "";
  champSaisie.setAttribute("aria-expanded", "false");
  champSaisie.removeAttribute("aria-activedescendant");
  suggestionsAffichees = [];
  suggestionChoisie = -1;
}

// Met en évidence une ligne de la liste (pour la navigation au clavier).
function mettreEnEvidence(numero) {
  const lignes = listeSuggestions.querySelectorAll("li[role='option']");
  lignes.forEach((ligne, i) => ligne.setAttribute("aria-selected", i === numero ? "true" : "false"));
  suggestionChoisie = numero;
  if (numero >= 0 && lignes[numero]) {
    champSaisie.setAttribute("aria-activedescendant", lignes[numero].id);
    lignes[numero].scrollIntoView({ block: "nearest" });
  } else {
    champSaisie.removeAttribute("aria-activedescendant");
  }
}

// Dessine la liste de suggestions pour ce que le joueur vient de taper.
function afficherSuggestions() {
  const texteTape = champSaisie.value;
  if (simplifier(texteTape) === "") {
    fermerSuggestions();
    return;
  }

  suggestionsAffichees = chercherPersonnages(texteTape);
  listeSuggestions.innerHTML = "";
  suggestionChoisie = -1;

  if (suggestionsAffichees.length === 0) {
    // Si le nom tapé est celui d'un personnage déjà proposé (ou offert), on le dit au lieu de « introuvable »
    const saisie = simplifier(texteTape);
    const dejaJoue = window.PERSONNAGES.some(p => dejaPropose(p.id)
      && [p.nom, ...p.autresNoms].some(nom => noteDeCorrespondance(nom, saisie) !== -1));
    const ligne = document.createElement("li");
    ligne.className = "aucune-suggestion";
    ligne.textContent = dejaJoue ? "Déjà proposé : essaie un autre personnage" : "Aucun personnage trouvé";
    listeSuggestions.appendChild(ligne);
  }

  suggestionsAffichees.forEach((resultat, i) => {
    const p = resultat.personnage;
    const ligne = document.createElement("li");
    ligne.id = "suggestion-" + i;
    ligne.setAttribute("role", "option");
    ligne.setAttribute("aria-selected", "false");
    ligne.className = "suggestion";
    ligne.dataset.id = p.id;

    // Le nom du personnage
    const nom = document.createElement("span");
    nom.className = "suggestion-nom";
    nom.textContent = p.nom;
    ligne.appendChild(nom);

    // Si c'est un autre nom qui a correspondu, on le rappelle entre parenthèses
    if (resultat.nomTrouve !== p.nom) {
      const autre = document.createElement("span");
      autre.className = "suggestion-autre";
      autre.textContent = "(" + resultat.nomTrouve + ")";
      ligne.appendChild(autre);
    }

    // Le thème, en petit badge à droite
    const univers = document.createElement("span");
    univers.className = "suggestion-univers " + classeDuTheme(p.univers);
    univers.textContent = p.univers;
    ligne.appendChild(univers);

    // mousedown (et non click) : le choix est pris avant que la case perde le focus
    ligne.addEventListener("mousedown", evenement => {
      evenement.preventDefault();
      choisirPersonnage(p.id);
    });
    listeSuggestions.appendChild(ligne);
  });

  listeSuggestions.hidden = false;
  champSaisie.setAttribute("aria-expanded", "true");
  if (suggestionsAffichees.length > 0) mettreEnEvidence(0);
}

// Le joueur a choisi un personnage : on note l'essai et on remet la case à zéro.
// Si la partie vient de se terminer, on ouvre la fenêtre de fin.
function choisirPersonnage(id) {
  if (!ajouterEssai(id)) return;
  champSaisie.value = "";
  fermerSuggestions();
  const animer = !animationsReduites();
  afficherEssais(animer ? id : null);   // la nouvelle fiche dévoile ses cases une par une

  // Tout ce qui pourrait révéler le résultat attend la fin du retournement des cases
  setTimeout(() => {
    if (partie.statut !== "en cours") {
      ouvrirFenetreFin();
      if (partie.statut === "gagne") lancerConfettis(partie.carte ? partie.carte.rarete : "commune");
    }
    afficherBoutonCollection();   // le compteur de cartes a peut-être changé
    if (partie.statut !== "en cours") verifierLesSucces({ finDePartie: true });   // la partie vient de finir : des succès à débloquer ?
  }, animer ? DUREE_REVELATION : 0);
  if (partie.statut !== "en cours") synchroniserLesCartes();   // si le joueur est connecté, la carte et le résultat partent en ligne
}

// Écrit « 1 essai » ou « 4 essais ».
function texteNombreEssais(nombre) {
  return nombre + (nombre > 1 ? " essais" : " essai");
}

// Dessine l'encadré des indices (caché tant qu'il n'y en a aucun).
function afficherIndices() {
  const indices = indicesDevoiles();
  const liste = document.getElementById("liste-indices");
  liste.innerHTML = "";
  const angles = [-1.3, 0.9, -0.6, 1.2];   // chaque post-it est collé un peu de travers, pas pareil que son voisin
  indices.forEach((indice, i) => {
    const ligne = document.createElement("li");
    ligne.className = "postit";
    ligne.style.setProperty("--angle", angles[i % angles.length] + "deg");
    ligne.appendChild(creerElement("b", "", indice.titre));
    ligne.appendChild(document.createTextNode(indice.texte));
    liste.appendChild(ligne);
  });
  document.getElementById("indices-titre").textContent = "Indices (" + indices.length + ")";
  document.getElementById("indices").hidden = (indices.length === 0);
}

// ---------- L'en-tête et les parties bonus ----------

// Le bandeau du haut : le numéro du jour (partie du jour), « BONUS » (partie bonus) ou « LIBRE » (entraînement).
function afficherEnTete() {
  const etiquette = document.querySelector("#tampon-numero small");
  const nombre = document.getElementById("numero-du-jour");
  const tampon = document.getElementById("tampon-numero");
  const date = document.getElementById("date-du-jour");
  if (partie.mode === "jour") {
    etiquette.textContent = "NUMÉRO";
    nombre.textContent = partie.numero;
    tampon.setAttribute("aria-label", "Numéro " + partie.numero);
    date.textContent = dateDuJourEnFrancais();
  } else if (partie.mode === "rattrapage") {
    etiquette.textContent = "PASSÉ";
    nombre.textContent = partie.numero;
    tampon.setAttribute("aria-label", "Jour rattrapé, numéro " + partie.numero);
    date.textContent = "Jour rattrapé : " + dateDepuisTexte(partie.jourRattrape).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  } else if (partie.mode === "bonus") {
    etiquette.textContent = "BONUS";
    nombre.textContent = partie.numeroBonus;
    tampon.setAttribute("aria-label", "Partie bonus " + partie.numeroBonus);
    date.textContent = "Partie bonus " + partie.numeroBonus + " sur " + maxBonusAujourdhui();
  } else {
    etiquette.textContent = "LIBRE";
    nombre.textContent = "∞";
    tampon.setAttribute("aria-label", "Entraînement libre");
    date.textContent = "Entraînement libre";
  }
}

// Écrit « 3 restantes » ou « 1 restante ».
function texteBonusRestants(nombre) {
  return nombre + (nombre > 1 ? " restantes" : " restante");
}

// Le texte du bouton qui lance la partie suivante (une fois la partie bonus finie).
function libelleDeLaPartieSuivante() {
  if (partie.mode === "rattrapage") return "Rattraper un autre jour (" + texteJoursRestants(rattrapagesRestants()) + ")";
  return typeDeLaProchainePartie() === "bonus"
    ? "Nouvelle partie bonus (" + texteBonusRestants(partiesBonusRestantes()) + ")"
    : "Entraînement libre";
}

// Écrit « 3 restants » ou « 1 restant » (jours à rattraper).
function texteJoursRestants(nombre) {
  return nombre + (nombre > 1 ? " restants" : " restant");
}

// Les boutons sous le bandeau (parties bonus, jours passés) : ils changent selon la partie qu'on joue.
function afficherLeBonus() {
  const zone = document.getElementById("zone-bonus");
  if (partie.modeTest) {   // pas de parties bonus ni de jours passés en mode test
    zone.hidden = true;
    return;
  }
  zone.hidden = false;
  const etat = document.getElementById("bonus-etat");
  const lancer = document.getElementById("bonus-lancer");
  const retour = document.getElementById("bonus-retour");
  const texte = document.getElementById("bonus-lancer-texte");
  const compte = document.getElementById("bonus-lancer-compte");
  const passe = document.getElementById("rattrapage-lancer");
  const texteDuPasse = document.getElementById("rattrapage-lancer-texte");
  const compteDuPasse = document.getElementById("rattrapage-lancer-compte");
  const reste = partiesBonusRestantes();
  const joursRestants = rattrapagesRestants();

  // Le bouton « jour passé » : « Reprendre » si un rattrapage est commencé, sinon le nombre de jours qu'il reste à rattraper aujourd'hui
  const montrerLeBoutonDuJourPasse = (libelle) => {
    passe.hidden = false;
    if (lireRattrapage().enCours) {
      texteDuPasse.textContent = "Reprendre le jour passé";
      compteDuPasse.textContent = "";
    } else {
      texteDuPasse.textContent = libelle;
      compteDuPasse.textContent = texteJoursRestants(joursRestants);
    }
  };

  if (partie.mode === "jour") {
    etat.hidden = true;
    retour.hidden = true;
    lancer.hidden = false;
    const enCours = lireBonus().enCours;
    if (enCours) {
      texte.textContent = "Reprendre la partie bonus " + enCours.numeroBonus;
      compte.textContent = "";
    } else if (reste > 0) {
      texte.textContent = "Partie bonus";
      compte.textContent = texteBonusRestants(reste);
    } else {
      texte.textContent = "Entraînement libre";
      compte.textContent = "";
    }
    montrerLeBoutonDuJourPasse("Jour passé");
    return;
  }

  etat.hidden = false;
  retour.hidden = false;
  if (partie.mode === "bonus") {
    etat.textContent = "Partie bonus " + partie.numeroBonus + " sur " + maxBonusAujourdhui() + " : un personnage rien que pour toi, avec une carte à gagner.";
  } else if (partie.mode === "rattrapage") {
    etat.textContent = "Jour rattrapé : une carte à gagner, mais jamais Légendaire, et sans effet sur ta série de jours.";
  } else {
    etat.textContent = "Entraînement libre : pas de carte à gagner, et rien n'entre dans tes statistiques.";
  }
  lancer.hidden = (partie.mode === "rattrapage") || (partie.statut === "en cours");   // on termine d'abord la partie en cours
  if (typeDeLaProchainePartie() === "bonus") {
    texte.textContent = "Nouvelle partie bonus";
    compte.textContent = texteBonusRestants(reste);
  } else {
    texte.textContent = "Entraînement libre";
    compte.textContent = "";
  }
  // Un jour passé fini : on peut en rattraper un autre (s'il en reste aujourd'hui)
  passe.hidden = true;
  if (partie.mode === "rattrapage" && partie.statut !== "en cours" && joursRestants > 0) montrerLeBoutonDuJourPasse("Rattraper un autre jour");
}

// ---------- La fenêtre « Jour passé » ----------

// Dessine la liste des jours passés qu'on peut rattraper (les 30 derniers).
function dessinerLesJoursPasses() {
  const joursRestants = rattrapagesRestants();
  const jours = joursARattraper();
  document.getElementById("rattrapage-restants").textContent = joursRestants > 0
    ? "Aujourd'hui, tu peux encore rattraper " + joursRestants + (joursRestants > 1 ? " jours" : " jour") + "."
    : "Tu as rattrapé tous les jours possibles aujourd'hui. Reviens demain !";

  const liste = document.getElementById("rattrapage-liste");
  liste.innerHTML = "";
  const nonJoues = jours.filter(j => j.etat === "disponible" || j.etat === "en-cours");
  document.getElementById("rattrapage-aucun").hidden = jours.length > 0 && nonJoues.length > 0;
  document.getElementById("rattrapage-aucun").textContent = jours.length === 0
    ? "Il n'y a pas encore de jour passé à rejouer."
    : "Tu as déjà joué tous les jours des 30 derniers jours : bravo !";

  jours.forEach(jour => {
    const ligne = creerElement("li", "rattrapage-ligne");
    const date = dateDepuisTexte(jour.date);
    const titre = creerElement("span", "rattrapage-date");
    titre.appendChild(creerElement("strong", "", date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })));
    titre.appendChild(creerElement("small", "", "numéro " + jour.numero));
    ligne.appendChild(titre);

    if (jour.etat === "disponible" || jour.etat === "en-cours") {
      const bouton = creerElement("button", "bouton rattrapage-jouer", jour.etat === "en-cours" ? "Reprendre" : "Jouer");
      bouton.type = "button";
      const impossible = jour.etat === "disponible" && joursRestants <= 0;
      bouton.disabled = impossible;
      if (impossible) bouton.title = "Tu as déjà rattrapé tous les jours possibles aujourd'hui.";
      bouton.addEventListener("click", () => demarrerUnJourPasse(jour.date));
      ligne.appendChild(bouton);
    } else {
      const textes = { "joue-gagne": "Joué : gagné", "joue-perdu": "Joué : perdu", "rattrape-gagne": "Rattrapé : gagné", "rattrape-perdu": "Rattrapé : perdu" };
      ligne.appendChild(creerElement("span", "rattrapage-etat " + (jour.etat.endsWith("gagne") ? "gagne" : "perdu"), textes[jour.etat]));
    }
    liste.appendChild(ligne);
  });
}

function ouvrirRattrapage() {
  dessinerLesJoursPasses();
  document.getElementById("fenetre-fin").hidden = true;
  arreterCompteARebours();
  document.getElementById("fenetre-rattrapage").hidden = false;
  document.querySelector("#fenetre-rattrapage .fenetre").scrollTop = 0;
  document.getElementById("rattrapage-fermer").focus({ preventScroll: true });
}

function fermerRattrapage() {
  document.getElementById("fenetre-rattrapage").hidden = true;
}

// Le joueur choisit un jour passé : on lance (ou on reprend) ce rattrapage.
function demarrerUnJourPasse(date) {
  fermerRattrapage();
  if (!lancerUnRattrapage(date)) return;
  afficherLaPartie();
  verifierLesSucces({});
}

// Redessine tout l'écran de jeu après un changement de partie (bonus, entraînement, retour à la partie du jour).
function afficherLaPartie() {
  document.getElementById("fenetre-fin").hidden = true;
  arreterCompteARebours();
  champSaisie.value = "";
  fermerSuggestions();
  afficherEnTete();
  afficherEssais(null);   // redessine aussi le compteur, les indices et les boutons bonus
  window.scrollTo(0, 0);
}

function passerALaPartieSuivante() {
  if (partie.mode === "rattrapage") {   // après un jour passé : on choisit un autre jour
    ouvrirRattrapage();
    return;
  }
  lancerUnePartieSupplementaire();
  afficherLaPartie();
  verifierLesSucces({});   // une partie bonus de plus a été lancée
}

function retourALaPartieDuJour() {
  revenirALaPartieDuJour();
  afficherLaPartie();
}

// Ouvre la fenêtre de fin de partie : victoire ou défaite, avec le personnage et sa fiche.
function ouvrirFenetreFin() {
  const gagne = (partie.statut === "gagne");
  const p = partie.mystere;

  document.getElementById("fin-titre").textContent = gagne
    ? "Bravo ! Trouvé en " + texteNombreEssais(partie.essais.length)
    : "Raté !";
  document.getElementById("fin-intro").textContent = gagne
    ? (partie.mode === "jour" ? "Le héros du jour était :" : partie.mode === "rattrapage" ? "Le héros de ce jour-là était :" : "Le personnage était :")
    : "C'était…";
  document.getElementById("fin-nom").textContent = p.nom;
  document.getElementById("fin-oeuvre").textContent = p.univers + ", " + p.oeuvre + " (" + p.annee + ")";
  document.getElementById("fin-fiche").textContent = p.description;

  // Victoire : la carte gagnée remplace le texte (elle contient déjà le nom, l'œuvre et une courte fiche).
  // Défaite : pas de carte, on montre le texte avec la fiche complète.
  const avecCarte = gagne && partie.carte !== null;
  ["fin-intro", "fin-nom", "fin-oeuvre", "fin-fiche"].forEach(id => {
    document.getElementById(id).hidden = avecCarte;
  });
  if (avecCarte) afficherLaCarteGagnee();
  document.getElementById("fin-carte").hidden = !avecCarte;
  document.getElementById("fin-carte-message").hidden = !avecCarte;

  // Parties bonus et entraînement : pas de partage (chacun a un personnage différent), un bouton pour enchaîner
  const surLaPartieDuJour = (partie.mode === "jour");
  const resultatPartageable = (partie.mode === "jour" || partie.mode === "rattrapage");   // un jour passé se partage aussi, avec la mention « jour rattrapé »
  document.getElementById("fin-partager").hidden = !resultatPartageable;
  const boutonCarte = document.getElementById("fin-partager-carte");
  boutonCarte.hidden = !avecCarte;
  if (avecCarte) preparerLeBoutonDePartageDeCarte(boutonCarte, partie.carte);
  const suite = document.getElementById("fin-suite");
  suite.hidden = surLaPartieDuJour || (partie.mode === "rattrapage" && rattrapagesRestants() <= 0);
  suite.textContent = libelleDeLaPartieSuivante();

  document.getElementById("fin-signaler").href = lienDeSignalement(p);
  document.getElementById("fin-message").textContent = "";
  document.getElementById("fenetre-fin").className = "fenetre-fond " + (gagne ? "victoire" : "defaite");
  document.getElementById("fenetre-fin").hidden = false;
  document.getElementById("fin-fermer").focus();
  if (surLaPartieDuJour) {
    demarrerCompteARebours();
  } else {
    arreterCompteARebours();
    document.getElementById("fin-compte-a-rebours").textContent = partie.mode === "bonus"
      ? "Parties bonus lancées aujourd'hui : " + partiesBonusFaites() + " sur " + maxBonusAujourdhui()
      : partie.mode === "rattrapage"
        ? "Jours rattrapés aujourd'hui : " + rattrapagesFaits() + " sur " + MAX_RATTRAPAGES
        : "Entraînement libre : pas de carte à gagner.";
  }
}

// Montre la carte gagnée dans la fenêtre de fin. Si elle vient d'être gagnée, elle commence face cachée
// puis se retourne avec une animation (une seule fois : quand on rouvre la fenêtre, elle est déjà face visible).
function afficherLaCarteGagnee() {
  const zone = document.getElementById("fin-carte");
  zone.innerHTML = "";

  const animer = (partie.carteNouvelle || partie.carteAmelioree) && !partie.carteRevelee && !animationsReduites();

  const scene = creerCarteDom(partie.carte, { retournee: !animer });
  zone.appendChild(scene);
  if (animer) {
    // On laisse une demi-seconde pour voir le dos de la carte, puis elle se retourne
    setTimeout(() => scene.querySelector(".carte").classList.add("retournee"), 600);
  }
  partie.carteRevelee = true;

  // Le message sous la carte :
  //  - nouvelle carte, ou carte améliorée (rareté plus haute) ;
  //  - carte gagnée aujourd'hui qu'on revoit après un rechargement ;
  //  - sinon : le joueur la possédait déjà avec une rareté au moins aussi bonne, on la garde.
  const carte = partie.carte;
  const gagneeDansCettePartie = carte.numero === partie.numero && carte.essais === partie.essais.length
    && carte.date === dateDuJourEnTexte();
  let message = "Tu avais déjà cette carte en " + RARETES[carte.rarete].nom + " : elle est conservée.";
  if (partie.carteNouvelle) {
    message = "Nouvelle carte ajoutée à ta collection !";
  } else if (partie.carteAmelioree) {
    // Soit la rareté monte, soit (à rareté égale) la carte passe à une difficulté plus haute
    message = partie.ancienneRarete !== carte.rarete
      ? "Carte améliorée : " + RARETES[partie.ancienneRarete].nom + " → " + RARETES[carte.rarete].nom + " !"
      : "Carte améliorée : elle passe de la version " + window.DIFFICULTES[partie.ancienneDifficulte].nom + " à la version " + window.DIFFICULTES[difficulteDeLaCarte(carte)].nom + " !";
  } else if (gagneeDansCettePartie) {
    message = "Carte gagnée aujourd'hui, rangée dans ta collection.";
  }
  // Carte Légendaire déjà possédée, retrouvée dans la partie du jour : une partie bonus en plus est offerte pour aujourd'hui
  if (partie.mode === "jour" && carte.rarete === "legendaire" && partiesBonusEnPlus() > 0 && !partie.carteNouvelle && !partie.carteAmelioree) {
    message += " Cadeau : une partie bonus en plus aujourd'hui !";
  }
  document.getElementById("fin-carte-message").textContent = message;
}

// Ferme la fenêtre de fin de partie.
function fermerFenetreFin() {
  document.getElementById("fenetre-fin").hidden = true;
  arreterCompteARebours();
  document.getElementById("bouton-resultat").focus();
  reessayerLeRappel();   // le rappel de connexion attendait peut-être la fin de cette fenêtre
}

// ---------- Le compte à rebours jusqu'au prochain héros (minuit, heure du téléphone) ----------

let minuteurCompteARebours = null;

// Écrit le temps restant dans la fenêtre. À minuit pile, la page se recharge : un nouveau héros t'attend.
function afficherCompteARebours() {
  const reste = tempsAvantMinuit(new Date());
  if (reste <= 1000) {
    window.location.reload();
    return;
  }
  document.getElementById("fin-compte-a-rebours").textContent = "Prochain héros dans " + formaterDuree(reste);
}

// Lance le compte à rebours (une mise à jour par seconde) tant que la fenêtre est ouverte.
function demarrerCompteARebours() {
  arreterCompteARebours();
  afficherCompteARebours();
  minuteurCompteARebours = setInterval(afficherCompteARebours, 1000);
}

// Arrête le compte à rebours.
function arreterCompteARebours() {
  if (minuteurCompteARebours !== null) {
    clearInterval(minuteurCompteARebours);
    minuteurCompteARebours = null;
  }
}

// ---------- Le bouton Partager ----------

let minuteurMessage = null;

// Affiche un petit message sous les boutons (« Copié ! »…), qui disparaît tout seul après quelques secondes.
function afficherMessage(texte) {
  const zone = document.getElementById("fin-message");
  zone.textContent = texte;
  clearTimeout(minuteurMessage);
  minuteurMessage = setTimeout(() => { zone.textContent = ""; }, 3500);
}

// Copie un texte dans le presse-papiers. Renvoie true si ça a marché.
// Méthode moderne d'abord, puis une vieille méthode pour les navigateurs qui refusent la première.
async function copierDansLePressePapiers(texte) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texte);
      return true;
    }
  } catch (erreur) {
    // on essaie la méthode de secours ci-dessous
  }
  try {
    const zone = document.createElement("textarea");
    zone.value = texte;
    zone.setAttribute("readonly", "");
    zone.style.cssText = "position:fixed;top:-1000px;opacity:0;";
    document.body.appendChild(zone);
    zone.select();
    const reussi = document.execCommand("copy");
    document.body.removeChild(zone);
    return reussi;
  } catch (erreur) {
    return false;
  }
}

// Appui sur « Partager » : partage natif sur téléphone s'il existe, sinon copie dans le presse-papiers.
async function partagerLeResultat() {
  const texte = texteDePartage();
  const surTelephone = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  if (surTelephone && navigator.share) {
    try {
      await navigator.share({ text: texte });
      return;
    } catch (erreur) {
      if (erreur && erreur.name === "AbortError") return;   // le joueur a fermé la fenêtre de partage
      // autre problème : on copie à la place
    }
  }

  const copie = await copierDansLePressePapiers(texte);
  afficherMessage(copie ? "Copié ! Colle-le où tu veux." : "Impossible de copier : sélectionne et copie le texte à la main.");
}

// Le petit symbole de chaque case, pour les personnes qui ne distinguent pas bien les couleurs.
const SYMBOLES = { vert: "✓", orange: "~", rouge: "✗" };

// Ce que lit un lecteur d'écran pour chaque couleur.
const PHRASES_ETAT = { vert: "identique", orange: "en partie identique", rouge: "différent" };

// Raccourcit un nom de pouvoir ou de groupe pour qu'il tienne dans une petite case.
function nomCourt(nom) {
  return window.NOMS_COURTS[nom] || nom;
}

// Fabrique le texte à afficher dans une case, pour un critère donné.
function texteDeLaCase(critere, personnage, comparaison) {
  const valeur = personnage[critere.cle];
  if (critere.genre === "liste") return valeur.map(nomCourt).join("\n");
  if (critere.genre === "annee") {
    const fleche = comparaison.fleche === "haut" ? "\n↑" : comparaison.fleche === "bas" ? "\n↓" : "";
    return valeur + fleche;
  }
  return String(valeur).replace("/", "\n");   // « Hybride/Animal » s'écrit sur deux lignes
}

// Fabrique une case de couleur.
function creerCase(critere, personnage, comparaison) {
  const casePage = document.createElement("div");
  casePage.className = "case " + comparaison.etat;
  casePage.setAttribute("role", "group");

  let precision = PHRASES_ETAT[comparaison.etat];
  if (comparaison.fleche === "haut") precision += ", le mystère est plus récent";
  if (comparaison.fleche === "bas") precision += ", le mystère est plus ancien";
  const valeur = [].concat(personnage[critere.cle]).join(", ");
  casePage.setAttribute("aria-label", critere.titre + " : " + valeur + " — " + precision);

  const texte = document.createElement("span");
  texte.className = "case-texte";
  texte.textContent = texteDeLaCase(critere, personnage, comparaison);
  casePage.appendChild(texte);

  const symbole = document.createElement("span");
  symbole.className = "case-symbole";
  symbole.setAttribute("aria-hidden", "true");
  symbole.textContent = SYMBOLES[comparaison.etat];
  casePage.appendChild(symbole);

  return casePage;
}

// Dessine la ligne d'en-têtes des 7 critères (une seule fois).
function afficherEntetes() {
  const ligne = document.getElementById("entetes");
  CRITERES_JEU.forEach(critere => {
    const titre = document.createElement("div");
    titre.className = "entete-critere";
    titre.textContent = critere.titre;
    ligne.appendChild(titre);
  });
}

// Dessine les pastilles du compteur : une par essai possible (pleine = utilisé, contour = l'essai en cours).
function afficherPastilles(termine) {
  const zone = document.getElementById("pastilles");
  zone.innerHTML = "";
  zone.classList.toggle("beaucoup", essaisMax() > 10);   // 15 pastilles en Facile : on les rétrécit pour qu'elles tiennent
  for (let i = 0; i < essaisMax(); i++) {
    const pastille = document.createElement("i");
    if (i < partie.essais.length) pastille.className = "pris";
    else if (i === partie.essais.length && !termine) pastille.className = "actuel";
    zone.appendChild(pastille);
  }
}

// Le rythme du retournement des cases : une case toutes les 280 ms, chacune met 500 ms à se retourner.
const PAS_REVELATION = 280;
const DUREE_REVELATION = (CRITERES_JEU.length - 1) * PAS_REVELATION + 500 + 150;   // jusqu'à la fin, avec une petite marge

// Fabrique la fiche d'un essai : la photo, le nom, l'étiquette (« essai 3 » ou « essai offert ») et les 7 cases.
function creerFicheEssai(personnage, etiquette, offert, animer) {
  const comparaisons = comparerAvecMystere(personnage);

  const essai = document.createElement("li");
  essai.className = "essai" + (offert ? " essai-offert" : "");

  // La tête de la fiche : la photo (une silhouette pour l'instant), le nom et l'étiquette
  const tete = document.createElement("div");
  tete.className = "essai-tete";
  const photo = document.createElement("div");
  photo.className = "photo";
  photo.appendChild(creerSilhouette());
  const imageEssai = creerImageDuPersonnage(personnage.id);
  if (imageEssai) photo.appendChild(imageEssai);
  tete.appendChild(photo);
  tete.appendChild(creerElement("strong", "essai-nom", personnage.nom));
  tete.appendChild(creerElement("span", "essai-numero", etiquette));
  essai.appendChild(tete);

  const cases = document.createElement("div");
  cases.className = "cases";
  CRITERES_JEU.forEach((critere, i) => {
    const uneCase = creerCase(critere, personnage, comparaisons[i]);
    if (animer) {
      // Les cases se retournent l'une après l'autre, de gauche à droite
      uneCase.classList.add("revelee");
      uneCase.style.setProperty("--delai", (i * PAS_REVELATION) + "ms");
    }
    cases.appendChild(uneCase);
  });
  essai.appendChild(cases);
  return essai;
}

// Dessine la liste des essais : une fiche de 7 cases par essai, le dernier en haut.
// Tout en bas, l'essai offert (le jeu l'a joué pour aider à démarrer ; il ne compte pas dans les essais).
// idNouveau : l'essai qui vient d'être joué (ses cases se retournent une par une), ou null.
function afficherEssais(idNouveau) {
  listeEssais.innerHTML = "";
  partie.essais.slice().reverse().forEach(id => {
    listeEssais.appendChild(creerFicheEssai(trouverPersonnage(id), "essai " + (partie.essais.indexOf(id) + 1), false, id === idNouveau));
  });
  if (partie.offert) listeEssais.appendChild(creerFicheEssai(trouverPersonnage(partie.offert), "essai offert", true, false));   // (pas d'essai offert en Expert)

  // Pendant le retournement des cases, le reste (compteur, indices…) attend : on ne dévoile rien avant la fin
  if (idNouveau) {
    champSaisie.disabled = (partie.statut !== "en cours");
    setTimeout(afficherLEtatDeLaPartie, DUREE_REVELATION);
  } else {
    afficherLEtatDeLaPartie();
  }
}

// Met à jour le compteur, les pastilles, la case de saisie, le bouton « Revoir le résultat » et les indices.
function afficherLEtatDeLaPartie() {
  const termine = (partie.statut !== "en cours");
  if (partie.statut === "gagne") {
    compteurEssais.textContent = "Trouvé en " + texteNombreEssais(partie.essais.length) + " !";
  } else if (partie.statut === "perdu") {
    compteurEssais.textContent = "Partie terminée : les " + essaisMax() + " essais sont utilisés";
  } else {
    compteurEssais.textContent = "Essai " + (partie.essais.length + 1) + " sur " + essaisMax()
      + (partie.difficulte === "normal" ? "" : " (" + window.DIFFICULTES[partie.difficulte].nom + ")");
  }
  afficherPastilles(termine);
  champSaisie.disabled = termine;
  champSaisie.placeholder = termine ? "Partie terminée" : "Tape un nom de personnage…";
  document.getElementById("bouton-resultat").hidden = !termine;
  afficherIndices();
  afficherLeBonus();
  afficherLaDifficulte();
}

// Le choix de la difficulté (Facile / Normal / Expert) : visible seulement avant le premier essai de la partie.
function afficherLaDifficulte() {
  const zone = document.getElementById("zone-difficulte");
  const encoreChoisissable = partie.essais.length === 0 && partie.statut === "en cours";
  zone.hidden = !encoreChoisissable;
  if (!encoreChoisissable) return;
  document.querySelectorAll("#difficulte-boutons button").forEach(bouton => {
    bouton.setAttribute("aria-pressed", String(bouton.dataset.difficulte === partie.difficulte));
  });
  document.getElementById("difficulte-resume").textContent = window.DIFFICULTES[partie.difficulte].resume;
}

// Le joueur touche un bouton de difficulté.
function choisirLaDifficulte(difficulte) {
  if (!changerLaDifficulte(difficulte)) return;
  afficherEssais(null);   // redessine tout : l'essai offert apparaît ou disparaît, le compteur change
}

// Gère les touches du clavier dans la case de saisie.
function gererClavier(evenement) {
  if (evenement.key === "ArrowDown" && suggestionsAffichees.length > 0) {
    evenement.preventDefault();
    mettreEnEvidence((suggestionChoisie + 1) % suggestionsAffichees.length);
  } else if (evenement.key === "ArrowUp" && suggestionsAffichees.length > 0) {
    evenement.preventDefault();
    mettreEnEvidence((suggestionChoisie - 1 + suggestionsAffichees.length) % suggestionsAffichees.length);
  } else if (evenement.key === "Enter") {
    evenement.preventDefault();
    if (suggestionChoisie >= 0) choisirPersonnage(suggestionsAffichees[suggestionChoisie].personnage.id);
    else if (champSaisie.value.trim() !== "") secouerLaSaisie();   // rien de valable à choisir : la case secoue la tête
  } else if (evenement.key === "Escape") {
    fermerSuggestions();
  }
}

// ---------- La fenêtre « Comment jouer » ----------

// Assemble des mots en français : ["a", "b", "c"] devient « a, b et c ».
function listeEnFrancais(mots) {
  if (mots.length <= 1) return mots.join("");
  return mots.slice(0, -1).join(", ") + " et " + mots[mots.length - 1];
}

// Écrit une phrase qui explique les couleurs de la ligne d'exemple (elle suit toujours les vraies données).
// Exemple de résultat : « Ici : thème, camp et genre sont identiques (vert) ; espèce est différent (rouge)… »
function phraseExplicative(comparaisons) {
  const groupes = { vert: [], orange: [], rouge: [] };
  let fleche = null;
  CRITERES_JEU.forEach((critere, i) => {
    if (critere.genre === "annee" && comparaisons[i].fleche) {
      fleche = comparaisons[i].fleche;
    } else {
      groupes[comparaisons[i].etat].push(critere.titre.toLowerCase());
    }
  });

  const morceaux = [];
  const adjectifs = { vert: "identique", orange: "en partie identique", rouge: "différent" };
  ["vert", "orange", "rouge"].forEach(couleur => {
    const mots = groupes[couleur];
    if (mots.length === 0) return;
    const accord = mots.length > 1 ? "s" : "";
    morceaux.push(listeEnFrancais(mots) + (mots.length > 1 ? " sont " : " est ") + adjectifs[couleur] + accord + " (" + couleur + ")");
  });
  if (fleche) {
    morceaux.push("le mystère est apparu " + (fleche === "haut" ? "plus tard (↑)" : "plus tôt (↓)"));
  }
  return "Ici : " + morceaux.join(" ; ") + ".";
}

// Construit la ligne d'exemple de la fenêtre (en comparant deux vrais personnages) et son explication.
function preparerExempleDesRegles() {
  const essai = trouverPersonnage("superman") || window.PERSONNAGES[0];
  const cible = trouverPersonnage("batman") || window.PERSONNAGES[1];
  const comparaisons = comparerPersonnages(essai, cible);

  const intro = document.getElementById("regles-intro-exemple");
  intro.textContent = "Le mystère est ";
  const nomCible = document.createElement("strong");
  nomCible.textContent = cible.nom;
  const nomEssai = document.createElement("strong");
  nomEssai.textContent = essai.nom;
  intro.appendChild(nomCible);
  intro.appendChild(document.createTextNode(" et tu proposes "));
  intro.appendChild(nomEssai);
  intro.appendChild(document.createTextNode(" :"));

  const zone = document.getElementById("regles-exemple");
  const entetes = document.createElement("div");
  entetes.className = "entetes";
  CRITERES_JEU.forEach(critere => {
    const titre = document.createElement("div");
    titre.className = "entete-critere";
    titre.textContent = critere.titre;
    entetes.appendChild(titre);
  });
  const cases = document.createElement("div");
  cases.className = "cases";
  CRITERES_JEU.forEach((critere, i) => cases.appendChild(creerCase(critere, essai, comparaisons[i])));
  zone.appendChild(entetes);
  zone.appendChild(cases);

  document.getElementById("regles-explication").textContent = phraseExplicative(comparaisons);
}

// Ouvre la fenêtre « Comment jouer » (et retient que le joueur l'a vue).
function ouvrirRegles() {
  document.getElementById("fenetre-regles").hidden = false;
  document.getElementById("fenetre-regles").scrollTop = 0;
  document.getElementById("regles-fermer").focus();
  noterReglesVues();
}

// Ferme la fenêtre « Comment jouer ».
function fermerRegles() {
  document.getElementById("fenetre-regles").hidden = true;
  document.getElementById("bouton-aide").focus();
  reessayerLeRappel();   // à la première visite, le rappel de connexion attend la fin des règles
}

// ---------- Démarrage ----------

// Démarrage : on branche tous les boutons et la case de saisie.
function demarrerAffichage() {
  afficherEnTete();
  document.getElementById("bonus-lancer").addEventListener("click", passerALaPartieSuivante);
  document.getElementById("fin-suite").addEventListener("click", passerALaPartieSuivante);
  document.getElementById("bonus-retour").addEventListener("click", retourALaPartieDuJour);
  document.getElementById("rattrapage-lancer").addEventListener("click", ouvrirRattrapage);
  document.getElementById("rattrapage-fermer").addEventListener("click", fermerRattrapage);
  document.getElementById("fenetre-rattrapage").addEventListener("mousedown", evenement => {
    if (evenement.target.id === "fenetre-rattrapage") fermerRattrapage();
  });
  document.querySelectorAll("#difficulte-boutons button").forEach(bouton => {
    bouton.addEventListener("click", () => choisirLaDifficulte(bouton.dataset.difficulte));
  });
  document.getElementById("fin-fermer").addEventListener("click", fermerFenetreFin);
  document.getElementById("fin-partager").addEventListener("click", partagerLeResultat);
  document.getElementById("fin-partager-carte").addEventListener("click", () => partagerLaCarte(partie.carte, afficherMessage));
  document.getElementById("bouton-resultat").addEventListener("click", ouvrirFenetreFin);
  document.getElementById("bouton-aide").addEventListener("click", ouvrirRegles);
  document.getElementById("regles-fermer").addEventListener("click", fermerRegles);
  document.getElementById("regles-commencer").addEventListener("click", fermerRegles);
  document.getElementById("bouton-collection").addEventListener("click", ouvrirBibliotheque);
  document.getElementById("collection-fermer").addEventListener("click", fermerBibliotheque);
  document.getElementById("carte-grand-fermer").addEventListener("click", fermerCarteEnGrand);
  document.getElementById("fenetre-collection").addEventListener("mousedown", evenement => {
    if (evenement.target.id === "fenetre-collection") fermerBibliotheque();
  });
  document.getElementById("fenetre-carte-grand").addEventListener("mousedown", evenement => {
    if (evenement.target.id === "fenetre-carte-grand") fermerCarteEnGrand();
  });
  document.getElementById("fenetre-fin").addEventListener("mousedown", evenement => {
    if (evenement.target.id === "fenetre-fin") fermerFenetreFin();   // un clic à côté de la fenêtre la ferme
  });
  document.getElementById("fenetre-regles").addEventListener("mousedown", evenement => {
    if (evenement.target.id === "fenetre-regles") fermerRegles();
  });
  document.addEventListener("keydown", evenement => {
    if (evenement.key !== "Escape") return;
    // Échap ferme la fenêtre qui est tout au-dessus
    if (!document.getElementById("fenetre-rappel").hidden) fermerLeRappel();
    else if (!document.getElementById("fenetre-rattrapage").hidden) fermerRattrapage();
    else if (!document.getElementById("fenetre-carte-grand").hidden) fermerCarteEnGrand();
    else if (!document.getElementById("fenetre-collection").hidden) fermerBibliotheque();
    else if (!document.getElementById("ecran-profil").hidden) {
      if (!document.getElementById("profil-choix").hidden) fermerLeChoixDuFavori();
      else fermerProfil();
    }
    else if (!document.getElementById("fenetre-regles").hidden) fermerRegles();
    else if (!document.getElementById("fenetre-fin").hidden) fermerFenetreFin();
  });
  preparerExempleDesRegles();
  afficherEntetes();
  if (partie.modeTest) document.getElementById("mode-test").hidden = false;
  champSaisie.addEventListener("input", afficherSuggestions);
  champSaisie.addEventListener("keydown", gererClavier);
  champSaisie.addEventListener("focus", afficherSuggestions);
  champSaisie.addEventListener("blur", fermerSuggestions);
  // Toucher la liste (pour la faire défiler) ne doit pas fermer la liste
  listeSuggestions.addEventListener("mousedown", evenement => evenement.preventDefault());
  afficherEssais();
  afficherBoutonCollection();
  preparerLesListesDeLaBibliotheque();
  brancherLePartageDeLaCarteEnGrand();
  demarrerProfil();
  demarrerCompte();   // charge la connexion Google en arrière-plan (facultative)

  // À la toute première visite, les règles s'ouvrent toutes seules
  if (!reglesDejaVues()) ouvrirRegles();

  verifierLesSucces({});   // des succès déjà mérités sans avoir été débloqués (par exemple avant leur arrivée) ?
}

demarrerAffichage();
