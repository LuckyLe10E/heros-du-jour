// L'écran « Ma collection » : l'album avec un emplacement par personnage (vide tant que la carte n'est pas gagnée).
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
  univers: "",       // "" = tous les thèmes, sinon un thème (« Marvel », « Films »…)
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

  document.getElementById("collection-nombre").textContent = possedees;
  document.getElementById("collection-sur").textContent = (possedees > 1 ? "cartes" : "carte") + " sur " + total;
  document.getElementById("collection-progres").setAttribute("aria-label", possedees + " sur " + total);
  document.getElementById("collection-progres-barre").style.width = (total > 0 ? Math.round(100 * possedees / total) : 0) + "%";
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
    ligne.appendChild(creerVignetteDom(c.carte, c.personnage.id, ouvrirCarteEnGrand));
    grille.appendChild(ligne);
  });

  // Les onglets de thèmes : celui du filtre actif est enfoncé
  document.querySelectorAll("#collection-univers button").forEach(bouton => {
    bouton.setAttribute("aria-pressed", String(bouton.dataset.univers === reglagesBibliotheque.univers));
  });

  document.getElementById("collection-vide").hidden = possedees > 0;
  document.getElementById("collection-aucune").hidden = cases.length > 0;
}

// Branche les deux listes de choix (tri, rareté) : à chaque changement, on redessine la grille.
function brancherLesReglagesDeLaBibliotheque() {
  const liaisons = [
    ["collection-tri", "tri"],
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

// Fabrique les onglets de thèmes (« Tous » puis un par thème du jeu) et la liste des raretés.
function preparerLesListesDeLaBibliotheque() {
  const onglets = document.getElementById("collection-univers");
  [""].concat(window.CRITERES.univers).forEach(nom => {
    const bouton = creerElement("button", nom === "" ? "tous" : classeDuTheme(nom), nom === "" ? "Tous" : nom);
    bouton.type = "button";
    bouton.dataset.univers = nom;
    bouton.addEventListener("click", () => {
      reglagesBibliotheque.univers = nom;
      dessinerBibliotheque();
      document.querySelector("#fenetre-collection .fenetre").scrollTop = 0;
    });
    onglets.appendChild(bouton);
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

// La carte actuellement ouverte en grand (pour le bouton « Partager la carte »).
let carteEnGrand = null;

// Affiche une carte en grand, par-dessus la bibliothèque.
function ouvrirCarteEnGrand(carte) {
  const zone = document.getElementById("carte-grand-zone");
  zone.innerHTML = "";
  zone.appendChild(creerCarteDom(carte, { retournee: true }));
  document.getElementById("carte-signaler").href = lienDeSignalement(trouverPersonnage(carte.id));
  carteEnGrand = carte;
  document.getElementById("carte-message").textContent = "";
  preparerLeBoutonDePartageDeCarte(document.getElementById("carte-partager"), carte);
  document.getElementById("fenetre-carte-grand").hidden = false;
  document.getElementById("carte-grand-fermer").focus({ preventScroll: true });
}

// Branche le bouton « Partager la carte » de la carte en grand.
function brancherLePartageDeLaCarteEnGrand() {
  document.getElementById("carte-partager").addEventListener("click", () => {
    if (carteEnGrand) partagerLaCarte(carteEnGrand, texte => { document.getElementById("carte-message").textContent = texte; });
  });
}

// Ferme la carte en grand et revient à la bibliothèque.
function fermerCarteEnGrand() {
  document.getElementById("fenetre-carte-grand").hidden = true;
  document.getElementById("collection-fermer").focus({ preventScroll: true });   // la grille reste où elle était
}
