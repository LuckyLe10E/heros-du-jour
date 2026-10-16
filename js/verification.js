// Page de vérification : affiche les fiches et le calendrier dans des tableaux.

// Les colonnes du tableau des fiches : titre affiché, et comment on lit la valeur pour trier.
const COLONNES = [
  { titre: "Nom",         valeur: p => p.nom },
  { titre: "Thème",       valeur: p => p.univers },
  { titre: "Image",       valeur: p => (window.IMAGES && window.IMAGES[p.id] ? "oui" : "pas d'image") },
  { titre: "Camp",        valeur: p => p.camp },
  { titre: "Genre",       valeur: p => p.genre },
  { titre: "Espèce",      valeur: p => p.espece },
  { titre: "Pouvoirs",    valeur: p => p.pouvoirs.join(", ") },
  { titre: "Groupes",     valeur: p => p.groupes.join(", ") },
  { titre: "1ʳᵉ app.",    valeur: p => p.annee },
  { titre: "Œuvre",       valeur: p => p.oeuvre },
  { titre: "Indice (après 5 essais)", valeur: p => p.indice },
  { titre: "Fiche (fin de partie)",   valeur: p => p.description },
  { titre: "À vérifier",  valeur: p => p.averifier || "" }
];

let colonneTri = null;   // numéro de la colonne triée (null = ordre d'origine)
let sensTri = 1;         // 1 = croissant, -1 = décroissant

// Crée une cellule de tableau avec du texte (jamais du HTML, pour éviter tout souci).
function creerCellule(texte, classe) {
  const td = document.createElement("td");
  td.textContent = texte;
  if (classe) td.className = classe;
  return td;
}

// Renvoie la liste des personnages après filtres et tri.
function personnagesAffiches() {
  const mot = simplifier(document.getElementById("recherche").value.trim());
  const univers = document.getElementById("filtre-univers").value;
  const seulementADoute = document.getElementById("filtre-averifier").checked;

  let liste = window.PERSONNAGES.filter(p => {
    if (univers && p.univers !== univers) return false;
    if (seulementADoute && !p.averifier) return false;
    if (!mot) return true;
    const texte = [p.nom, ...p.autresNoms, p.pouvoirs.join(" "), p.groupes.join(" "), p.oeuvre, p.espece].join(" ");
    return simplifier(texte).includes(mot);
  });

  if (colonneTri !== null) {
    const lire = COLONNES[colonneTri].valeur;
    liste = liste.slice().sort((a, b) => {
      const x = lire(a), y = lire(b);
      if (typeof x === "number") return (x - y) * sensTri;
      return String(x).localeCompare(String(y), "fr") * sensTri;
    });
  }
  return liste;
}

// Dessine le tableau des fiches.
function afficherFiches() {
  const corps = document.querySelector("#tableau-fiches tbody");
  corps.innerHTML = "";
  const liste = personnagesAffiches();

  liste.forEach(p => {
    const tr = document.createElement("tr");
    if (p.averifier) tr.className = "a-verifier";

    // Nom + autres noms dessous
    const celluleNom = document.createElement("td");
    const gras = document.createElement("strong");
    gras.textContent = p.nom;
    celluleNom.appendChild(gras);
    if (p.autresNoms.length) {
      const petit = document.createElement("div");
      petit.className = "petit";
      petit.textContent = p.autresNoms.join(", ");
      celluleNom.appendChild(petit);
    }
    tr.appendChild(celluleNom);

    tr.appendChild(creerCellule(p.univers, classeDuTheme(p.univers)));
    tr.appendChild(creerCellule(p.camp));
    tr.appendChild(creerCellule(p.genre));
    tr.appendChild(creerCellule(p.espece));
    tr.appendChild(creerCellule(p.pouvoirs.join(", ")));
    tr.appendChild(creerCellule(p.groupes.join(", ")));
    tr.appendChild(creerCellule(p.annee));
    tr.appendChild(creerCellule(p.oeuvre));
    tr.appendChild(creerCellule(p.indice, "description"));
    tr.appendChild(creerCellule(p.description, "description large"));
    tr.appendChild(creerCellule(p.averifier ? "⚠ " + p.averifier : "", "doute"));
    corps.appendChild(tr);
  });

  document.getElementById("compteur").textContent = liste.length + " / " + window.PERSONNAGES.length + " personnages";
}

