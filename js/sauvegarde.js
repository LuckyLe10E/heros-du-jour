// Le « code de sauvegarde » : un texte à copier-coller pour retrouver ses cartes sur un autre téléphone
// (ou après avoir effacé les données du navigateur). Pas de compte, pas de serveur : le code contient
// directement les cartes. Il se présente comme ceci :  HDJ1.<les cartes codées>.<une clé de contrôle>
//
// La restauration FUSIONNE avec ce que le joueur possède déjà : on ne perd jamais de carte,
// et une carte ne perd jamais de rareté (on garde la meilleure).

const PREFIXE_CODE = "HDJ1";
const LETTRES_RARETE = { legendaire: "L", rare: "R", commune: "C" };
const RARETE_DEPUIS_LETTRE = { L: "legendaire", R: "rare", C: "commune" };

// Une « clé de contrôle » de 8 caractères calculée à partir du texte : si le code est tronqué ou mal copié,
// la clé ne correspond plus et on le détecte.
function cleDeControle(texte) {
  let valeur = 0x811c9dc5;                       // petit algorithme de hachage classique (FNV-1a)
  for (let i = 0; i < texte.length; i++) {
    valeur ^= texte.charCodeAt(i);
    valeur = Math.imul(valeur, 0x01000193) >>> 0;
  }
  return valeur.toString(16).padStart(8, "0");
}

// Texte → code sûr à copier (lettres, chiffres, - et _ seulement).
function versBase64Sur(texte) {
  return btoa(texte).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// L'inverse. Renvoie null si ce n'est pas du base64 valide.
function depuisBase64Sur(code) {
  try {
    if (!/^[A-Za-z0-9\-_]*$/.test(code)) return null;
    let normal = code.replace(/-/g, "+").replace(/_/g, "/");
    while (normal.length % 4 !== 0) normal += "=";
    return atob(normal);
  } catch (erreur) {
    return null;
  }
}

// Fabrique le code de sauvegarde de la collection actuelle. Renvoie null s'il n'y a aucune carte.
function creerCodeDeSauvegarde() {
  const cartes = Object.values(lireCollection().cartes);
  if (cartes.length === 0) return null;
  // Chaque carte : id,rareté,essais,date(sans tirets),numéro   — par exemple  hulk,L,2,20261014,1
  const lignes = cartes.map(c =>
    [c.id, LETTRES_RARETE[c.rarete], c.essais, c.date.replace(/-/g, ""), c.numero].join(","));
  const contenu = lignes.join(";");
  return PREFIXE_CODE + "." + versBase64Sur(contenu) + "." + cleDeControle(contenu);
}

// Lit un code de sauvegarde collé par le joueur.
// Renvoie { ok: true, cartes: [...], ignorees: n } ou { ok: false, erreur: "…" }.
function lireCodeDeSauvegarde(texteColle) {
  const code = String(texteColle).replace(/\s+/g, "");      // on ignore espaces et retours à la ligne (copier-coller)
  if (code === "") return { ok: false, erreur: "Colle d'abord ton code de sauvegarde." };

  const morceaux = code.split(".");
  if (morceaux.length !== 3 || morceaux[0] !== PREFIXE_CODE) {
    return { ok: false, erreur: "Ce texte n'est pas un code de sauvegarde Héros du Jour. Vérifie que tu l'as copié en entier." };
  }
  const contenu = depuisBase64Sur(morceaux[1]);
  if (contenu === null || cleDeControle(contenu) !== morceaux[2]) {
    return { ok: false, erreur: "Le code est abîmé ou incomplet. Copie-le de nouveau en entier, sans rien enlever." };
  }

  const cartes = [];
  let ignorees = 0;
  contenu.split(";").forEach(ligne => {
    const [id, lettre, essais, date, numero] = ligne.split(",");
    const carte = {
      id,
      rarete: RARETE_DEPUIS_LETTRE[lettre],
      essais: Number(essais),
      date: /^\d{8}$/.test(date || "") ? date.slice(0, 4) + "-" + date.slice(4, 6) + "-" + date.slice(6, 8) : "",
      numero: Number(numero)
    };
    // On ne garde que les cartes valides (personnage connu, rareté connue, nombres réalistes)
    if (carteValide(carte)) cartes.push(carte); else ignorees++;
  });
  return { ok: true, cartes, ignorees };
}

// Ajoute à la collection les cartes d'un code, SANS RIEN PERDRE :
//  - carte qu'on n'avait pas : ajoutée ;
//  - carte qu'on avait avec une rareté plus basse : améliorée ;
//  - sinon : on garde la carte actuelle.
// Renvoie le bilan { ajoutees, ameliorees, inchangees }.
function fusionnerLesCartes(cartesRecues) {
  const collection = lireCollection();
  const bilan = { ajoutees: 0, ameliorees: 0, inchangees: 0 };

  cartesRecues.forEach(carte => {
    const existante = collection.cartes[carte.id];
    if (!existante) {
      collection.cartes[carte.id] = carte;
      bilan.ajoutees++;
    } else if (RARETES[carte.rarete].ordre > RARETES[existante.rarete].ordre) {
      collection.cartes[carte.id] = carte;
      bilan.ameliorees++;
    } else {
      bilan.inchangees++;
    }
  });

  if (bilan.ajoutees > 0 || bilan.ameliorees > 0) ecrireCollection(collection);
  return bilan;
}

// Restaure les cartes à partir du texte collé. Renvoie { ok, message }.
function restaurerDepuisUnCode(texteColle) {
  const lecture = lireCodeDeSauvegarde(texteColle);
  if (!lecture.ok) return { ok: false, message: lecture.erreur };
  if (lecture.cartes.length === 0) return { ok: false, message: "Ce code ne contient aucune carte valide." };

  const bilan = fusionnerLesCartes(lecture.cartes);
  const morceaux = [];
  if (bilan.ajoutees > 0) morceaux.push(bilan.ajoutees + (bilan.ajoutees > 1 ? " cartes ajoutées" : " carte ajoutée"));
  if (bilan.ameliorees > 0) morceaux.push(bilan.ameliorees + (bilan.ameliorees > 1 ? " cartes améliorées" : " carte améliorée"));
  if (morceaux.length === 0) return { ok: true, message: "Tout était déjà dans ta collection : rien n'a changé." };
  return { ok: true, message: "C'est fait : " + morceaux.join(" et ") + " !" };
}
