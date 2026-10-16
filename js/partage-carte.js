// Partager une carte en image. L'image est fabriquée dans le téléphone du joueur (un « canevas » : une feuille de dessin
// du navigateur) : rien n'est envoyé à un service extérieur. Elle reprend la mise en page de la vraie carte (js/carte.js).
//
// RÈGLE ANTI-SPOIL (voulue par Luca) : la carte du personnage du jour ne se partage qu'à partir du lendemain,
// car son nom donnerait la réponse aux amis qui n'ont pas encore joué. Toutes les autres cartes se partagent tout de suite.
//
// Quand les cartes auront de vraies images de personnages : ajouter ici le dessin de l'image dans la zone de l'illustration
// (voir « zone de l'illustration » plus bas) ; le reste ne change pas.

const LARGEUR_IMAGE = 1080;
const HAUTEUR_IMAGE = 1350;

// Le papier et l'encre des cartes partagées sont toujours ceux du mode clair : l'image est la même quel que soit le mode du joueur.
const PAPIER = "#fdfdfb";
const ENCRE = "#1b2a2b";
const ENCRE_DOUCE = "#51625f";
const COULEURS_TAMPON = { legendaire: "#c4352c", rare: "#2f5dba", commune: "#6b5236" };

// Vrai si cette carte peut être partagée maintenant (voir la règle anti-spoil ci-dessus).
function peutPartagerLaCarte(carte) {
  return carte.id !== MYSTERE_DU_JOUR.id;
}

// Lit une couleur définie dans base.css (par exemple « --u-marvel », « --or-2 »).
function couleurDuSite(nom, secours) {
  const valeur = getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
  return valeur || secours;
}

// Mélange deux couleurs « #rrggbb » : ratio = la part de la première (0 à 1).
function melangerLesCouleurs(a, b, ratio) {
  const lire = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const x = lire(a);
  const y = lire(b);
  return "rgb(" + x.map((v, i) => Math.round(v * ratio + y[i] * (1 - ratio))).join(",") + ")";
}

// Découpe un texte en lignes qui tiennent dans une largeur (le canevas ne retourne pas à la ligne tout seul).
function decouperEnLignes(g, texte, largeurMax) {
  // On peut couper entre deux mots, et aussi après une barre oblique (« Psychique/Télépathie » est trop long pour une colonne)
  const morceaux = [];
  texte.split(" ").forEach(mot => {
    const parties = mot.split("/");
    parties.forEach((partie, i) => {
      morceaux.push({ texte: partie + (i < parties.length - 1 ? "/" : ""), collePrecedent: i > 0 });
    });
  });
  const lignes = [];
  let courante = "";
  morceaux.forEach(morceau => {
    const essai = courante ? courante + (morceau.collePrecedent ? "" : " ") + morceau.texte : morceau.texte;
    if (courante && g.measureText(essai).width > largeurMax) {
      lignes.push(courante);
      courante = morceau.texte;
    } else {
      courante = essai;
    }
  });
  if (courante) lignes.push(courante);
  return lignes;
}

// Les trois dégradés des cadres (or, argent, bronze), repris des couleurs du site.
function degradeDuCadre(g, rarete, x, y, l, h) {
  const d = g.createLinearGradient(x, y, x + l, y + h);
  const c = nom => couleurDuSite(nom, "#999999");
  if (rarete === "legendaire") {
    [[0, "--or-2"], [0.35, "--or-3"], [0.55, "--or-2"], [0.8, "--or-1"], [1, "--or-2"]].forEach(([pos, nom]) => d.addColorStop(pos, c(nom)));
  } else if (rarete === "rare") {
    [[0, "--argent-2"], [0.35, "--argent-3"], [0.6, "--argent-2"], [1, "--argent-1"]].forEach(([pos, nom]) => d.addColorStop(pos, c(nom)));
  } else {
    [[0, "--bronze-2"], [0.4, "--bronze-3"], [1, "--bronze-1"]].forEach(([pos, nom]) => d.addColorStop(pos, c(nom)));
  }
  return d;
}

function rectangleArrondi(g, x, y, l, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + l, y, x + l, y + h, r);
  g.arcTo(x + l, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + l, y, r);
  g.closePath();
}

