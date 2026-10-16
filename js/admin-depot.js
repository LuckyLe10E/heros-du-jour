// Le panneau admin EN LIGNE : ce fichier enregistre les changements directement dans le projet GitHub (avec la clé de Luca),
// et Vercel remet le site à jour tout seul environ une minute plus tard.
// Il fait la même chose que outils/serveur-admin.py (qui sert, lui, au panneau lancé sur l'ordinateur) :
// modifier une fiche dans data/personnages.js « fiche par fiche » (commentaires et mise en forme conservés), tenir le calendrier,
// la liste des groupes et data/images.js à jour, ranger l'image réduite dans images/personnages/.
// Toutes les modifications d'une même action partent dans UN SEUL envoi (un « commit »), vérifié avant d'être envoyé.
//
// Ce fichier n'est utilisé que par admin.html. Le jeu ne le charge jamais.

(function () {
  const PROPRIETAIRE = "LuckyLe10E";
  const DEPOT = "heros-du-jour";
  const BRANCHE = "main";
  const FICHIER_PERSONNAGES = "data/personnages.js";
  const FICHIER_CALENDRIER = "data/calendrier.js";
  const FICHIER_CONSTANTES = "data/constantes.js";
  const FICHIER_IMAGES = "data/images.js";
  const ENTETE_SECTION_AJOUTS = "  // ==================== AJOUTS (panneau admin) ====================";
  const MOTIF_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const MOTIF_CADRAGE = /^\d{1,3}% \d{1,3}%$/;
  const TAILLE_MAX_IMAGE = 4 * 1024 * 1024;

  let adresseApi = "https://api.github.com";   // (changée seulement par les tests en local)
  let jeton = null;

  // -------------------------------------------------------------------------------------------------------------
  // Outils : texte <-> base64, comparaison
  // -------------------------------------------------------------------------------------------------------------

  function octetsVersBase64(octets) {
    let texte = "";
    const pas = 0x8000;
    for (let i = 0; i < octets.length; i += pas) texte += String.fromCharCode.apply(null, octets.subarray(i, i + pas));
    return btoa(texte);
  }

  function base64VersTexte(base64) {
    const binaire = atob(base64.replace(/\s/g, ""));
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
    return new TextDecoder("utf-8").decode(octets);
  }

  function texteVersBase64(texte) {
    return octetsVersBase64(new TextEncoder().encode(texte));
  }

  function egal(a, b) {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    return ka.length === kb.length && ka.every((k, i) => k === kb[i] && egal(a[k], b[k]));
  }

  function texteJs(valeur) {
    return JSON.stringify(valeur);
  }

  function listeJs(liste) {
    return "[" + liste.map(texteJs).join(", ") + "]";
  }

  function finDeLigne(texte) {
    return texte.includes("\r\n") ? "\r\n" : "\n";
  }

  // -------------------------------------------------------------------------------------------------------------
  // Dialogue avec GitHub
  // -------------------------------------------------------------------------------------------------------------

  function messageGithub(statut, donnees) {
    if (statut === 401) return "GitHub refuse la clé (elle est peut-être expirée ou supprimée). Remplace-la avec « Changer la clé GitHub ».";
    if (statut === 403 || statut === 404) return "GitHub refuse l'accès au projet : la clé doit avoir la permission « Contents : Read and write » sur le dépôt « " + DEPOT + " ».";
    if (statut === 409 || statut === 422) return "Le projet a changé entre-temps (ou l'envoi a été refusé). Recharge la page puis recommence.";
    return "GitHub a répondu une erreur (" + statut + ") : " + ((donnees && donnees.message) || "pas de détail").slice(0, 120);
  }

  async function appelGithub(methode, chemin, corps) {
    let reponse;
    try {
      reponse = await fetch(adresseApi + "/repos/" + PROPRIETAIRE + "/" + DEPOT + chemin, {
        method: methode,
        cache: "no-store",   // toujours la version la plus récente (GitHub garde parfois des réponses en mémoire une minute)
        headers: Object.assign({
          "Authorization": "Bearer " + jeton,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }, corps ? { "Content-Type": "application/json" } : {}),
        body: corps ? JSON.stringify(corps) : undefined
      });
    } catch (erreur) {
      throw new Error("Pas de connexion à GitHub. Vérifie ta connexion Internet.");
    }
    let donnees = {};
    try { donnees = await reponse.json(); } catch (erreur) { /* réponse vide */ }
    if (!reponse.ok) throw new Error(messageGithub(reponse.status, donnees));
    return donnees;
  }

  async function lireTexte(chemin, version) {
    const donnees = await appelGithub("GET", "/contents/" + chemin.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(version));
    if (!donnees.content) throw new Error("Le fichier " + chemin + " est trop gros pour être lu.");
    return base64VersTexte(donnees.content);
  }

  // Envoie plusieurs fichiers d'un coup dans UN seul commit. fichiers = [{ chemin, texte | octets | supprimer: true }]
  async function envoyer(message, fichiers, teteLue) {
    const tete = await appelGithub("GET", "/git/ref/heads/" + BRANCHE);
    if (teteLue && tete.object.sha !== teteLue) throw new Error("Le projet a changé pendant que tu modifiais. Recharge la page puis recommence.");
    const commitActuel = await appelGithub("GET", "/git/commits/" + tete.object.sha);
    const arbre = [];
    for (const f of fichiers) {
      if (f.supprimer) {
        arbre.push({ path: f.chemin, mode: "100644", type: "blob", sha: null });
        continue;
      }
      const contenu = f.octets ? octetsVersBase64(f.octets) : texteVersBase64(f.texte);
      const blob = await appelGithub("POST", "/git/blobs", { content: contenu, encoding: "base64" });
      arbre.push({ path: f.chemin, mode: "100644", type: "blob", sha: blob.sha });
    }
    const nouvelArbre = await appelGithub("POST", "/git/trees", { base_tree: commitActuel.tree.sha, tree: arbre });
    const commit = await appelGithub("POST", "/git/commits", { message, tree: nouvelArbre.sha, parents: [tete.object.sha] });
    await appelGithub("PATCH", "/git/refs/heads/" + BRANCHE, { sha: commit.sha, force: false });
    return commit.sha;
  }

  // -------------------------------------------------------------------------------------------------------------
  // Lecture des données du projet (les vrais fichiers, tels qu'ils sont sur GitHub à l'instant)
  // -------------------------------------------------------------------------------------------------------------

  // Exécute les fichiers de données comme le fait le navigateur et renvoie ce qu'ils définissent.
  function evaluer(textes) {
    const fenetre = {};
    for (const nom of [FICHIER_CONSTANTES, FICHIER_PERSONNAGES, FICHIER_CALENDRIER, FICHIER_IMAGES]) {
      new Function("window", textes[nom])(fenetre);
    }
    return fenetre;
  }

  async function lireTousLesFichiers() {
    const tete = await appelGithub("GET", "/git/ref/heads/" + BRANCHE);
    const version = tete.object.sha;
    const textes = {};
    for (const nom of [FICHIER_CONSTANTES, FICHIER_PERSONNAGES, FICHIER_CALENDRIER, FICHIER_IMAGES]) textes[nom] = await lireTexte(nom, version);
    return { version, textes, fenetre: evaluer(textes) };
  }

  // -------------------------------------------------------------------------------------------------------------
  // data/personnages.js : on modifie le texte « fiche par fiche »
  // -------------------------------------------------------------------------------------------------------------

  function trouverFiches(lignes) {
    const fiches = [];
    for (let i = 0; i < lignes.length; i++) {
      const m = /^  \{ id: "([^"]+)"/.exec(lignes[i]);
      if (m) {
        let j = i;
        while (j < lignes.length && !/\}\s*,?\s*$/.test(lignes[j])) j++;
        fiches.push([m[1], i, j]);
        i = j;
      }
    }
    return fiches;
  }

  function serialiserFiche(p) {
    const lignes = [
      "  { id: " + texteJs(p.id) + ", nom: " + texteJs(p.nom) + ", autresNoms: " + listeJs(p.autresNoms) + ",",
      "    univers: " + texteJs(p.univers) + ", camp: " + texteJs(p.camp) + ", genre: " + texteJs(p.genre) + ", espece: " + texteJs(p.espece) + ",",
      "    pouvoirs: " + listeJs(p.pouvoirs) + ", groupes: " + listeJs(p.groupes) + ",",
      "    annee: " + p.annee + ", oeuvre: " + texteJs(p.oeuvre) + ",",
      "    indice: " + texteJs(p.indice) + ","
    ];
    if (p.averifier) {
      lignes.push("    description: " + texteJs(p.description) + ",");
      lignes.push("    averifier: " + texteJs(p.averifier) + " },");
    } else {
      lignes.push("    description: " + texteJs(p.description) + " },");
    }
    return lignes;
  }

  function nettoyer(t) {
    return String(t).replace(/\s+/g, " ").trim();
  }

  // Renvoie la fiche nettoyée, ou lève une erreur qui explique ce qui ne va pas.
  function validerFiche(p, criteres, idsExistants, nouveau) {
    const texte = (cle, minimum, maximum, nom) => {
      if (typeof p[cle] !== "string") throw new Error(nom + " : à remplir.");
      const valeur = nettoyer(p[cle]);
      if (valeur.length < minimum || valeur.length > maximum) throw new Error(nom + " : entre " + minimum + " et " + maximum + " caractères (là : " + valeur.length + ").");
      return valeur;
    };
    const choix = (cle, valeurs, nom) => {
      if (!valeurs.includes(p[cle])) throw new Error(nom + " : choisis une valeur de la liste.");
      return p[cle];
    };
    const listeDeChoix = (cle, valeurs, nom) => {
      const liste = p[cle];
      if (!Array.isArray(liste) || !liste.length) throw new Error(nom + " : choisis au moins une valeur.");
      if (new Set(liste).size !== liste.length || liste.some(v => !valeurs.includes(v))) throw new Error(nom + " : valeur inconnue ou en double.");
      if (liste.includes("Aucun") && liste.length > 1) throw new Error(nom + " : « Aucun » ne peut pas être mélangé avec d'autres valeurs.");
      return liste.slice();
    };

    if (typeof p.id !== "string" || !MOTIF_ID.test(p.id) || p.id.length > 40) throw new Error("Identifiant : des lettres minuscules sans accent, des chiffres et des tirets (ex. « spider-man »).");
    if (nouveau && idsExistants.includes(p.id)) throw new Error("Ce personnage existe déjà (identifiant « " + p.id + " »).");
    if (!nouveau && !idsExistants.includes(p.id)) throw new Error("Personnage introuvable : « " + p.id + " ».");
    const autres = p.autresNoms || [];
    if (!Array.isArray(autres) || autres.length > 12 || autres.some(a => typeof a !== "string" || a.trim().length < 1 || a.trim().length > 60)) {
      throw new Error("Autres noms : 12 maximum, de 1 à 60 caractères chacun.");
    }
    if (!Number.isInteger(p.annee) || p.annee < 1700 || p.annee > new Date().getFullYear() + 1) throw new Error("Année : un nombre entre 1700 et l'année prochaine.");

    const fiche = {
      id: p.id,
      nom: texte("nom", 1, 60, "Nom"),
      autresNoms: autres.map(nettoyer),
      univers: choix("univers", criteres.univers, "Thème"),
      camp: choix("camp", criteres.camps, "Camp"),
      genre: choix("genre", criteres.genres, "Genre"),
      espece: choix("espece", criteres.especes, "Espèce"),
      pouvoirs: listeDeChoix("pouvoirs", criteres.pouvoirs, "Pouvoirs"),
      groupes: listeDeChoix("groupes", criteres.groupes, "Groupes"),
      annee: p.annee,
      oeuvre: texte("oeuvre", 1, 100, "Œuvre"),
      indice: texte("indice", 5, 300, "Indice"),
      description: texte("description", 40, 2500, "Description")
    };
    if (p.averifier) fiche.averifier = texte("averifier", 1, 300, "À vérifier");
    return fiche;
  }

  function texteAvecFiche(texte, fiche, nouveau) {
    const nl = finDeLigne(texte);
    let lignes = texte.split(nl);
    if (nouveau) {
      // Toujours À LA FIN (règle du projet : les numéros des cartes de l'album ne doivent jamais changer)
      let fin = -1;
      lignes.forEach((l, i) => { if (l.trim() === "];") fin = i; });
      if (fin < 0) throw new Error("Fin de la liste des personnages introuvable.");
      let bloc = [];
      if (!lignes.includes(ENTETE_SECTION_AJOUTS)) bloc = bloc.concat(["", ENTETE_SECTION_AJOUTS]);
      bloc = bloc.concat([""], serialiserFiche(fiche));
      let debut = fin;
      while (debut > 0 && lignes[debut - 1].trim() === "") debut--;
      const derniere = debut - 1;
      if (!lignes[derniere].trimEnd().endsWith(",")) lignes[derniere] = lignes[derniere].trimEnd() + ",";   // la dernière fiche actuelle n'a pas de virgule
      lignes = lignes.slice(0, debut).concat(bloc, [""], lignes.slice(fin));
    } else {
      const f = trouverFiches(lignes).find(x => x[0] === fiche.id);
      lignes = lignes.slice(0, f[1]).concat(serialiserFiche(fiche), lignes.slice(f[2] + 1));
    }
    return lignes.join(nl);
  }

  function texteSansFiche(texte, identifiant) {
    const nl = finDeLigne(texte);
    let lignes = texte.split(nl);
    const f = trouverFiches(lignes).find(x => x[0] === identifiant);
    let finSuppression = f[2] + 1;
    if (finSuppression < lignes.length && lignes[finSuppression].trim() === "") finSuppression++;
    lignes = lignes.slice(0, f[1]).concat(lignes.slice(finSuppression));
    // Si la section « AJOUTS » n'a plus aucune fiche, on retire son titre
    const titre = lignes.indexOf(ENTETE_SECTION_AJOUTS);
    if (titre >= 0 && !trouverFiches(lignes).some(x => x[1] > titre)) {
      let finTitre = titre + 1;
      while (finTitre < lignes.length && lignes[finTitre].trim() === "") finTitre++;
      let debutTitre = titre;
      while (debutTitre > 0 && lignes[debutTitre - 1].trim() === "") debutTitre--;
      lignes = lignes.slice(0, debutTitre).concat([""], lignes.slice(finTitre));
    }
    return lignes.join(nl);
  }

  // -------------------------------------------------------------------------------------------------------------
  // calendrier.js, constantes.js, images.js
  // -------------------------------------------------------------------------------------------------------------

  function calendrierAvec(texte, identifiant) {
    const nl = finDeLigne(texte);
    const fin = texte.lastIndexOf("];");
    return texte.slice(0, fin).replace(/\s+$/, "") + "," + nl + "  " + texteJs(identifiant) + nl + texte.slice(fin);
  }

  function calendrierSans(texte, identifiant) {
    const nl = finDeLigne(texte);
    const motif = new RegExp("\\s*\"" + identifiant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\"\\s*,?");
    if (!motif.test(texte)) throw new Error("Le personnage n'est pas dans le calendrier.");
    let nouveau = texte.replace(motif, "");
    nouveau = nouveau.replace(/,\s*\];/, nl + "];");
    nouveau = nouveau.replace(/\[\s*\n\s*/, "[" + nl + "  ");
    return nouveau;
  }

  function constantesAvecGroupe(texte, nom, criteres) {
    nom = nettoyer(nom || "");
    if (nom.length < 2 || nom.length > 40 || /["\\<>]/.test(nom)) throw new Error("Nom du groupe : de 2 à 40 caractères, sans guillemets.");
    if (criteres.groupes.some(g => g.toLowerCase() === nom.toLowerCase())) throw new Error("Ce groupe existe déjà.");
    const nl = finDeLigne(texte);
    const marque = "    // Aucun groupe";
    if (!texte.includes(marque)) throw new Error("Impossible de trouver où ajouter le groupe dans constantes.js.");
    const ajout = texte.includes("    // Ajouts (panneau admin)")
      ? "    " + texteJs(nom) + "," + nl + marque
      : "    // Ajouts (panneau admin)" + nl + "    " + texteJs(nom) + "," + nl + marque;
    return texte.replace(marque, () => ajout);
  }

  function separerImagesJs(texte) {
    const i = texte.indexOf("window.IMAGES = ");
    return { entete: texte.slice(0, i).replace(/\r\n/g, "\n"), images: JSON.parse(texte.slice(i + "window.IMAGES = ".length).trim().replace(/;$/, "")) };
  }

  function imagesJsEcrit(entete, images) {
    return entete + "window.IMAGES = " + JSON.stringify(images, null, 2) + ";\n";
  }

  // -------------------------------------------------------------------------------------------------------------
  // Les actions du panneau
  // -------------------------------------------------------------------------------------------------------------

  function verifierAvantEnvoi(textes, attendu) {
    let fenetre;
    try {
      fenetre = evaluer(textes);
    } catch (erreur) {
      throw new Error("Les fichiers modifiés auraient été cassés, rien n'a été envoyé : " + erreur.message);
    }
    if (attendu) attendu(fenetre);
  }

  // Une seule fonction pour tout ce que fait le bouton « Enregistrer » : fiche + image + cadrage, en un seul envoi.
  // options = { fiche, nouveau, image: { octets, source } | null, retirerImage: bool, cadrage: "50% 20%" }
  async function enregistrer(options) {
    const { version, textes, fenetre } = await lireTousLesFichiers();
    const ids = fenetre.PERSONNAGES.map(p => p.id);
    const fiche = validerFiche(options.fiche, fenetre.CRITERES, ids, options.nouveau);
    const nouveauxTextes = Object.assign({}, textes);
    const fichiers = [];

    nouveauxTextes[FICHIER_PERSONNAGES] = texteAvecFiche(textes[FICHIER_PERSONNAGES], fiche, options.nouveau);
    fichiers.push({ chemin: FICHIER_PERSONNAGES, texte: nouveauxTextes[FICHIER_PERSONNAGES] });
    if (options.nouveau) {
      nouveauxTextes[FICHIER_CALENDRIER] = calendrierAvec(textes[FICHIER_CALENDRIER], fiche.id);
      fichiers.push({ chemin: FICHIER_CALENDRIER, texte: nouveauxTextes[FICHIER_CALENDRIER] });
    }

    const cheminImage = "images/personnages/" + fiche.id + ".jpg";
    const { entete, images } = separerImagesJs(textes[FICHIER_IMAGES]);
    let imagesChangees = false;
    if (options.image) {
      if (options.image.octets.length > TAILLE_MAX_IMAGE) throw new Error("L'image est trop lourde (4 Mo maximum).");
      if (options.image.octets[0] !== 0xff || options.image.octets[1] !== 0xd8) throw new Error("L'image doit être un JPEG (le panneau la convertit tout seul).");
      const ancien = images[fiche.id] || {};
      images[fiche.id] = {
        fichier: cheminImage,
        credit: String(options.image.source || "").slice(0, 300),
        cadrage: MOTIF_CADRAGE.test(options.cadrage || "") ? options.cadrage : (ancien.cadrage || "50% 20%")
      };
      fichiers.push({ chemin: cheminImage, octets: options.image.octets });
      imagesChangees = true;
    } else if (options.retirerImage && images[fiche.id]) {
      delete images[fiche.id];
      fichiers.push({ chemin: cheminImage, supprimer: true });
      imagesChangees = true;
    } else if (images[fiche.id] && options.cadrage && MOTIF_CADRAGE.test(options.cadrage) && images[fiche.id].cadrage !== options.cadrage) {
      images[fiche.id].cadrage = options.cadrage;
      imagesChangees = true;
    }
    if (imagesChangees) {
      nouveauxTextes[FICHIER_IMAGES] = imagesJsEcrit(entete, images);
      fichiers.push({ chemin: FICHIER_IMAGES, texte: nouveauxTextes[FICHIER_IMAGES] });
    }

    verifierAvantEnvoi(nouveauxTextes, f => {
      const relue = f.PERSONNAGES.find(p => p.id === fiche.id);
      if (!relue || !egal(relue, fiche)) throw new Error("La relecture de la fiche ne correspond pas à ce qui a été préparé : rien n'a été envoyé.");
    });
    await envoyer((options.nouveau ? "Admin : ajout de " : "Admin : modification de ") + fiche.nom, fichiers, version);
    return fiche;
  }

  async function supprimer(identifiant) {
    const { version, textes, fenetre } = await lireTousLesFichiers();
    const ids = fenetre.PERSONNAGES.map(p => p.id);
    if (!ids.includes(identifiant)) throw new Error("Personnage introuvable.");
    if ((fenetre.PERSONNAGES_APERCU || []).includes(identifiant)) throw new Error("Ce personnage figure sur l'image d'aperçu du lien partagé : change d'abord PERSONNAGES_APERCU (demande à Claude).");
    const position = fenetre.CALENDRIER.indexOf(identifiant);
    if (position >= 0) {
      const numero = joursEntre(fenetre.DATE_LANCEMENT, new Date()) + 1;
      if (position + 1 <= numero) {
        throw new Error("Ce personnage a déjà été le personnage du jour n° " + (position + 1) + " : on ne supprime jamais un jour passé du calendrier. Tu peux le modifier, mais pas le supprimer.");
      }
    }
    if (ids.length <= 50) throw new Error("Il faut garder au moins 50 personnages pour que le jeu reste intéressant.");

    const nouveauxTextes = Object.assign({}, textes);
    const fichiers = [];
    nouveauxTextes[FICHIER_PERSONNAGES] = texteSansFiche(textes[FICHIER_PERSONNAGES], identifiant);
    fichiers.push({ chemin: FICHIER_PERSONNAGES, texte: nouveauxTextes[FICHIER_PERSONNAGES] });
    if (position >= 0) {
      nouveauxTextes[FICHIER_CALENDRIER] = calendrierSans(textes[FICHIER_CALENDRIER], identifiant);
      fichiers.push({ chemin: FICHIER_CALENDRIER, texte: nouveauxTextes[FICHIER_CALENDRIER] });
    }
    const { entete, images } = separerImagesJs(textes[FICHIER_IMAGES]);
    if (images[identifiant]) {
      delete images[identifiant];
      nouveauxTextes[FICHIER_IMAGES] = imagesJsEcrit(entete, images);
      fichiers.push({ chemin: FICHIER_IMAGES, texte: nouveauxTextes[FICHIER_IMAGES] });
      fichiers.push({ chemin: "images/personnages/" + identifiant + ".jpg", supprimer: true });
    }
    verifierAvantEnvoi(nouveauxTextes, f => {
      if (f.PERSONNAGES.some(p => p.id === identifiant) || f.CALENDRIER.includes(identifiant) || f.PERSONNAGES.length !== ids.length - 1) {
        throw new Error("La relecture après suppression ne correspond pas : rien n'a été envoyé.");
      }
    });
    await envoyer("Admin : suppression de " + (fenetre.PERSONNAGES.find(p => p.id === identifiant) || {}).nom, fichiers, version);
  }

  async function ajouterGroupe(nom) {
    const { version, textes, fenetre } = await lireTousLesFichiers();
    const nouveauxTextes = Object.assign({}, textes);
    nouveauxTextes[FICHIER_CONSTANTES] = constantesAvecGroupe(textes[FICHIER_CONSTANTES], nom, fenetre.CRITERES);
    verifierAvantEnvoi(nouveauxTextes, f => {
      if (!f.CRITERES.groupes.includes(nettoyer(nom))) throw new Error("Le groupe ne figure pas dans la relecture : rien n'a été envoyé.");
    });
    await envoyer("Admin : nouveau groupe " + nettoyer(nom), [{ chemin: FICHIER_CONSTANTES, texte: nouveauxTextes[FICHIER_CONSTANTES] }], version);
  }

  // Remplace les données de la page par celles de GitHub (les plus récentes, même si le site n'a pas encore fini de se mettre à jour).
  async function charger() {
    const { fenetre } = await lireTousLesFichiers();
    window.CRITERES = fenetre.CRITERES;
    window.PERSONNAGES = fenetre.PERSONNAGES;
    window.CALENDRIER = fenetre.CALENDRIER;
    window.IMAGES = fenetre.IMAGES;
    window.DATE_LANCEMENT = fenetre.DATE_LANCEMENT;
  }

  // Vérifie qu'une clé GitHub permet de lire le projet (la permission d'écriture ne peut être vérifiée qu'en écrivant).
  async function verifierJeton(candidat) {
    const ancien = jeton;
    jeton = candidat;
    try {
      await appelGithub("GET", "/git/ref/heads/" + BRANCHE);
    } catch (erreur) {
      jeton = ancien;
      throw erreur;
    }
  }

  window.DEPOT_GITHUB = {
    definirJeton: valeur => { jeton = valeur; },
    verifierJeton,
    charger,
    enregistrer,
    supprimer,
    ajouterGroupe,
    // pour les essais en local (voir admin.js : adresse « ?depot-test= ») et pour les tests automatiques
    _changerAdresse: adresse => { adresseApi = adresse; },
    _pour_les_tests: { trouverFiches, serialiserFiche, texteAvecFiche, texteSansFiche, calendrierAvec, calendrierSans, constantesAvecGroupe, validerFiche, separerImagesJs, imagesJsEcrit, evaluer }
  };
})();
