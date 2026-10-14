// Le choix entre mode clair et mode sombre.
// Par défaut, on suit le mode du téléphone ; si le joueur appuie sur le bouton ☀️/🌙, on retient son choix.

const CLE_THEME = "heros-du-jour-theme";   // le nom sous lequel on range le choix dans le navigateur

// Le mode du téléphone ou de l'ordinateur : "sombre" ou "clair".
function themeDuSysteme() {
  const sombre = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return sombre ? "sombre" : "clair";
}

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

// Applique un thème à la page et met à jour le bouton (qui propose toujours l'autre mode).
function appliquerTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const bouton = document.getElementById("bouton-theme");
  if (!bouton) return;
  const autre = (theme === "sombre") ? "clair" : "sombre";
  bouton.textContent = (theme === "sombre") ? "☀️" : "🌙";
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
appliquerTheme(themeSauvegarde() || themeDuSysteme());

// Quand la page est prête : on branche le bouton.
document.addEventListener("DOMContentLoaded", () => {
  appliquerTheme(document.documentElement.getAttribute("data-theme"));
  document.getElementById("bouton-theme").addEventListener("click", basculerTheme);
});