// Dessine la ligne de titres cliquables.
function creerEntetes() {
  const ligne = document.getElementById("entetes");
  COLONNES.forEach((colonne, numero) => {
    const th = document.createElement("th");
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.textContent = colonne.titre;
    bouton.addEventListener("click", () => {
      sensTri = (colonneTri === numero) ? -sensTri : 1;
      colonneTri = numero;
      document.querySelectorAll("#entetes th").forEach(cellule => cellule.removeAttribute("data-tri"));
      th.setAttribute("data-tri", sensTri === 1 ? "▲" : "▼");
      afficherFiches();
    });
    th.appendChild(bouton);
    ligne.appendChild(th);
  });
}

// Dessine le tableau du calendrier : un jour par ligne.
function afficherCalendrier() {
  const corps = document.querySelector("#tableau-calendrier tbody");
  const parId = {};
  window.PERSONNAGES.forEach(p => { parId[p.id] = p; });

  // Numéro du jour d'aujourd'hui (pour le repérer dans la liste)
  const debut = dateDepuisTexte(window.DATE_LANCEMENT);
  const maintenant = new Date();
  const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  const numeroAujourdhui = Math.round((aujourdhui - debut) / 86400000) + 1;

  window.CALENDRIER.forEach((id, i) => {
    const p = parId[id];
    const tr = document.createElement("tr");
    if (i + 1 === numeroAujourdhui) tr.className = "aujourdhui";
    tr.appendChild(creerCellule(i + 1));
    tr.appendChild(creerCellule(dateCourteEnFrancais(dateDepuisTexte(window.DATE_LANCEMENT, i))));
    const dansLApercu = window.PERSONNAGES_APERCU.includes(id);
    if (dansLApercu) tr.className = (tr.className ? tr.className + " " : "") + "a-verifier";
    tr.appendChild(creerCellule(p ? p.nom + (dansLApercu ? " ⚠ visible dans l'aperçu du lien : changer l'image avant ce jour" : "") : "⚠ inconnu : " + id));
    tr.appendChild(creerCellule(p ? p.univers : ""));
    corps.appendChild(tr);
  });
}

// Change d'onglet (personnages / calendrier).
function afficherOnglet(nom) {
  document.getElementById("section-fiches").hidden = (nom !== "fiches");
  document.getElementById("section-calendrier").hidden = (nom !== "calendrier");
  document.getElementById("onglet-fiches").classList.toggle("actif", nom === "fiches");
  document.getElementById("onglet-calendrier").classList.toggle("actif", nom === "calendrier");
}

// Démarrage de la page.
function demarrer() {
  const nombreADoute = window.PERSONNAGES.filter(p => p.averifier).length;
  document.getElementById("resume").textContent =
    window.PERSONNAGES.length + " personnages, dont " + nombreADoute + " marqués « à vérifier ».";

  window.CRITERES.univers.forEach(nom => {
    const option = document.createElement("option");
    option.value = nom;
    option.textContent = nom;
    document.getElementById("filtre-univers").appendChild(option);
  });

  creerEntetes();
  afficherFiches();
  afficherCalendrier();

  document.getElementById("recherche").addEventListener("input", afficherFiches);
  document.getElementById("filtre-univers").addEventListener("change", afficherFiches);
  document.getElementById("filtre-averifier").addEventListener("change", afficherFiches);
  document.getElementById("onglet-fiches").addEventListener("click", () => afficherOnglet("fiches"));
  document.getElementById("onglet-calendrier").addEventListener("click", () => afficherOnglet("calendrier"));
}

demarrer();
