// Le son dans le jeu : le bouton haut-parleur, les réglages du joueur (gardés dans le navigateur), le démarrage au premier toucher,
// et les petits sons de l'interface (fenêtres qui s'ouvrent, boutons…). Les sons eux-mêmes sont fabriqués par js/sons.js.
//
// Le joueur peut tout couper ou régler séparément les bruitages et la musique. Par défaut : son allumé, musique douce.

const CLE_SON = "heros-du-jour-son";
const REGLAGES_SON_PAR_DEFAUT = { actif: true, sons: 0.8, musique: 0.35 };

let reglagesSon = lireLesReglagesSon();

function nombreEntre0Et1(valeur, defaut) {
  return typeof valeur === "number" && valeur >= 0 && valeur <= 1 ? valeur : defaut;
}

function lireLesReglagesSon() {
  try {
    const donnees = JSON.parse(localStorage.getItem(CLE_SON) || "{}");
    return {
      actif: donnees.actif !== false,
      sons: nombreEntre0Et1(donnees.sons, REGLAGES_SON_PAR_DEFAUT.sons),
      musique: nombreEntre0Et1(donnees.musique, REGLAGES_SON_PAR_DEFAUT.musique)
    };
  } catch (erreur) {
    return Object.assign({}, REGLAGES_SON_PAR_DEFAUT);
  }
}

function ecrireLesReglagesSon() {
  try {
    localStorage.setItem(CLE_SON, JSON.stringify(reglagesSon));
  } catch (erreur) {
    // pas grave : les réglages ne seront pas retenus
  }
}

// Joue un son si le son est disponible (utilisable partout dans le jeu sans rien vérifier).
function son(id, options) {
  if (window.Sons) Sons.jouer(id, options);
}

// Le son qui accompagne la carte d'un thème
const SONS_DES_THEMES = {
  "Marvel": "theme-marvel", "DC": "theme-dc", "Manga": "theme-manga", "Indé": "theme-inde",
  "Films": "theme-films", "Séries": "theme-series", "Jeux vidéo": "theme-jeux", "Livres": "theme-livres"
};

function sonDuTheme(univers) {
  return SONS_DES_THEMES[univers] || null;
}

// Les 7 cases d'un essai qui se retournent : un petit son par case, selon sa couleur.
function jouerLesCases(idPersonnage) {
  if (!window.Sons) return;
  comparerAvecMystere(trouverPersonnage(idPersonnage)).forEach((comparaison, i) => {
    Sons.jouer("case-" + comparaison.etat, { delai: (i * PAS_REVELATION + 190) / 1000, volume: 0.85 });
  });
}

// Le moment avant lequel les fenêtres ne font pas leur petit bruit (la fenêtre de fin a déjà sa propre musique de victoire)
let pasDeBruitDeFenetreAvant = 0;

// ---------- Le bouton et le panneau de réglage ----------

function majLeBoutonSon() {
  const bouton = document.getElementById("bouton-son");
  bouton.classList.toggle("coupe", !reglagesSon.actif);
  bouton.setAttribute("aria-label", reglagesSon.actif ? "Son activé : régler le son" : "Son coupé : régler le son");
  document.getElementById("son-actif").checked = reglagesSon.actif;
  document.getElementById("son-volume-sons").value = Math.round(reglagesSon.sons * 100);
  document.getElementById("son-volume-musique").value = Math.round(reglagesSon.musique * 100);
}

function appliquerLeSon() {
  if (!window.Sons) return;
  Sons.regler({ volumeSons: reglagesSon.sons, volumeMusique: reglagesSon.musique });
  Sons.muet(!reglagesSon.actif);
  if (reglagesSon.actif && reglagesSon.musique > 0 && Sons.estDeverrouille()) Sons.musiqueDemarrer();
  if (reglagesSon.musique === 0) Sons.musiqueArreter();
  majLeBoutonSon();
}

function ouvrirLePanneauSon(ouvrir) {
  document.getElementById("panneau-son").hidden = !ouvrir;
  document.getElementById("bouton-son").setAttribute("aria-expanded", String(ouvrir));
}

function demarrerLeSon() {
  const bouton = document.getElementById("bouton-son");
  if (!window.Sons || !(window.AudioContext || window.webkitAudioContext)) {
    bouton.hidden = true;   // ce navigateur ne sait pas faire de son : on cache le bouton
    return;
  }

  // Le navigateur n'autorise le son qu'après un premier toucher : on le déverrouille à ce moment-là
  const deverrouiller = () => {
    Sons.deverrouiller();
    appliquerLeSon();
    if (reglagesSon.actif && reglagesSon.musique > 0) Sons.musiqueDemarrer();
  };
  ["pointerdown", "keydown"].forEach(nom => document.addEventListener(nom, deverrouiller, { once: true, capture: true }));

  bouton.addEventListener("click", () => ouvrirLePanneauSon(document.getElementById("panneau-son").hidden));
  document.getElementById("son-actif").addEventListener("change", evenement => {
    reglagesSon.actif = evenement.target.checked;
    ecrireLesReglagesSon();
    appliquerLeSon();
    if (reglagesSon.actif) son("clic");
  });
  document.getElementById("son-volume-sons").addEventListener("input", evenement => {
    reglagesSon.sons = evenement.target.value / 100;
    ecrireLesReglagesSon();
    appliquerLeSon();
  });
  document.getElementById("son-volume-sons").addEventListener("change", () => son("clic"));   // on entend le nouveau volume
  document.getElementById("son-volume-musique").addEventListener("input", evenement => {
    reglagesSon.musique = evenement.target.value / 100;
    ecrireLesReglagesSon();
    appliquerLeSon();
  });

  // Un toucher ailleurs (ou Échap) referme le panneau
  document.addEventListener("pointerdown", evenement => {
    if (!evenement.target.closest("#panneau-son, #bouton-son")) ouvrirLePanneauSon(false);
  });
  document.addEventListener("keydown", evenement => {
    if (evenement.key === "Escape" && !document.getElementById("panneau-son").hidden) ouvrirLePanneauSon(false);
  });

  // Page cachée (autre onglet, téléphone verrouillé) : on met le son en pause
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) Sons.suspendre();
    else Sons.reveiller();
  });

  // Les fenêtres qui s'ouvrent et se ferment font un petit bruit de papier
  const observateur = new MutationObserver(mutations => {
    mutations.forEach(m => {
      const fenetre = m.target;
      const etaitCachee = m.oldValue !== null;
      const estCachee = fenetre.hidden;
      if (etaitCachee === estCachee || performance.now() < pasDeBruitDeFenetreAvant) return;
      son(estCachee ? "fenetre-ferme" : "fenetre-ouvre");
    });
  });
  document.querySelectorAll(".fenetre-fond, .ecran-plein").forEach(fenetre => {
    observateur.observe(fenetre, { attributes: true, attributeFilter: ["hidden"], attributeOldValue: true });
  });

  // Un petit clic sur les boutons principaux
  const BOUTONS_AVEC_CLIC = "#bouton-theme, #difficulte-boutons button, #bonus-lancer, #bonus-retour, #rattrapage-lancer, #fin-suite, #bouton-resultat";
  document.addEventListener("click", evenement => {
    if (evenement.target.closest(BOUTONS_AVEC_CLIC)) son("clic");
  });

  majLeBoutonSon();
  appliquerLeSon();
}

demarrerLeSon();
