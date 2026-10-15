// La connexion Google (facultative) et la sauvegarde en ligne (cartes, résultats des parties, carte favorite), avec Firebase.
// Le jeu marche toujours sans compte : si Firebase ne se charge pas (pas d'Internet, page ouverte par double-clic…),
// tout reste comme avant, les cartes restent dans le navigateur.
// Ce qui est gardé en ligne : l'identifiant et l'e-mail Google (gérés par Firebase), la liste des cartes, le résultat de chaque
// jour joué et la carte favorite. Rien d'autre.

// Ces codes sont publics : ils disent seulement à quel projet Firebase le site doit parler.
// Les règles de sécurité de Firestore décident qui peut lire ou écrire (chacun seulement ses propres cartes).
const CONFIG_FIREBASE = {
  apiKey: "AIzaSyBQUuz8hTU_QGz8BcUBk1GyDd2mxFnGHUY",
  authDomain: "herosdujour.firebaseapp.com",
  projectId: "herosdujour",
  storageBucket: "herosdujour.firebasestorage.app",
  messagingSenderId: "935254578675",
  appId: "1:935254578675:web:a4ea83d0a77c69687dee86"
};

const VERSION_FIREBASE = "10.14.1";

// L'état de la connexion
const compte = {
  disponible: false,       // Firebase est chargé et prêt
  indisponible: "",        // sinon : pourquoi (texte affiché au joueur)
  utilisateur: undefined,  // undefined = on ne sait pas encore, null = pas connecté, sinon le joueur connecté
  auth: null,
  base: null,
  etat: "",                // "synchro" (en cours), "ok" (cartes à jour en ligne), "erreur"
  erreur: "",              // le message quand etat = "erreur"
  synchroEnCours: false,
  synchroDemandee: false
};

// Charge un script (l'un des morceaux de Firebase) sans bloquer le jeu.
function chargerScript(adresse) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = adresse;
    script.onload = resolve;
    script.onerror = () => reject(new Error("chargement impossible : " + adresse));
    document.head.appendChild(script);
  });
}

// Traduit une erreur en message simple pour le joueur.
function messageErreurCompte(erreur) {
  const code = erreur && erreur.code ? erreur.code : "";
  if (code === "auth/popup-blocked") return "Ton navigateur a bloqué la fenêtre de connexion. Autorise les fenêtres pop-up pour ce site, puis réessaie.";
  if (code === "auth/network-request-failed" || code === "unavailable") return "Pas de connexion Internet pour le moment. Tes cartes restent sur cet appareil.";
  if (code === "permission-denied") return "Le service a refusé la sauvegarde. Réessaie plus tard.";
  if (code === "resource-exhausted") return "Le service de sauvegarde est très demandé aujourd'hui. Tes cartes restent sur cet appareil.";
  return "Un problème est survenu. Réessaie dans un instant.";
}

// ---------- L'affichage de la fenêtre « Mon compte » ----------

// Met à jour tout ce qui dépend de la connexion : le bouton de l'en-tête et le contenu de la fenêtre.
function afficherCompte() {
  const connecte = Boolean(compte.utilisateur);
  const attente = compte.disponible && compte.utilisateur === undefined;
  const bouton = document.getElementById("bouton-compte");
  bouton.classList.toggle("connecte", connecte);
  bouton.setAttribute("aria-label", connecte ? "Mon compte (connecté)" : "Mon compte");

  const enTest = partie.modeTest;
  document.getElementById("compte-indisponible").hidden = compte.disponible || !compte.indisponible;
  document.getElementById("compte-indisponible").textContent = compte.indisponible;
  document.getElementById("compte-chargement").hidden = !attente;
  document.getElementById("compte-deconnecte").hidden = !compte.disponible || attente || connecte;
  document.getElementById("compte-connecte").hidden = !connecte;
  document.getElementById("compte-test").hidden = !(enTest && compte.disponible);

  // La petite phrase sous la vitrine : où sont gardées les données
  let etat = "Tu n'es pas connecté : tes cartes et tes statistiques restent sur cet appareil.";
  if (connecte) {
    document.getElementById("compte-email").textContent = compte.utilisateur.email || "ton compte Google";
    if (enTest) etat = "Mode test : tes vraies données ne sont pas synchronisées.";
    else if (compte.etat === "synchro") etat = "Synchronisation en cours…";
    else if (compte.etat === "ok") etat = "Connecté : tes cartes et tes statistiques sont sauvegardées en ligne.";
    else if (compte.etat === "erreur") etat = compte.erreur;
    else etat = "Connecté.";
  }
  document.getElementById("compte-etat").textContent = etat;
}

// Affiche un message dans la fenêtre (erreur de connexion, suppression réussie…).
function afficherMessageCompte(texte) {
  document.getElementById("compte-message").textContent = texte;
}

// ---------- La synchronisation des cartes ----------

