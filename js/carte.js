// L'affichage d'une carte à collectionner (aucune image officielle : tout est dessiné avec des couleurs,
// des cadres et des émojis). L'emplacement « carte-illustration » est prévu pour accueillir plus tard
// des dessins originaux à la place de l'icône.

// Petit outil : crée un élément avec une classe et, si on veut, un texte.
function creerElement(balise, classe, texte) {
  const element = document.createElement(balise);
  if (classe) element.className = classe;
  if (texte !== undefined) element.textContent = texte;
  return element;
}

// La « courte description » de la carte : la 1re phrase de la fiche (qui présente le personnage)
// et la dernière (qui donne ses signes les plus connus). Les phrases du milieu sont trop longues pour la carte.
function descriptionCourte(personnage) {
  const phrases = decouperEnPhrases(personnage.description);
  return phrases[0] + " " + phrases[phrases.length - 1];
}

// Fabrique une petite vignette de carte pour la bibliothèque : un bouton qu'on peut toucher pour voir la carte en grand.
// carte = les données de la carte gagnée, ou null si le joueur n'a pas encore cette carte (case « ? »).
function creerVignetteDom(carte, apresToucher) {
  // Case vide : on ne révèle pas de quel personnage il s'agit
  if (!carte) {
    const vide = creerElement("button", "vignette vide", "?");
    vide.type = "button";
    vide.disabled = true;
    vide.setAttribute("aria-label", "Carte pas encore découverte");
    return vide;
  }

  const p = trouverPersonnage(carte.id);
  const rarete = RARETES[carte.rarete];

  const bouton = creerElement("button", "vignette rarete-" + carte.rarete);
  bouton.type = "button";
  bouton.setAttribute("aria-label", p.nom + ", carte " + rarete.nom + ". Toucher pour la voir en grand.");

  const contenu = creerElement("span", "vignette-contenu fond-" + simplifier(p.univers));
  contenu.appendChild(creerElement("span", "vignette-icone", window.ICONES_ESPECES[p.espece] || "✨"));
  contenu.appendChild(creerElement("span", "vignette-nom", p.nom));
  contenu.appendChild(creerElement("span", "vignette-rarete", rarete.nom));
  bouton.appendChild(contenu);

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

  // ----- Le devant : un cadre (selon la rareté) autour du contenu (couleur selon l'univers) -----
  const avant = creerElement("div", "carte-face carte-avant rarete-" + carte.rarete);
  const contenu = creerElement("div", "carte-contenu fond-" + simplifier(p.univers));

  const entete = creerElement("div", "carte-entete");
  entete.appendChild(creerElement("p", "carte-rarete", rarete.nom));
  entete.appendChild(creerElement("p", "carte-nom", p.nom));
  contenu.appendChild(entete);

  // L'emplacement de l'illustration : pour l'instant, une grande icône selon l'espèce
  const illustration = creerElement("div", "carte-illustration");
  illustration.appendChild(creerElement("span", "carte-icone", window.ICONES_ESPECES[p.espece] || "✨"));
  contenu.appendChild(illustration);

  const badges = creerElement("div", "carte-badges");
  [p.univers, p.camp, p.espece].forEach(texte => badges.appendChild(creerElement("span", "carte-badge", texte)));
  contenu.appendChild(badges);

  const infos = creerElement("div", "carte-infos");
  infos.appendChild(creerElement("p", "", "Pouvoirs : " + p.pouvoirs.join(" · ")));
  infos.appendChild(creerElement("p", "", "Groupe : " + p.groupes.join(" · ")));
  infos.appendChild(creerElement("p", "", "1ʳᵉ apparition : " + p.annee + " · " + p.oeuvre));
  contenu.appendChild(infos);

  contenu.appendChild(creerElement("p", "carte-description", descriptionCourte(p)));

  const date = dateCourteEnFrancais(dateDepuisTexte(carte.date));
  const pied = creerElement("p", "carte-pied",
    "Héros du Jour n°" + carte.numero + " · " + date + " · " + texteNombreEssais(carte.essais));
  contenu.appendChild(pied);

  avant.appendChild(contenu);
  // Les cartes Légendaires ont en plus un effet brillant qui balaie la carte
  if (carte.rarete === "legendaire") avant.appendChild(creerElement("span", "carte-brillance"));
  carteElement.appendChild(avant);

  return scene;
}
