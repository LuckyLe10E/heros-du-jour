// Le choix entre mode clair et mode sombre.
// Par défaut, le jeu est en mode sombre ; si le joueur appuie sur le bouton soleil / lune, on retient son choix.

const CLE_THEME = "heros-du-jour-theme";   // le nom sous lequel on range le choix dans le navigateur
const THEME_PAR_DEFAUT = "sombre";

// Le choix du joueur, s'il en a fait un ("clair", "sombre"), sinon null.
function themeSauvegarde() {
  try {
    const choix = localStorage.getItem(CLE_THEME);
    if (choix === "clair" || choix === "sombre") return choix;
  } catch (erreur) {
    // le navigateur refuse la sauvegarde (navigation privée…) : on ignore
  }
  return null;
}

// Retient le choix du joueur.
function sauvegarderTheme(theme) {
  try {
    localStorage.setItem(CLE_THEME, theme);
  } catch (erreur) {
    // pas grave : le choix durera juste jusqu'à la fermeture de la page
  }
}

// Les deux petits dessins du bouton : une lune (pour passer en mode sombre) et un soleil (pour revenir au clair).
const DESSIN_LUNE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';
const DESSIN_SOLEIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';

// Applique un thème à la page et met à jour le bouton (qui propose toujours l'autre mode).
function appliquerTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const bouton = document.getElementById("bouton-theme");
  if (!bouton) return;
  const autre = (theme === "sombre") ? "clair" : "sombre";
  bouton.innerHTML = (theme === "sombre") ? DESSIN_SOLEIL : DESSIN_LUNE;
  bouton.setAttribute("aria-label", "Passer en mode " + autre);
  bouton.title = "Passer en mode " + autre;
}

// Appui sur le bouton : on passe à l'autre mode et on s'en souvient.
function basculerTheme() {
  const actuel = document.documentElement.getAttribute("data-theme");
  const nouveau = (actuel === "sombre") ? "clair" : "sombre";
  appliquerTheme(nouveau);
  sauvegarderTheme(nouveau);
}

// Dès le chargement (script placé dans l'en-tête de la page) : on applique le thème tout de suite,
// pour éviter un flash de la mauvaise couleur.
appliquerTheme(themeSauvegarde() || THEME_PAR_DEFAUT);

// Quand la page est prête : on branche le bouton.
document.addEventListener("DOMContentLoaded", () => {
  appliquerTheme(document.documentElement.getAttribute("data-theme"));
  const bouton = document.getElementById("bouton-theme");   // absent des pages sans ce bouton (Confidentialité)
  if (bouton) bouton.addEventListener("click", basculerTheme);
});
