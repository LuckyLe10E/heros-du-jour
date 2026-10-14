// L'écran « Ma collection » : la grille de toutes les cartes, avec des cases « ? » pour celles qui manquent.
// Toucher une carte l'affiche en grand.

// Le nombre de cartes que le joueur possède.
function nombreDeCartesPossedees() {
  return Object.keys(lireCollection().cartes).length;
}

// Met à jour le bouton « Ma collection » de la page d'accueil : il affiche le compteur.
function afficherBoutonCollection() {
  document.getElementById("bouton-collection-compteur").textContent =
    nombreDeCartesPossedees() + " / " + window.PERSONNAGES.length;
}

// Les choix du joueur pour trier et filtrer la grille (on s'en souvient tant que la page est ouverte).
const reglagesBibliotheque = {
  tri: "defaut",     // "defaut" (ordre de la liste), "rarete" (les plus rares d'abord) ou "date" (les plus récentes d'abord)
  univers: "",       // "" = tous, sinon « Marvel », « DC », « Manga » ou « Indé »
  rarete: ""         // "" = toutes, sinon « legendaire », « rare » ou « commune »
};

// Prépare la liste des cases à afficher : { personnage, carte } où carte vaut null si le joueur ne l'a pas encore.
// On applique d'abord les filtres, puis le tri. Les cartes qu'on possède passent avant les cases « ? » quand on trie.
function listerLesCases(collection) {
  let cases = window.PERSONNAGES.map((personnage, position) => ({
    personnage,
    position,
    carte: collection.cartes[personnage.id] || null
  }));

  if (reglagesBibliotheque.univers) {
    cases = cases.filter(c => c.personnage.univers === reglagesBibliotheque.univers);
  }
  // Filtrer par rareté ne garde que les cartes possédées de cette rareté (une case « ? » n'a pas de rareté)
  if (reglagesBibliotheque.rarete) {
    cases = cases.filter(c => c.carte && c.carte.rarete === reglagesBibliotheque.rarete);
  }

  if (reglagesBibliotheque.tri !== "defaut") {
    cases.sort((a, b) => {
      if (!a.carte || !b.carte) {
        if (a.carte) return -1;                       // les cartes possédées d'abord
        if (b.carte) return 1;
        return a.position - b.position;               // les cases « ? » gardent l'ordre de la liste
      }
      if (reglagesBibliotheque.tri === "rarete") {
        const difference = RARETES[b.carte.rarete].ordre - RARETES[a.carte.rarete].ordre;   // plus rare = plus haut
        if (difference !== 0) return difference;
      }
      // À égalité (ou tri par date) : la plus récente d'abord, puis le plus grand numéro de jour, puis l'ordre de la liste
      if (a.carte.date !== b.carte.date) return a.carte.date < b.carte.date ? 1 : -1;
      if (a.carte.numero !== b.carte.numero) return b.carte.numero - a.carte.numero;
      return a.position - b.position;
    });
  }
  return cases;
}

// Dessine la grille : une case par personnage (une vraie vignette si on a la carte, sinon une case « ? »),
// en tenant compte du tri et des filtres choisis.
function dessinerBibliotheque() {
  const collection = lireCollection();
  const total = window.PERSONNAGES.length;
  const possedees = Object.keys(collection.cartes).length;
  const cases = listerLesCases(collection);

  document.getElementById("collection-compteur").textContent = possedees + " / " + total + " cartes";
  document.getElementById("collection-test").hidden = !partie.modeTest;

  // Quand un filtre est actif, on dit combien de cartes correspondent
  const filtreActif = Boolean(reglagesBibliotheque.univers || reglagesBibliotheque.rarete);
  const zoneFiltre = document.getElementById("collection-filtre-resultat");
  zoneFiltre.hidden = !filtreActif;
  if (filtreActif) {
    const cartesAffichees = cases.filter(c => c.carte).length;
    zoneFiltre.textContent = cartesAffichees + (cartesAffichees > 1 ? " cartes possédées" : " carte possédée")
      + " sur " + cases.length + " affichée" + (cases.length > 1 ? "s" : "");
  }

  const grille = document.getElementById("collection-grille");
  grille.innerHTML = "";
  cases.forEach(c => {
    const ligne = document.createElement("li");
    ligne.appendChild(creerVignetteDom(c.carte, ouvrirCarteEnGrand));
    grille.appendChild(ligne);
  });

  document.getElementById("collection-vide").hidden = possedees > 0;
  document.getElementById("collection-aucune").hidden = cases.length > 0;
}

// Branche les trois listes de choix (tri, univers, rareté) : à chaque changement, on redessine la grille.
function brancherLesReglagesDeLaBibliotheque() {
  const liaisons = [
    ["collection-tri", "tri"],
    ["collection-univers", "univers"],
    ["collection-rarete", "rarete"]
  ];
  liaisons.forEach(([idElement, cle]) => {
    const liste = document.getElementById(idElement);
    liste.addEventListener("change", () => {
      reglagesBibliotheque[cle] = liste.value;
      dessinerBibliotheque();
      document.querySelector("#fenetre-collection .fenetre").scrollTop = 0;
    });
  });
}

