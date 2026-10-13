// Fonctions communes à tout le site.

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
