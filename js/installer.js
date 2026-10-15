// Installer le jeu sur l'écran d'accueil (application web installable) et le faire marcher sans réseau (service worker).
// - Android et ordinateur (Chrome, Edge) : le navigateur annonce que l'installation est possible, on propose un bouton.
// - iPhone / iPad (Safari) : pas de bouton possible, on explique les deux gestes à faire.
// - Si le jeu est déjà installé (ouvert en plein écran), la rubrique disparaît.

let installationProposee = null;   // l'invitation du navigateur, gardée de côté jusqu'au clic du joueur

// Le jeu est-il ouvert comme une application installée ?
function dejaInstalle() {
  return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
}

// Un iPhone ou un iPad ?
function surAppleMobile() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

// Montre ou cache la rubrique « Installer le jeu » du profil, selon ce qui est possible.
function afficherInstallation() {
  const rubrique = document.getElementById("profil-installation");
  if (!rubrique) return;
  const texte = document.getElementById("installer-texte");
  const bouton = document.getElementById("installer-bouton");

  if (dejaInstalle()) {
    rubrique.hidden = true;
  } else if (installationProposee) {
    rubrique.hidden = false;
    texte.textContent = "Ajoute Héros du Jour à ton écran d'accueil : une icône, le jeu en plein écran, et il marche même sans connexion Internet.";
    bouton.hidden = false;
  } else if (surAppleMobile()) {
    rubrique.hidden = false;
    texte.textContent = "Dans Safari, touche le bouton Partager (le carré avec une flèche vers le haut), puis « Sur l'écran d'accueil ». Le jeu aura son icône et marchera même sans connexion Internet.";
    bouton.hidden = true;
  } else {
    rubrique.hidden = true;
  }
}

async function installerLeJeu() {
  if (!installationProposee) return;
  installationProposee.prompt();
  try {
    await installationProposee.userChoice;
  } catch (erreur) {
    // le joueur a refusé ou fermé : on ne dit rien
  }
  installationProposee = null;   // l'invitation ne peut servir qu'une fois
  afficherInstallation();
}

// Le navigateur dit que le jeu peut être installé : on garde l'invitation pour le bouton.
window.addEventListener("beforeinstallprompt", evenement => {
  evenement.preventDefault();
  installationProposee = evenement;
  afficherInstallation();
});

window.addEventListener("appinstalled", () => {
  installationProposee = null;
  afficherInstallation();
});

// Le service worker (le jeu sans réseau) : seulement sur le vrai site (pas en double-clic sur le fichier)
if ("serviceWorker" in navigator && window.location.protocol.indexOf("http") === 0) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // pas grave : le jeu marche quand même, simplement pas sans réseau
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const bouton = document.getElementById("installer-bouton");
  if (bouton) bouton.addEventListener("click", installerLeJeu);
  afficherInstallation();
});