// Règle l'état d'un bouton « Partager la carte » : actif, ou grisé pour la carte du personnage du jour (partage dès demain).
function preparerLeBoutonDePartageDeCarte(bouton, carte) {
  const possible = peutPartagerLaCarte(carte);
  bouton.disabled = !possible;
  bouton.textContent = possible ? "Partager la carte" : "Partage de cette carte dès demain";
  bouton.title = possible ? "" : "La carte du personnage du jour se partage à partir de demain, pour ne pas donner la réponse à tes amis.";
}

// Charge une image pour le canevas. Renvoie l'image, ou null si elle est introuvable ou trop longue à charger.
function chargerUneImage(adresse) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = adresse;
    setTimeout(() => resolve(null), 8000);
  });
}

// Dessine une image pour qu'elle REMPLISSE une zone (elle est recadrée, jamais déformée). cadrage = « 50% 20% » : la partie gardée.
function dessinerEnRemplissant(g, image, x, y, l, h, cadrage) {
  const [px, py] = (cadrage || "50% 20%").split(" ").map(valeur => parseFloat(valeur) / 100);
  const echelle = Math.max(l / image.width, h / image.height);
  const largeur = image.width * echelle;
  const hauteur = image.height * echelle;
  g.drawImage(image, x - (largeur - l) * (Number.isNaN(px) ? 0.5 : px), y - (hauteur - h) * (Number.isNaN(py) ? 0.2 : py), largeur, hauteur);
}

