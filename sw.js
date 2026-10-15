// Le « service worker » : un petit programme que le navigateur garde à part pour que le jeu marche SANS RÉSEAU.
// Principe : chaque fichier du jeu que le navigateur télécharge est mis de côté. En ligne, on prend toujours la version la plus
// récente du site (donc une mise à jour est vue tout de suite) ; sans réseau, on rend la version mise de côté.
// On ne touche jamais aux demandes vers d'autres sites (la connexion Google et la sauvegarde en ligne), sauf la police de caractères.
// Rien de personnel n'est gardé : ce ne sont que les fichiers publics du jeu.

const CACHE = "heros-du-jour-v1";
const ATTENTE_RESEAU = 4000;   // si le réseau met plus de 4 secondes à répondre, on prend la version gardée

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", evenement => {
  evenement.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(nom => nom !== CACHE).map(nom => caches.delete(nom))))
      .then(() => self.clients.claim())
  );
});

// Met une réponse de côté si elle est bonne.
async function garder(requete, reponse) {
  if (reponse && (reponse.ok || reponse.type === "opaque")) {
    const cache = await caches.open(CACHE);
    await cache.put(requete, reponse.clone());
  }
  return reponse;
}

// D'abord le réseau (avec une limite d'attente), sinon ce qui a été gardé.
async function reseauPuisCache(requete) {
  try {
    // « no-cache » : le navigateur vérifie toujours auprès du site avant de reprendre sa propre copie (jamais de mélange d'anciens et de nouveaux fichiers)
    const reponse = await Promise.race([
      fetch(requete.url, { cache: "no-cache", credentials: "same-origin" }),
      new Promise((resolve, reject) => setTimeout(() => reject(new Error("trop long")), ATTENTE_RESEAU))
    ]);
    return await garder(requete, reponse);
  } catch (erreur) {
    const gardee = await caches.match(requete, { ignoreSearch: requete.mode === "navigate" });
    if (gardee) return gardee;
    // Page demandée sans réseau et jamais gardée : on rend la page d'accueil du jeu
    if (requete.mode === "navigate") {
      const accueil = (await caches.match("index.html")) || (await caches.match("./"));
      if (accueil) return accueil;
    }
    throw erreur;
  }
}

// D'abord ce qui a été gardé (la police ne change jamais), sinon le réseau.
async function cacheDabord(requete) {
  const gardee = await caches.match(requete);
  if (gardee) return gardee;
  return garder(requete, await fetch(requete));
}

self.addEventListener("fetch", evenement => {
  const requete = evenement.request;
  if (requete.method !== "GET") return;
  const adresse = new URL(requete.url);
  const memeSite = adresse.origin === self.location.origin;
  const police = adresse.hostname === "fonts.googleapis.com" || adresse.hostname === "fonts.gstatic.com";
  if (!memeSite && !police) return;   // les autres sites ne passent pas par ici
  evenement.respondWith(police ? cacheDabord(requete) : reseauPuisCache(requete));
});
