// L'affichage d'une carte à collectionner (aucune image officielle : tout est dessiné avec des couleurs,
// des cadres et une silhouette). L'emplacement « carte-illustration » est prévu pour accueillir plus tard
// des dessins originaux à la place de la silhouette.

// Petit outil : crée un élément avec une classe et, si on veut, un texte.
function creerElement(balise, classe, texte) {
  const element = document.createElement(balise);
  if (classe) element.className = classe;
  if (texte !== undefined) element.textContent = texte;
  return element;
}

// Dessine la silhouette (définie une fois pour toutes dans index.html, sous le nom « silhouette »).
function creerSilhouette() {
  const espace = "http://www.w3.org/2000/svg";
  const dessin = document.createElementNS(espace, "svg");
  dessin.setAttribute("viewBox", "0 0 100 120");
  dessin.setAttribute("class", "silhouette");
  dessin.setAttribute("aria-hidden", "true");
  const reference = document.createElementNS(espace, "use");
  reference.setAttribute("href", "#silhouette");
  dessin.appendChild(reference);
  return dessin;
}

// Le numéro d'une carte dans l'album : sa place dans la liste des personnages, sur 3 chiffres (« N° 007 »).
function numeroDeCarte(id) {
  const position = window.PERSONNAGES.findIndex(p => p.id === id);
  return "N° " + String(position + 1).padStart(3, "0");
}

// La « courte description » de la carte : la 1re phrase de la fiche (qui présente le personnage)
// et la dernière (qui donne ses signes les plus connus). Les phrases du milieu sont trop longues pour la carte.
function descriptionCourte(personnage) {
  const phrases = decouperEnPhrases(personnage.description);
  return phrases[0] + " " + phrases[phrases.length - 1];
}

// Fabrique un emplacement de l'album : une carte rangée (un bouton qu'on peut toucher pour la voir en grand),
// ou, si le joueur ne l'a pas encore, un emplacement vide avec son numéro.
// carte = les données de la carte gagnée, ou null ; id = le personnage de cet emplacement.
function creerVignetteDom(carte, id, apresToucher) {
  // Emplacement vide : on voit le numéro, pas le nom (on ne révèle pas de quel personnage il s'agit)
  if (!carte) {
    const vide = creerElement("div", "emplacement");
    vide.setAttribute("role", "img");
    vide.setAttribute("aria-label", "Emplacement " + numeroDeCarte(id) + " : carte pas encore découverte");
    vide.appendChild(creerElement("span", "numero-carte", numeroDeCarte(id)));
    vide.appendChild(creerSilhouette());
    return vide;
  }

  const p = trouverPersonnage(carte.id);
  const rarete = RARETES[carte.rarete];

  const bouton = creerElement("button", "vignette rarete-" + carte.rarete + " univers-" + simplifier(p.univers));
  bouton.type = "button";
  bouton.setAttribute("aria-label", p.nom + ", carte " + rarete.nom + ". Toucher pour la voir en grand.");

  const corps = creerElement("span", "corps");
  corps.appendChild(creerElement("span", "numero-carte", numeroDeCarte(carte.id)));
  const art = creerElement("span", "art");
  art.appendChild(creerSilhouette());
  corps.appendChild(art);
  corps.appendChild(creerElement("strong", "vignette-nom", p.nom));
  bouton.appendChild(corps);
  bouton.appendChild(creerElement("span", "feuille"));

  bouton.addEventListener("click", () => apresToucher(carte));
  return bouton;
}

// Fabrique l'élément HTML d'une carte.
// carte = { id, rarete, essais, date, numero } ; options.retournee = true si la carte est déjà face visible
// (sinon elle commence face cachée, et il suffira d'ajouter la classe « retournee » pour la retourner).
function creerCarteDom(carte, options) {
  const p = trouverPersonnage(carte.id);
  const rarete = RARETES[carte.rarete];

  const scene = creerElement("div", "carte-scene");
  scene.setAttribute("role", "group");
  scene.setAttribute("aria-label", "Carte " + rarete.nom + " : " + p.nom);

  const carteElement = creerElement("div", "carte" + (options && options.retournee ? " retournee sans-animation" : ""));
  scene.appendChild(carteElement);

  // ----- Le dos de la carte (visible avant le retournement) -----
  const dos = creerElement("div", "carte-face carte-dos");
  dos.setAttribute("aria-hidden", "true");
  dos.appendChild(creerElement("span", "carte-dos-marque", "?"));
  dos.appendChild(creerElement("span", "carte-dos-titre", "Héros du Jour"));
  carteElement.appendChild(dos);

  // ----- Le devant : une feuille (selon la rareté) autour d'une fiche de papier (couleur d'univers pour le badge et l'illustration) -----
  const avant = creerElement("div", "carte-face carte-avant rarete-" + carte.rarete);
  const interieur = creerElement("div", "carte-interieur univers-" + simplifier(p.univers));

  const entete = creerElement("div", "carte-entete");
  entete.appendChild(creerElement("h3", "carte-nom", p.nom));
  entete.appendChild(creerElement("span", "carte-univers", p.univers));
  interieur.appendChild(entete);

  // La grande illustration : pour l'instant, une silhouette
  const illustration = creerElement("div", "carte-illustration");
  illustration.appendChild(creerSilhouette());
  illustration.appendChild(creerElement("span", "carte-tampon", rarete.nom.toUpperCase()));
  interieur.appendChild(illustration);

  interieur.appendChild(creerElement("p", "carte-sous-titre", p.oeuvre + ", " + p.annee));

  const fiche = creerElement("dl", "carte-fiche");
  [
    ["Camp", p.camp],
    ["Espèce", p.espece],
    ["Pouvoirs", p.pouvoirs.join(", ")],
    ["Groupe", p.groupes.join(", ")]
  ].forEach(([titre, valeur]) => {
    const ligne = creerElement("div");
    ligne.appendChild(creerElement("dt", "", titre));
    ligne.appendChild(creerElement("dd", "", valeur));
    fiche.appendChild(ligne);
  });
  interieur.appendChild(fiche);

  interieur.appendChild(creerElement("p", "carte-texte", descriptionCourte(p)));

  const date = dateDepuisTexte(carte.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });   // « 15 oct. 2026 »
  interieur.appendChild(creerElement("p", "carte-pied",
    "Héros du Jour n° " + carte.numero + ", gagnée le " + date + " en " + texteNombreEssais(carte.essais)));

  avant.appendChild(interieur);
  // Les cartes Légendaires ont en plus un effet brillant qui balaie la carte
  if (carte.rarete === "legendaire") avant.appendChild(creerElement("span", "carte-brillance"));
  carteElement.appendChild(avant);

  return scene;
}
