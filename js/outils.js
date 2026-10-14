// Fonctions communes à tout le site.

// Rend un texte « neutre » pour les recherches : sans majuscules, sans accents,
// avec les tirets et apostrophes remplacés par des espaces.
// Exemple : « L'Homme-Araignée » devient « l homme araignee ».
function simplifier(texte) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Coupe un texte en phrases. Chaque fiche de personnage est écrite avec des phrases
// qui se terminent par un point suivi d'un espace (jamais de point à l'intérieur d'une phrase).
function decouperEnPhrases(texte) {
  return texte.split(/\.\s+/).map(phrase => (phrase.endsWith(".") ? phrase : phrase + "."));
}

// Compte le nombre de jours entre une date de départ (texte « 2026-10-14 ») et une autre date.
// Les deux sont lues en heure locale, à minuit. Le résultat est 0 le jour même, 1 le lendemain, etc.
function joursEntre(departTexte, date) {
  const morceaux = departTexte.split("-");
  const depart = Date.UTC(Number(morceaux[0]), Number(morceaux[1]) - 1, Number(morceaux[2]));
  const arrivee = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((arrivee - depart) / 86400000);
}

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