// Remplit la liste des univers et des raretés à partir des listes fixes du jeu.
function preparerLesListesDeLaBibliotheque() {
  const univers = document.getElementById("collection-univers");
  window.CRITERES.univers.forEach(nom => {
    const option = document.createElement("option");
    option.value = nom;
    option.textContent = nom;
    univers.appendChild(option);
  });
  const raretes = document.getElementById("collection-rarete");
  Object.keys(RARETES).forEach(cle => {
    const option = document.createElement("option");
    option.value = cle;
    option.textContent = RARETES[cle].nom;
    raretes.appendChild(option);
  });
  brancherLesReglagesDeLaBibliotheque();
}

// Ouvre l'écran « Ma collection ».
function ouvrirBibliotheque() {
  dessinerBibliotheque();
  document.getElementById("fenetre-collection").hidden = false;
  document.querySelector("#fenetre-collection .fenetre").scrollTop = 0;       // on commence en haut de la grille
  document.getElementById("collection-fermer").focus({ preventScroll: true }); // sans faire défiler jusqu'au bouton
}

// Ferme l'écran « Ma collection ».
function fermerBibliotheque() {
  document.getElementById("fenetre-collection").hidden = true;
  document.getElementById("bouton-collection").focus();
}

// ---------- Sauvegarder et restaurer ses cartes ----------

// Ouvre la fenêtre « Sauvegarder mes cartes ».
function ouvrirSauvegarde() {
  document.getElementById("sauvegarde-code").value = "";
  document.getElementById("sauvegarde-restaurer-texte").value = "";
  document.getElementById("sauvegarde-message").textContent = "";
  document.getElementById("sauvegarde-copier").hidden = true;
  document.getElementById("sauvegarde-test").hidden = !partie.modeTest;
  document.getElementById("fenetre-sauvegarde").hidden = false;
  document.querySelector("#fenetre-sauvegarde .fenetre").scrollTop = 0;
  document.getElementById("sauvegarde-fermer").focus({ preventScroll: true });
}

// Ferme la fenêtre de sauvegarde et revient à la bibliothèque.
function fermerSauvegarde() {
  document.getElementById("fenetre-sauvegarde").hidden = true;
  document.getElementById("collection-sauvegarde").focus({ preventScroll: true });
}

// Écrit un petit message dans la fenêtre de sauvegarde ; « bon » = vrai pour un succès, faux pour un souci.
function afficherMessageSauvegarde(texte, bon) {
  const zone = document.getElementById("sauvegarde-message");
  zone.textContent = texte;
  zone.className = "sauvegarde-message " + (bon ? "bon" : "souci");
}

// Appui sur « Créer mon code » : on fabrique le code et on l'affiche.
function creerEtAfficherLeCode() {
  const code = creerCodeDeSauvegarde();
  const zone = document.getElementById("sauvegarde-code");
  if (code === null) {
    zone.value = "";
    document.getElementById("sauvegarde-copier").hidden = true;
    afficherMessageSauvegarde("Tu n'as pas encore de carte à sauvegarder.", false);
    return;
  }
  zone.value = code;
  document.getElementById("sauvegarde-copier").hidden = false;
  const nombre = nombreDeCartesPossedees();
  afficherMessageSauvegarde("Code créé pour " + nombre + (nombre > 1 ? " cartes" : " carte")
    + ". Copie-le et garde-le précieusement.", true);
  zone.focus();
  zone.select();
}

// Appui sur « Copier le code ».
async function copierLeCode() {
  const code = document.getElementById("sauvegarde-code").value;
  const copie = await copierDansLePressePapiers(code);
  afficherMessageSauvegarde(copie ? "Code copié ! Colle-le dans un message ou une note." : "Impossible de copier : sélectionne le texte et copie-le à la main.", copie);
}

// Appui sur « Restaurer mes cartes ».
function restaurerLesCartes() {
  const resultat = restaurerDepuisUnCode(document.getElementById("sauvegarde-restaurer-texte").value);
  afficherMessageSauvegarde(resultat.message, resultat.ok);
  if (resultat.ok) {
    document.getElementById("sauvegarde-restaurer-texte").value = "";
    dessinerBibliotheque();          // la grille derrière se met à jour
    afficherBoutonCollection();      // et le compteur du bouton aussi
  }
}

// Affiche une carte en grand, par-dessus la bibliothèque.
function ouvrirCarteEnGrand(carte) {
  const zone = document.getElementById("carte-grand-zone");
  zone.innerHTML = "";
  zone.appendChild(creerCarteDom(carte, { retournee: true }));
  document.getElementById("fenetre-carte-grand").hidden = false;
  document.getElementById("carte-grand-fermer").focus({ preventScroll: true });
}

// Ferme la carte en grand et revient à la bibliothèque.
function fermerCarteEnGrand() {
  document.getElementById("fenetre-carte-grand").hidden = true;
  document.getElementById("collection-fermer").focus({ preventScroll: true });   // la grille reste où elle était
}
