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
function choisirPersonnage(id) {
  if (!ajouterEssai(id)) return;
  champSaisie.value = "";
  fermerSuggestions();
  afficherEssais();
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
  compteurEssais.textContent = partie.essais.length === 0
    ? "Aucun essai pour l'instant"
    : "Essais : " + partie.essais.length;
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

// Démarrage : on branche la case de saisie.
function demarrerAffichage() {
  document.getElementById("date-du-jour").textContent = dateDuJourEnFrancais();
  afficherEntetes();
  if (partie.modeTest) document.getElementById("mode-test").hidden = false;
  champSaisie.addEventListener("input", afficherSuggestions);
  champSaisie.addEventListener("keydown", gererClavier);
  champSaisie.addEventListener("focus", afficherSuggestions);
  champSaisie.addEventListener("blur", fermerSuggestions);
  // Toucher la liste (pour la faire défiler) ne doit pas fermer la liste
  listeSuggestions.addEventListener("mousedown", evenement => evenement.preventDefault());
  afficherEssais();
}

demarrerAffichage();
