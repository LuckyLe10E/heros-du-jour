// Fonctions communes à tout le site.

// Transforme un texte « 2026-10-14 » en vraie date (à minuit, heure locale),
// puis y ajoute un nombre de jours (0 par défaut).
function dateDepuisTexte(texte, joursEnPlus) {
  const morceaux = texte.split("-");
  return new Date(Number(morceaux[0]), Number(morceaux[1]) - 1, Number(morceaux[2]) + (joursEnPlus || 0));
}

// Écrit une date en français, par exemple « mar. 14 oct. 2026 ».
function dateCourteEnFrancais(date) {
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// Renvoie la date d'aujourd'hui écrite en français, par exemple « Mardi 13 octobre 2026 ».
function dateDuJourEnFrancais() {
  const texte = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  // Majuscule au début : « mardi 13 octobre 2026 » devient « Mardi 13 octobre 2026 »
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}
