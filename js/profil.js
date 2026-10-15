// L'écran « Mon profil » : la vitrine (carte favorite), les statistiques, le résumé de la collection et le compte.
// Les calculs sont dans statistiques.js ; ici, on dessine.

// Date d'aujourd'hui, à minuit (pour compter les jours).
function aujourdhuiAMinuit() {
  const maintenant = new Date();
  return new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
}

// Écrit « 1 jour » ou « 5 jours ».
function texteNombreJours(nombre) {
  return nombre + (nombre > 1 ? " jours" : " jour");
}

// Dessine la vitrine : la carte favorite en petit, son nom, et le bouton pour en changer.
function afficherLaVitrine() {
  const carte = carteDeLaVitrine();
  const zone = document.getElementById("profil-vitrine");
  zone.innerHTML = "";
  const label = document.getElementById("profil-vitrine-label");
  const nom = document.getElementById("profil-vitrine-nom");
  const aide = document.getElementById("profil-vitrine-aide");
  const bouton = document.getElementById("profil-changer");

  if (carte) {
    zone.appendChild(creerVignetteDom(carte, carte.id, ouvrirCarteEnGrand));
    label.textContent = "Ma carte favorite";
    nom.textContent = trouverPersonnage(carte.id).nom;
    aide.hidden = true;
    bouton.hidden = false;
  } else {
    const vide = creerElement("div", "emplacement");
    vide.setAttribute("aria-hidden", "true");
    vide.appendChild(creerSilhouette());
    zone.appendChild(vide);
    label.textContent = "";
    nom.textContent = "Ta vitrine est vide";
    aide.hidden = false;
    bouton.hidden = true;
  }
}

// Dessine les chiffres, la série, les 14 derniers jours et la répartition des essais.
function afficherLesStatistiques() {
  const stats = calculerStatistiques(lireStats().jours, aujourdhuiAMinuit());

  document.getElementById("stat-parties").textContent = stats.parties;
  document.getElementById("stat-victoires").textContent =
    stats.parties > 0 ? Math.round(100 * stats.victoires / stats.parties) + " %" : "–";

  document.getElementById("stat-serie").textContent = stats.serieActuelle;
  document.getElementById("stat-serie-tampon").setAttribute("aria-label", "Série en cours : " + texteNombreJours(stats.serieActuelle));
  const texte = document.getElementById("stat-serie-texte");
  const detail = document.getElementById("stat-serie-detail");
  if (stats.serieActuelle === 0) {
    texte.textContent = "Pas encore de série";
    detail.textContent = "Joue aujourd'hui pour lancer ta série.";
  } else {
    texte.textContent = texteNombreJours(stats.serieActuelle) + " d'affilée";
    detail.textContent = (stats.jouePeutProlonger ? "Joue aujourd'hui pour la prolonger. " : "")
      + "Ta meilleure série : " + texteNombreJours(stats.meilleureSerie);
  }

  // Les 14 derniers jours (le dernier carré est aujourd'hui)
  const jours = document.getElementById("stat-jours");
  jours.innerHTML = "";
  stats.derniersJours.forEach((jour, i) => {
    const carre = document.createElement("li");
    carre.className = jour.etat + (i === stats.derniersJours.length - 1 ? " aujourdhui" : "");
    const dateEcrite = jour.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    carre.title = dateEcrite + " : " + { gagne: "gagné", perdu: "perdu", vide: "pas joué" }[jour.etat];
    jours.appendChild(carre);
  });

  // La répartition : une barre par nombre d'essais, plus une pour les parties perdues
  const repartition = document.getElementById("stat-repartition");
  repartition.innerHTML = "";
  const maximum = Math.max(1, stats.perdues, ...stats.repartition);
  const ajouterBarre = (etiquette, classe, nombre) => {
    const ligne = document.createElement("li");
    ligne.className = classe;
    ligne.appendChild(creerElement("span", "num", etiquette));
    const piste = creerElement("span", "piste");
    const barre = creerElement("span", "barre");
    barre.style.width = (100 * nombre / maximum) + "%";
    piste.appendChild(barre);
    ligne.appendChild(piste);
    ligne.appendChild(creerElement("span", "nb", String(nombre)));
    repartition.appendChild(ligne);
  };
  stats.repartition.forEach((nombre, i) => ajouterBarre(String(i + 1), calculerRarete(i + 1), nombre));
  ajouterBarre("X", "perdu", stats.perdues);
}