// Met en commun ce qui est sur cet appareil et ce qui est dans le compte (cartes, résultats des parties, favori) :
// chaque côté reçoit tout, sans jamais rien perdre.
// Appelée à la connexion, à chaque chargement de la page quand on est connecté, et après chaque carte gagnée.
async function synchroniserLesCartes() {
  if (!compte.disponible || !compte.utilisateur || partie.modeTest) return;
  if (compte.synchroEnCours) {
    compte.synchroDemandee = true;   // on recommencera juste après, pour ne rien manquer
    return;
  }
  compte.synchroEnCours = true;
  compte.etat = "synchro";
  afficherCompte();

  try {
    const reference = compte.base.collection("joueurs").doc(compte.utilisateur.uid);
    const instantane = await reference.get();
    const donneesEnLigne = instantane.exists ? instantane.data() : null;
    const enLigne = cartesDuCompte(donneesEnLigne);
    const statsEnLigne = statsDuCompte(donneesEnLigne);

    // Tout est relu juste avant d'écrire : une carte gagnée ou un jour noté entre-temps n'est pas perdu
    const surAppareil = lireCollection().cartes;
    const statsAppareil = lireStats();
    const fusion = fusionnerCartes(surAppareil, enLigne);
    const statsFusion = {
      jours: fusionnerJours(statsAppareil.jours, statsEnLigne.jours),
      favori: fusionnerFavoris(statsAppareil.favori, statsEnLigne.favori),
      bonus: fusionnerBonus(statsAppareil.bonus, statsEnLigne.bonus)
    };

    if (!memesCartes(fusion, surAppareil)) ecrireCollection({ cartes: fusion });
    if (!memesJours(statsFusion.jours, statsAppareil.jours) || !memesFavoris(statsFusion.favori, statsAppareil.favori)
      || !memesBonus(statsFusion.bonus, statsAppareil.bonus)) {
      ecrireStats(statsFusion);
    }
    const aJour = memesCartes(fusion, enLigne)
      && memesJours(statsFusion.jours, statsEnLigne.jours) && memesFavoris(statsFusion.favori, statsEnLigne.favori)
      && memesBonus(statsFusion.bonus, statsEnLigne.bonus);
    if (!aJour) {
      await reference.set({
        version: 1,
        cartes: fusion,
        jours: statsFusion.jours,
        favori: statsFusion.favori,
        bonus: statsFusion.bonus,
        maj: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    compte.etat = "ok";
  } catch (erreur) {
    compte.etat = "erreur";
    compte.erreur = messageErreurCompte(erreur);
  }

  compte.synchroEnCours = false;
  afficherBoutonCollection();
  if (!document.getElementById("fenetre-collection").hidden) dessinerBibliotheque();
  if (!document.getElementById("ecran-profil").hidden) afficherProfil();
  afficherCompte();

  if (compte.synchroDemandee) {
    compte.synchroDemandee = false;
    synchroniserLesCartes();
  }
}

// ---------- Connexion, déconnexion, suppression ----------

async function seConnecter() {
  afficherMessageCompte("");
  try {
    await compte.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  } catch (erreur) {
    // Le joueur a simplement fermé la fenêtre Google : ce n'est pas une erreur
    if (erreur && (erreur.code === "auth/popup-closed-by-user" || erreur.code === "auth/cancelled-popup-request")) return;
    afficherMessageCompte(messageErreurCompte(erreur));
  }
}

async function seDeconnecter() {
  afficherMessageCompte("");
  try {
    await compte.auth.signOut();
    compte.etat = "";
  } catch (erreur) {
    afficherMessageCompte(messageErreurCompte(erreur));
  }
}

// Supprime les cartes en ligne puis le compte lui-même. Les cartes restent sur cet appareil.
async function supprimerMonCompte() {
  const utilisateur = compte.utilisateur;
  if (!utilisateur) return;
  afficherMessageCompte("");
  document.getElementById("compte-suppression").hidden = true;
  try {
    await compte.base.collection("joueurs").doc(utilisateur.uid).delete();
    try {
      await utilisateur.delete();
    } catch (erreur) {
      // Google demande de se reconnecter avant une opération aussi importante
      if (!erreur || erreur.code !== "auth/requires-recent-login") throw erreur;
      await utilisateur.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
      await utilisateur.delete();
    }
    compte.etat = "";
    afficherMessageCompte("Ton compte et tes données en ligne ont été supprimés. Tes cartes et tes statistiques restent sur cet appareil.");
  } catch (erreur) {
    if (erreur && erreur.code === "auth/popup-closed-by-user") {
      afficherMessageCompte("Suppression annulée : tes données en ligne sont effacées, mais le compte existe encore. Recommence pour le supprimer.");
    } else {
      afficherMessageCompte(messageErreurCompte(erreur));
    }
  }
}

// ---------- Démarrage ----------

// Branche les boutons de la fenêtre, puis charge Firebase en arrière-plan.
async function demarrerCompte() {
  document.getElementById("compte-connexion").addEventListener("click", seConnecter);
  document.getElementById("compte-deconnexion").addEventListener("click", seDeconnecter);
  document.getElementById("compte-supprimer").addEventListener("click", () => {
    document.getElementById("compte-suppression").hidden = false;
  });
  document.getElementById("compte-annuler").addEventListener("click", () => {
    document.getElementById("compte-suppression").hidden = true;
  });
  document.getElementById("compte-confirmer").addEventListener("click", supprimerMonCompte);
  afficherCompte();

  // La connexion Google ne marche pas quand la page est ouverte par double-clic (adresse « file: »)
  if (location.protocol === "file:") {
    compte.indisponible = "La connexion marche seulement sur le site en ligne (ou en local avec « localhost »).";
    afficherCompte();
    return;
  }

  try {
    const base = "https://www.gstatic.com/firebasejs/" + VERSION_FIREBASE + "/firebase-";
    await chargerScript(base + "app-compat.js");
    await chargerScript(base + "auth-compat.js");
    await chargerScript(base + "firestore-compat.js");
    firebase.initializeApp(CONFIG_FIREBASE);
    compte.auth = firebase.auth();
    compte.base = firebase.firestore();
    compte.disponible = true;
    compte.auth.onAuthStateChanged(utilisateur => {
      compte.utilisateur = utilisateur;
      afficherCompte();
      if (utilisateur) synchroniserLesCartes();
    });
  } catch (erreur) {
    compte.disponible = false;
    compte.indisponible = "La connexion n'est pas disponible pour le moment (vérifie ta connexion Internet). Le jeu marche quand même, tes cartes restent sur cet appareil.";
  }
  afficherCompte();
}
