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
    const ligne = document.createElement("li");
    ligne.className = "aucune-suggestion";
    ligne.textContent = "Aucun personnage trouvé";
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

    // L'univers, en petit badge à droite
    const univers = document.createElement("span");
    univers.className = "suggestion-univers univers-" + simplifier(p.univers);
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
  afficherEssais();
  if (partie.statut !== "en cours") ouvrirFenetreFin();
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
  indices.forEach(indice => {
    const ligne = document.createElement("li");
    const titre = document.createElement("strong");
    titre.textContent = indice.titre + " : ";
    ligne.appendChild(titre);
    ligne.appendChild(document.createTextNode(indice.texte));
    liste.appendChild(ligne);
  });
  document.getElementById("indices-titre").textContent = "Indices (" + indices.length + ")";
  document.getElementById("indices").hidden = (indices.length === 0);
}

// Ouvre la fenêtre de fin de partie : victoire ou défaite, avec le personnage et sa fiche.
function ouvrirFenetreFin() {
  const gagne = (partie.statut === "gagne");
  const p = partie.mystere;

  document.getElementById("fin-titre").textContent = gagne
    ? "Bravo ! Trouvé en " + texteNombreEssais(partie.essais.length)
    : "Raté !";
  document.getElementById("fin-intro").textContent = gagne ? "Le héros du jour était :" : "C'était…";
  document.getElementById("fin-nom").textContent = p.nom;
  document.getElementById("fin-oeuvre").textContent = p.univers + " · " + p.oeuvre + " (" + p.annee + ")";
  document.getElementById("fin-fiche").textContent = p.description;

  document.getElementById("fin-message").textContent = "";
  document.getElementById("fenetre-fin").className = "fenetre-fond " + (gagne ? "victoire" : "defaite");
  document.getElementById("fenetre-fin").hidden = false;
  document.getElementById("fin-fermer").focus();
  demarrerCompteARebours();
}

// Ferme la fenêtre de fin de partie.
function fermerFenetreFin() {
  document.getElementById("fenetre-fin").hidden = true;
  arreterCompteARebours();
  document.getElementById("bouton-resultat").focus();
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
    const fleche = comparaison.fleche === "haut" ? "\n⬆️" : comparaison.fleche === "bas" ? "\n⬇️" : "";
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

// Dessine la liste des essais déjà faits : une ligne de 7 cases par essai, le dernier en haut.
function afficherEssais() {
  listeEssais.innerHTML = "";
  partie.essais.slice().reverse().forEach(id => {
    const personnage = trouverPersonnage(id);
    const comparaisons = comparerAvecMystere(personnage);

    const essai = document.createElement("li");
    essai.className = "essai";

    const nom = document.createElement("p");
    nom.className = "essai-nom";
    nom.textContent = personnage.nom;
    essai.appendChild(nom);

    const cases = document.createElement("div");
    cases.className = "cases";
    CRITERES_JEU.forEach((critere, i) => cases.appendChild(creerCase(critere, personnage, comparaisons[i])));
    essai.appendChild(cases);

    listeEssais.appendChild(essai);
  });

  // Le compteur, la case de saisie et le bouton « Revoir le résultat » selon l'état de la partie
  const termine = (partie.statut !== "en cours");
  if (partie.statut === "gagne") {
    compteurEssais.textContent = "Trouvé en " + texteNombreEssais(partie.essais.length) + " !";
  } else if (partie.statut === "perdu") {
    compteurEssais.textContent = "Partie terminée : les " + MAX_ESSAIS + " essais sont utilisés";
  } else {
    compteurEssais.textContent = "Essai " + (partie.essais.length + 1) + " / " + MAX_ESSAIS;
  }
  champSaisie.disabled = termine;
  champSaisie.placeholder = termine ? "Partie terminée" : "Tape un nom de personnage…";
  document.getElementById("bouton-resultat").hidden = !termine;
  afficherIndices();
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
// Exemple de résultat : « Ici : univers, camp et genre sont identiques (vert) ; espèce est différent (rouge)… »
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
    morceaux.push("le mystère est apparu " + (fleche === "haut" ? "plus tard (⬆️)" : "plus tôt (⬇️)"));
  }
  return "Ici : " + morceaux.join(" ; ") + ".";
}

// Construit la ligne d'exemple de la fenêtre (en comparant deux vrais personnages) et son explication.
function preparerExempleDesRegles() {
  const essai = trouverPersonnage("superman") || window.PERSONNAGES[0];
  const cible = trouverPersonnage("batman") || window.PERSONNAGES[1];
  const comparaisons = comparerPersonnages(essai, cible);

  const intro = document.getElementById("regles-intro-exemple");
  intro.textContent = "Exemple : le mystère est ";
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
  document.getElementById("regles-fermer").focus();
  noterReglesVues();
}

// Ferme la fenêtre « Comment jouer ».
function fermerRegles() {
  document.getElementById("fenetre-regles").hidden = true;
  document.getElementById("bouton-aide").focus();
}

// ---------- Démarrage ----------

// Démarrage : on branche tous les boutons et la case de saisie.
function demarrerAffichage() {
  document.getElementById("numero-du-jour").textContent = "n°" + partie.numero;
  document.getElementById("date-du-jour").textContent = dateDuJourEnFrancais();
  document.getElementById("fin-fermer").addEventListener("click", fermerFenetreFin);
  document.getElementById("fin-partager").addEventListener("click", partagerLeResultat);
  document.getElementById("bouton-resultat").addEventListener("click", ouvrirFenetreFin);
  document.getElementById("bouton-aide").addEventListener("click", ouvrirRegles);
  document.getElementById("regles-fermer").addEventListener("click", fermerRegles);
  document.getElementById("fenetre-fin").addEventListener("mousedown", evenement => {
    if (evenement.target.id === "fenetre-fin") fermerFenetreFin();   // un clic à côté de la fenêtre la ferme
  });
  document.getElementById("fenetre-regles").addEventListener("mousedown", evenement => {
    if (evenement.target.id === "fenetre-regles") fermerRegles();
  });
  document.addEventListener("keydown", evenement => {
    if (evenement.key !== "Escape") return;
    if (!document.getElementById("fenetre-regles").hidden) fermerRegles();
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

  // À la toute première visite, les règles s'ouvrent toutes seules
  if (!reglesDejaVues()) ouvrirRegles();
}

demarrerAffichage();