// Dessine le résumé de la collection : le total, les cartes par rareté, les cartes par thème.
function afficherLeResumeDeLaCollection() {
  const cartes = Object.values(lireCollection().cartes);
  const total = window.PERSONNAGES.length;

  document.getElementById("profil-cartes").textContent = cartes.length;
  document.getElementById("profil-cartes-sur").textContent = (cartes.length > 1 ? "cartes" : "carte") + " sur " + total;
  document.getElementById("profil-progres").setAttribute("aria-label", cartes.length + " sur " + total);
  document.getElementById("profil-progres-barre").style.width = (total > 0 ? Math.round(100 * cartes.length / total) : 0) + "%";

  const raretes = document.getElementById("profil-raretes");
  raretes.innerHTML = "";
  Object.keys(RARETES).forEach(cle => {
    const ligne = creerElement("div", "rarete-ligne");
    ligne.appendChild(creerElement("span", "nom", RARETES[cle].nom));
    ligne.appendChild(creerElement("span", "bande " + cle));
    ligne.appendChild(creerElement("span", "n", String(cartes.filter(carte => carte.rarete === cle).length)));
    raretes.appendChild(ligne);
  });

  const univers = document.getElementById("profil-univers");
  univers.innerHTML = "";
  window.CRITERES.univers.forEach(nom => {
    const dansLUnivers = window.PERSONNAGES.filter(p => p.univers === nom).length;
    const possedees = cartes.filter(carte => trouverPersonnage(carte.id).univers === nom).length;
    const ligne = creerElement("li", classeDuTheme(nom));
    ligne.appendChild(creerElement("span", "nom", nom));
    const piste = creerElement("span", "piste");
    const remplissage = document.createElement("i");
    remplissage.style.width = (dansLUnivers > 0 ? Math.round(100 * possedees / dansLUnivers) : 0) + "%";
    piste.appendChild(remplissage);
    ligne.appendChild(piste);
    ligne.appendChild(creerElement("span", "n", possedees + " / " + dansLUnivers));
    univers.appendChild(ligne);
  });
}

// Redessine tout le profil.
function afficherProfil() {
  afficherLaVitrine();
  afficherLesStatistiques();
  afficherLeResumeDeLaCollection();
  afficherCompte();
}

// ---------- Choisir la carte favorite ----------

function ouvrirLeChoixDuFavori() {
  const cartes = lireCollection().cartes;
  const vitrine = carteDeLaVitrine();
  const grille = document.getElementById("profil-choix-grille");
  grille.innerHTML = "";
  window.PERSONNAGES.forEach(p => {
    const carte = cartes[p.id];
    if (!carte) return;
    const ligne = document.createElement("li");
    const vignette = creerVignetteDom(carte, p.id, () => {
      choisirLeFavori(p.id);
      synchroniserLesCartes();   // si le joueur est connecté, son choix part en ligne
      fermerLeChoixDuFavori();
    });
    if (vitrine && vitrine.id === p.id) vignette.classList.add("choisie");
    ligne.appendChild(vignette);
    grille.appendChild(ligne);
  });
  document.getElementById("profil-vue").hidden = true;
  document.getElementById("profil-choix").hidden = false;
  document.getElementById("ecran-profil").scrollTop = 0;
}

function fermerLeChoixDuFavori() {
  document.getElementById("profil-choix").hidden = true;
  document.getElementById("profil-vue").hidden = false;
  afficherProfil();
  document.getElementById("ecran-profil").scrollTop = 0;
}

// ---------- Ouvrir et fermer l'écran ----------

function ouvrirProfil() {
  document.getElementById("compte-message").textContent = "";
  document.getElementById("compte-suppression").hidden = true;
  document.getElementById("profil-choix").hidden = true;
  document.getElementById("profil-vue").hidden = false;
  afficherProfil();
  document.getElementById("ecran-profil").hidden = false;
  document.getElementById("ecran-profil").scrollTop = 0;
  document.getElementById("profil-fermer").focus({ preventScroll: true });
}

function fermerProfil() {
  document.getElementById("ecran-profil").hidden = true;
  document.getElementById("bouton-compte").focus();
}

// Branche les boutons de l'écran (appelée au démarrage).
function demarrerProfil() {
  document.getElementById("bouton-compte").addEventListener("click", ouvrirProfil);
  document.getElementById("profil-fermer").addEventListener("click", fermerProfil);
  document.getElementById("profil-changer").addEventListener("click", ouvrirLeChoixDuFavori);
  document.getElementById("profil-choix-annuler").addEventListener("click", fermerLeChoixDuFavori);
  document.getElementById("profil-voir-collection").addEventListener("click", ouvrirBibliotheque);
}
