// L'accès au panneau admin EN LIGNE : connexion Google, puis récupération de la clé GitHub rangée dans le compte de Luca.
//
//  - La page ne montre rien tant que la connexion n'est pas faite ET que le compte n'a pas le droit de lire la clé.
//  - La clé GitHub est gardée dans Firestore, dans le document « admin/depot ». Les règles de sécurité de Firestore (écrites dans la
//    console Firebase, pas dans ce code) ne laissent lire et écrire ce document qu'au compte de Luca : c'est ELLES qui décident, pas cette page.
//    (L'adresse e-mail de Luca n'est volontairement écrite nulle part dans le code du site.)
//  - La clé n'est jamais écrite dans le navigateur : elle est relue depuis le compte à chaque ouverture, sur n'importe quel appareil.

(function () {
  // Ces codes sont publics (comme dans js/compte.js) : ils disent seulement à quel projet Firebase parler.
  const CONFIG_FIREBASE = {
    apiKey: "AIzaSyBQUuz8hTU_QGz8BcUBk1GyDd2mxFnGHUY",
    authDomain: "herosdujour.firebaseapp.com",
    projectId: "herosdujour",
    storageBucket: "herosdujour.firebasestorage.app",
    messagingSenderId: "935254578675",
    appId: "1:935254578675:web:a4ea83d0a77c69687dee86"
  };
  const VERSION_FIREBASE = "10.14.1";
  const ECRANS = ["attente", "connexion", "refuse", "cle", "erreur"];

  const $ = id => document.getElementById(id);
  let auth = null;
  let base = null;
  let apresAcces = null;
  let changementDeCle = false;   // vrai quand Luca remplace la clé depuis la barre du haut : on recharge la page ensuite

  function montrer(nom, texte) {
    $("acces").hidden = false;
    ECRANS.forEach(e => { $("acces-" + e).hidden = e !== nom; });
    if (texte !== undefined) {
      const zone = $("acces-" + nom + "-texte");
      if (zone) zone.textContent = texte;
    }
  }

  function chargerScript(adresse) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = adresse;
      script.onload = resolve;
      script.onerror = () => reject(new Error("chargement impossible"));
      document.head.appendChild(script);
    });
  }

  async function lireJeton(utilisateur) {
    let document_;
    try {
      document_ = await base.collection("admin").doc("depot").get();
    } catch (erreur) {
      if (erreur && erreur.code === "permission-denied") {
        $("acces-compte").textContent = utilisateur.email || "ce compte";
        montrer("refuse");
        return;
      }
      montrer("erreur", "Impossible de lire ton espace pour l'instant (" + (erreur && erreur.code ? erreur.code : "problème de connexion") + "). Réessaie dans un instant.");
      return;
    }
    const jeton = document_.exists ? document_.data().jeton : null;
    if (!jeton) {
      montrer("cle");
      return;
    }
    try {
      await window.DEPOT_GITHUB.verifierJeton(jeton);
    } catch (erreur) {
      montrer("cle", erreur.message);
      return;
    }
    $("acces").hidden = true;
    apresAcces();
  }

  async function enregistrerLaCle() {
    const champ = $("acces-cle-champ");
    const valeur = champ.value.trim();
    if (!valeur) return;
    $("acces-cle-bouton").disabled = true;
    try {
      await window.DEPOT_GITHUB.verifierJeton(valeur);
      await base.collection("admin").doc("depot").set({ jeton: valeur, maj: firebase.firestore.FieldValue.serverTimestamp() });
      champ.value = "";
      if (changementDeCle) { location.reload(); return; }
      $("acces").hidden = true;
      apresAcces();
    } catch (erreur) {
      const texte = erreur && erreur.code === "permission-denied"
        ? "Firebase refuse d'enregistrer la clé : ce compte n'a pas le droit (ou la règle de sécurité n'est pas encore ajoutée)."
        : (erreur && erreur.message) || "Impossible d'enregistrer la clé.";
      montrer("cle", texte);
    }
    $("acces-cle-bouton").disabled = false;
  }

  async function seConnecter() {
    try {
      await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    } catch (erreur) {
      if (erreur && (erreur.code === "auth/popup-closed-by-user" || erreur.code === "auth/cancelled-popup-request")) return;
      const texte = erreur && erreur.code === "auth/popup-blocked"
        ? "Ton navigateur a bloqué la fenêtre de connexion. Autorise les fenêtres pop-up pour ce site, puis réessaie."
        : "La connexion a échoué. Réessaie dans un instant.";
      montrer("erreur", texte);
    }
  }

  async function seDeconnecter() {
    try { await auth.signOut(); } catch (erreur) { /* sans importance */ }
    location.reload();
  }

  // Lance la connexion. « apres » est appelée une fois que l'accès est accordé et que la clé est prête.
  async function demarrer(apres) {
    apresAcces = apres;
    montrer("attente");
    $("acces-connexion-bouton").addEventListener("click", seConnecter);
    $("acces-cle-bouton").addEventListener("click", enregistrerLaCle);
    $("acces-cle-champ").addEventListener("keydown", e => { if (e.key === "Enter") enregistrerLaCle(); });
    document.querySelectorAll("[data-acces-deconnexion]").forEach(b => b.addEventListener("click", seDeconnecter));
    try {
      const adresse = "https://www.gstatic.com/firebasejs/" + VERSION_FIREBASE + "/firebase-";
      await chargerScript(adresse + "app-compat.js");
      await chargerScript(adresse + "auth-compat.js");
      await chargerScript(adresse + "firestore-compat.js");
      firebase.initializeApp(CONFIG_FIREBASE);
      auth = firebase.auth();
      base = firebase.firestore();
    } catch (erreur) {
      montrer("erreur", "La connexion n'est pas disponible (vérifie ta connexion Internet), ou cette page n'est pas ouverte sur le site en ligne.");
      return;
    }
    auth.onAuthStateChanged(utilisateur => {
      if (!utilisateur) { montrer("connexion"); return; }
      montrer("attente");
      lireJeton(utilisateur);
    });
  }

  // Le bouton « Changer la clé GitHub » de la barre du haut
  function changerLaCle() {
    changementDeCle = true;
    montrer("cle", "Colle ici la nouvelle clé. Elle remplacera l'ancienne dans ton compte.");
  }

  window.ACCES_ADMIN = { demarrer, changerLaCle, erreur: texte => montrer("erreur", texte) };
})();
