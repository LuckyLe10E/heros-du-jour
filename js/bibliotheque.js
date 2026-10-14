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

// Dessine la grille : une case par personnage (une vraie vignette si on a la carte, sinon une case « ? »).
function dessinerBibliotheque() {
  const collection = lireCollection();
  const total = window.PERSONNAGES.length;
  const possedees = Object.keys(collection.cartes).length;

  document.getElementById("collection-compteur").textContent = possedees + " / " + total + " cartes";
  document.getElementById("collection-test").hidden = !partie.modeTest;

  const grille = document.getElementById("collection-grille");
  grille.innerHTML = "";
  window.PERSONNAGES.forEach(p => {
    const ligne = document.createElement("li");
    ligne.appendChild(creerVignetteDom(collection.cartes[p.id] || null, ouvrirCarteEnGrand));
    grille.appendChild(ligne);
  });

  document.getElementById("collection-vide").hidden = possedees > 0;
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