// Fabrique l'image d'une carte. Renvoie le canevas (le dessin terminé).
async function fabriquerLeCanevasDeLaCarte(carte) {
  const p = trouverPersonnage(carte.id);
  const rarete = RARETES[carte.rarete];

  // La police du jeu doit être chargée avant de dessiner (sinon le canevas utilise une police de secours)
  try {
    await Promise.all(["800 40px Jost", "700 40px Jost", "500 40px Jost", "400 40px Jost"].map(police => document.fonts.load(police)));
  } catch (erreur) {
    // pas grave : on dessine avec une police de secours
  }
  const police = "Jost, system-ui, sans-serif";

  // L'image du personnage, s'il en a une (sinon on dessine la silhouette)
  const infoImage = imageDuPersonnage(carte.id);
  const imagePerso = infoImage ? await chargerUneImage(infoImage.fichier) : null;

  const canevas = document.createElement("canvas");
  canevas.width = LARGEUR_IMAGE;
  canevas.height = HAUTEUR_IMAGE;
  const g = canevas.getContext("2d");

  // Le fond : la table bleu nuit du jeu
  const fond = g.createLinearGradient(0, 0, LARGEUR_IMAGE, HAUTEUR_IMAGE);
  fond.addColorStop(0, "#35568a");
  fond.addColorStop(1, "#1d3560");
  g.fillStyle = fond;
  g.fillRect(0, 0, LARGEUR_IMAGE, HAUTEUR_IMAGE);

  // La carte : 800 x 1120 (même proportion 5/7 que la vraie). « u » = 1/22,5 de sa largeur, comme dans cartes.css.
  const L = 800;
  const H = 1120;
  const X = (LARGEUR_IMAGE - L) / 2;
  const Y = 64;
  const u = L / 22.5;

  // Le cadre (feuille d'or, d'argent ou de bronze) avec son ombre
  g.save();
  g.shadowColor = "rgba(0,0,0,0.55)";
  g.shadowBlur = 50;
  g.shadowOffsetY = 26;
  rectangleArrondi(g, X, Y, L, H, 0.56 * u);
  g.fillStyle = degradeDuCadre(g, carte.rarete, X, Y, L, H);
  g.fill();
  g.restore();

  // La fiche de papier
  const cote = 0.69 * u;
  const ix = X + cote;
  const iy = Y + cote;
  const iw = L - 2 * cote;
  const ih = H - 2 * cote;
  rectangleArrondi(g, ix, iy, iw, ih, 0.25 * u);
  g.fillStyle = PAPIER;
  g.fill();

  const marge = 0.75 * u;
  const largeurTexte = iw - 2 * marge;

  // ----- Mesures de tout ce qui n'est pas l'illustration (l'illustration prend la place qui reste) -----
  // L'en-tête : le nom (réduit si trop long) et l'étiquette du thème
  g.font = "700 " + 0.74 * u + "px " + police;
  const largeurEtiquette = g.measureText(p.univers).width + 1.2 * u;
  let taillePolice = 1.75 * u;
  g.font = "800 " + taillePolice + "px " + police;
  while (g.measureText(p.nom).width > largeurTexte - largeurEtiquette - 0.5 * u && taillePolice > 0.9 * u) {
    taillePolice -= 1;
    g.font = "800 " + taillePolice + "px " + police;
  }
  const hauteurEntete = 0.6 * u + 1.75 * u + 0.5 * u;

  g.font = "400 " + 0.84 * u + "px " + police;
  const lignesSousTitre = decouperEnLignes(g, p.oeuvre + ", " + p.annee, largeurTexte);
  const hauteurSousTitre = 0.5 * u + lignesSousTitre.length * 0.84 * u * 1.2;

  // La fiche : Camp / Espèce, puis Pouvoirs / Groupe, sur deux colonnes
  const tailleFiche = 0.82 * u;
  const interColonne = 0.85 * u;
  const largeurColonne = (largeurTexte - interColonne) / 2;
  const cellules = [["Camp", p.camp], ["Espèce", p.espece], ["Pouvoirs", p.pouvoirs.join(", ")], ["Groupe", p.groupes.join(", ")]].map(([titre, valeur]) => {
    g.font = "700 " + tailleFiche + "px " + police;
    const largeurTitre = g.measureText(titre).width + 0.4 * u;
    g.font = "400 " + tailleFiche + "px " + police;
    return { titre, largeurTitre, lignes: decouperEnLignes(g, valeur, largeurColonne - largeurTitre) };
  });
  const hauteurRang1 = Math.max(cellules[0].lignes.length, cellules[1].lignes.length) * tailleFiche * 1.25;
  const hauteurRang2 = Math.max(cellules[2].lignes.length, cellules[3].lignes.length) * tailleFiche * 1.25;
  const hauteurFiche = 0.35 * u + hauteurRang1 + 0.2 * u + hauteurRang2;

  g.font = "400 " + 0.8 * u + "px " + police;
  const lignesTexte = decouperEnLignes(g, descriptionCourte(p), largeurTexte);
  const hauteurTexte = 0.45 * u + lignesTexte.length * 0.8 * u * 1.3;

  const date = dateDepuisTexte(carte.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  g.font = "400 " + 0.72 * u + "px " + police;
  const lignesPied = decouperEnLignes(g, "Héros du Jour n° " + carte.numero + ", gagnée le " + date + " en " + texteNombreEssais(carte.essais), largeurTexte);
  const hauteurPied = 0.45 * u + lignesPied.length * 0.72 * u * 1.2 + 0.55 * u;

  const hauteurArt = ih - hauteurEntete - hauteurSousTitre - hauteurFiche - hauteurTexte - hauteurPied;
  canevas.hauteurArt = hauteurArt;   // (pour les contrôles : l'illustration ne doit jamais devenir minuscule)
  canevas.uniteCarte = u;

  // ----- Dessin -----
  let y = iy;

  // En-tête
  g.textBaseline = "middle";
  g.textAlign = "left";
  g.fillStyle = ENCRE;
  g.font = "800 " + taillePolice + "px " + police;
  g.fillText(p.nom, ix + marge, y + 0.6 * u + 0.875 * u);
  const hEtiquette = 0.74 * u + 0.6 * u;
  rectangleArrondi(g, ix + iw - marge - largeurEtiquette, y + 0.6 * u + 0.875 * u - hEtiquette / 2, largeurEtiquette, hEtiquette, 0.25 * u);
  g.fillStyle = couleurDuSite("--u-" + simplifier(p.univers).replace(/ /g, "-"), "#555555");
  g.fill();
  g.fillStyle = "#ffffff";
  g.textAlign = "center";
  g.font = "700 " + 0.74 * u + "px " + police;
  g.fillText(p.univers, ix + iw - marge - largeurEtiquette / 2, y + 0.6 * u + 0.875 * u + 1);
  y += hauteurEntete;

  // Zone de l'illustration : un dégradé à la couleur du thème et, pour l'instant, une silhouette.
  // (Plus tard : dessiner ici l'image du personnage, recadrée pour remplir la zone.)
  const ax = ix + 0.62 * u;
  const aw = iw - 1.24 * u;
  const couleurTheme = couleurDuSite("--u-" + simplifier(p.univers).replace(/ /g, "-"), "#555555");
  g.save();
  rectangleArrondi(g, ax, y, aw, hauteurArt, 0.2 * u);
  g.clip();
  const degradeArt = g.createLinearGradient(ax, y, ax + aw * 0.4, y + hauteurArt);
  degradeArt.addColorStop(0, melangerLesCouleurs(couleurTheme, "#ffffff", 0.72));
  degradeArt.addColorStop(1, couleurTheme);
  g.fillStyle = degradeArt;
  g.fillRect(ax, y, aw, hauteurArt);
  if (imagePerso) {
    dessinerEnRemplissant(g, imagePerso, ax, y, aw, hauteurArt, infoImage.cadrage);   // l'image du personnage remplit la zone
  } else {
    const echelle = Math.min(0.7 * aw / 100, hauteurArt / 120);
    g.translate(ax + aw / 2 - 50 * echelle, y + hauteurArt - 120 * echelle);
    g.scale(echelle, echelle);
    g.fillStyle = "rgba(255,255,255,0.38)";
    g.beginPath();
    g.arc(50, 38, 22, 0, Math.PI * 2);
    g.fill();
    g.fill(new Path2D("M6 120c0-30 20-46 44-46s44 16 44 46z"));
  }
  g.restore();

  // Le tampon de la rareté, posé de travers sur l'illustration
  g.save();
  g.font = "800 " + 0.95 * u + "px " + police;
  try { g.letterSpacing = (0.06 * 0.95 * u) + "px"; } catch (erreur) { /* vieux navigateur : sans espacement */ }
  const texteTampon = rarete.nom.toUpperCase();
  const largeurTampon = g.measureText(texteTampon).width + 1.2 * u;
  const hauteurTampon = 0.95 * u + 0.5 * u;
  g.translate(ax + aw - 0.62 * u - largeurTampon / 2, y + hauteurArt - 0.85 * u - hauteurTampon / 2);
  g.rotate(-7 * Math.PI / 180);
  rectangleArrondi(g, -largeurTampon / 2, -hauteurTampon / 2, largeurTampon, hauteurTampon, 0.2 * u);
  g.fillStyle = "rgba(253,253,251,0.88)";
  g.fill();
  g.lineWidth = 0.16 * u;
  g.strokeStyle = COULEURS_TAMPON[carte.rarete];
  g.stroke();
  g.fillStyle = COULEURS_TAMPON[carte.rarete];
  g.textAlign = "center";
  g.fillText(texteTampon, 0, 1);
  g.restore();
  // Le sceau du mode (Facile / Expert), en haut à gauche de l'illustration. Une carte Normale n'en a pas.
  const modeDeLaCarte = difficulteDeLaCarte(carte);
  if (modeDeLaCarte !== "normal") {
    g.save();
    g.font = "800 " + 0.78 * u + "px " + police;
    try { g.letterSpacing = (0.05 * 0.78 * u) + "px"; } catch (erreur) { /* vieux navigateur : sans espacement */ }
    const texteSceau = window.DIFFICULTES[modeDeLaCarte].nom.toUpperCase();
    const largeurSceau = g.measureText(texteSceau).width + 1.1 * u;
    const hauteurSceau = 0.78 * u + 0.5 * u;
    g.translate(ax + 0.55 * u + largeurSceau / 2, y + 0.55 * u + hauteurSceau / 2);
    g.rotate(-4 * Math.PI / 180);
    rectangleArrondi(g, -largeurSceau / 2, -hauteurSceau / 2, largeurSceau, hauteurSceau, 0.2 * u);
    g.fillStyle = modeDeLaCarte === "expert" ? "#1b2a2b" : "rgba(253,253,251,0.92)";
    g.fill();
    g.fillStyle = modeDeLaCarte === "expert" ? "#f7e08a" : "#1b2a2b";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(texteSceau, 0, 1);
    g.restore();
  }
  y += hauteurArt;

  // Sous-titre (l'œuvre et l'année)
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  g.fillStyle = ENCRE_DOUCE;
  g.font = "400 " + 0.84 * u + "px " + police;
  lignesSousTitre.forEach((ligne, i) => g.fillText(ligne, ix + marge, y + 0.5 * u + (i + 1) * 0.84 * u * 1.2 - 0.2 * u));
  y += hauteurSousTitre;

  // Fiche
  const dessinerCellule = (cellule, colonne, yDebut) => {
    const x = ix + marge + colonne * (largeurColonne + interColonne);
    g.fillStyle = ENCRE;
    g.font = "700 " + tailleFiche + "px " + police;
    g.fillText(cellule.titre, x, yDebut + tailleFiche * 1.0);
    g.font = "400 " + tailleFiche + "px " + police;
    cellule.lignes.forEach((ligne, i) => g.fillText(ligne, x + cellule.largeurTitre, yDebut + tailleFiche * 1.0 + i * tailleFiche * 1.25));
  };
  dessinerCellule(cellules[0], 0, y + 0.35 * u);
  dessinerCellule(cellules[1], 1, y + 0.35 * u);
  dessinerCellule(cellules[2], 0, y + 0.35 * u + hauteurRang1 + 0.2 * u);
  dessinerCellule(cellules[3], 1, y + 0.35 * u + hauteurRang1 + 0.2 * u);
  y += hauteurFiche;

  // Description courte
  g.fillStyle = ENCRE;
  g.font = "400 " + 0.8 * u + "px " + police;
  lignesTexte.forEach((ligne, i) => g.fillText(ligne, ix + marge, y + 0.45 * u + (i + 1) * 0.8 * u * 1.3 - 0.25 * u));
  y += hauteurTexte;

  // Pied de la carte
  g.fillStyle = ENCRE_DOUCE;
  g.font = "400 " + 0.72 * u + "px " + police;
  lignesPied.forEach((ligne, i) => g.fillText(ligne, ix + marge, y + 0.45 * u + (i + 1) * 0.72 * u * 1.2 - 0.2 * u));

  // Sous la carte : le nom du jeu et son adresse AU MOMENT du partage (celle que le joueur a dans son navigateur)
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#f3f6fb";
  g.font = "800 56px " + police;
  g.fillText("Héros du Jour", LARGEUR_IMAGE / 2, Y + H + 74);
  g.fillStyle = "rgba(243,246,251,0.8)";
  g.font = "500 34px " + police;
  g.fillText(adresseDuSiteMaintenant().courte, LARGEUR_IMAGE / 2, Y + H + 128);

  return canevas;
}

// Fabrique l'image (un fichier PNG) d'une carte.
async function fabriquerImageDeLaCarte(carte) {
  const canevas = await fabriquerLeCanevasDeLaCarte(carte);
  return new Promise((resolve, reject) => {
    canevas.toBlob(fichier => (fichier ? resolve(fichier) : reject(new Error("image impossible"))), "image/png");
  });
}

// Enregistre l'image sur l'appareil (surtout pour les ordinateurs, qui n'ont pas de menu de partage).
function enregistrerLImage(fichier, nom) {
  const adresse = URL.createObjectURL(fichier);
  const lien = document.createElement("a");
  lien.href = adresse;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  setTimeout(() => URL.revokeObjectURL(adresse), 10000);
}

// Appui sur « Partager la carte » : menu de partage du téléphone avec l'image, sinon enregistrement de l'image.
// afficherUnMessage(texte) : montre un petit message au joueur (« Image enregistrée… »).
async function partagerLaCarte(carte, afficherUnMessage) {
  if (!peutPartagerLaCarte(carte)) {
    afficherUnMessage("La carte du personnage du jour se partage à partir de demain : sinon, tes amis auraient la réponse.");
    return;
  }
  const p = trouverPersonnage(carte.id);
  afficherUnMessage("Fabrication de l'image…");
  try {
    const fichierImage = await fabriquerImageDeLaCarte(carte);
    const nom = "heros-du-jour-" + carte.id + ".png";
    const fichier = new File([fichierImage], nom, { type: "image/png" });
    const texte = "Ma carte " + RARETES[carte.rarete].nom + " : " + p.nom + " ! " + adresseDuSiteMaintenant().complete;

    if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
      try {
        await navigator.share({ files: [fichier], text: texte });
        afficherUnMessage("");
        return;
      } catch (erreur) {
        if (erreur && erreur.name === "AbortError") {   // le joueur a fermé le menu de partage
          afficherUnMessage("");
          return;
        }
        // autre problème : on enregistre l'image à la place
      }
    }
    enregistrerLImage(fichierImage, nom);
    afficherUnMessage("Image enregistrée : tu peux la partager où tu veux.");
    son("copier");
  } catch (erreur) {
    afficherUnMessage("Impossible de fabriquer l'image. Réessaie dans un instant.");
  }
}
