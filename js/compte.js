// La connexion Google (facultative) et la sauvegarde des cartes en ligne, avec Firebase.
// Le jeu marche toujours sans compte : si Firebase ne se charge pas (pas d'Internet, page ouverte par double-clic…),
// tout reste comme avant, les cartes restent dans le navigateur.
// Ce qui est gardé en ligne : l'identifiant et l'e-mail Google (gérés par Firebase) et la liste des cartes. Rien d'autre.

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

  if (connecte) {
    document.getElementById("compte-email").textContent = compte.utilisateur.email || "ton compte Google";
    const nombre = Object.keys(lireCollection().cartes).length;
    let etat = "";
    if (enTest) etat = "Mode test : tes vraies cartes ne sont pas synchronisées.";
    else if (compte.etat === "synchro") etat = "Synchronisation en cours…";
    else if (compte.etat === "ok") etat = nombre + (nombre > 1 ? " cartes sont sauvegardées" : " carte est sauvegardée") + " en ligne.";
    else if (compte.etat === "erreur") etat = compte.erreur;
    document.getElementById("compte-etat").textContent = etat;
  }
}

// Affiche un message dans la fenêtre (erreur de connexion, suppression réussie…).
function afficherMessageCompte(texte) {
  document.getElementById("compte-message").textContent = texte;
}

function ouvrirCompte() {
  afficherMessageCompte("");
  document.getElementById("compte-suppression").hidden = true;
  afficherCompte();
  document.getElementById("fenetre-compte").hidden = false;
  document.getElementById("compte-fermer").focus({ preventScroll: true });
}

function fermerCompte() {
  document.getElementById("fenetre-compte").hidden = true;
  document.getElementById("bouton-compte").focus();
}

// ---------- La synchronisation des cartes ----------

// Met les cartes de cet appareil et celles du compte en commun : chaque côté reçoit toutes les cartes.
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
    const enLigne = cartesDuCompte(instantane.exists ? instantane.data() : null);
    const surAppareil = lireCollection().cartes;   // lu juste avant d'écrire : une carte gagnée entre-temps n'est pas perdue
    const fusion = fusionnerCartes(surAppareil, enLigne);

    if (!memesCartes(fusion, surAppareil)) ecrireCollection({ cartes: fusion });
    if (!memesCartes(fusion, enLigne)) {
      await reference.set({ version: 1, cartes: fusion, maj: firebase.firestore.FieldValue.serverTimestamp() });
    }
    compte.etat = "ok";
  } catch (erreur) {
    compte.etat = "erreur";
    compte.erreur = messageErreurCompte(erreur);
  }

  compte.synchroEnCours = false;
  afficherBoutonCollection();
  if (!document.getElementById("fenetre-collection").hidden) dessinerBibliotheque();
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
    afficherMessageCompte("Ton compte et tes données en ligne ont été supprimés. Tes cartes restent sur cet appareil.");
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
  document.getElementById("bouton-compte").addEventListener("click", ouvrirCompte);
  document.getElementById("compte-fermer").addEventListener("click", fermerCompte);
  document.getElementById("compte-connexion").addEventListener("click", seConnecter);
  document.getElementById("compte-deconnexion").addEventListener("click", seDeconnecter);
  document.getElementById("compte-supprimer").addEventListener("click", () => {
    document.getElementById("compte-suppression").hidden = false;
  });
  document.getElementById("compte-annuler").addEventListener("click", () => {
    document.getElementById("compte-suppression").hidden = true;
  });
  document.getElementById("compte-confirmer").addEventListener("click", supprimerMonCompte);
  document.getElementById("fenetre-compte").addEventListener("mousedown", evenement => {
    if (evenement.target.id === "fenetre-compte") fermerCompte();
  });
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
