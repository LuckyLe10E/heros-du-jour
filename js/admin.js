// Le panneau admin de Héros du Jour : la page qui parle au petit serveur local (outils/serveur-admin.py).
// Elle permet de modifier ou supprimer un personnage, d'en ajouter, et de changer son image.
// Rien ici n'est utilisé par le vrai jeu : ce fichier ne sert que sur l'ordinateur de Luca.

(function () {
  let CRIT = window.CRITERES;   // (remplacé par les données de GitHub dans la version en ligne)
  const RARETES_APERCU = [["commune", "Commune"], ["rare", "Rare"], ["legendaire", "Légendaire"]];
  const CADRAGE_PAR_DEFAUT = "50% 20%";

  const $ = id => document.getElementById(id);

  function el(balise, classe, texte) {
    const e = document.createElement(balise);
    if (classe) e.className = classe;
    if (texte !== undefined) e.textContent = texte;
    return e;
  }

  // ---------------------------------------------------------------------------------------------------------------
  // L'état de ce qu'on est en train de modifier
  // ---------------------------------------------------------------------------------------------------------------

  let etat = null;   // null = aucun personnage ouvert

  function ouvrirEtat(personnage, nouveau) {
    const brouillon = personnage ? JSON.parse(JSON.stringify(personnage)) : {
      id: "", nom: "", autresNoms: [], univers: CRIT.univers[0], camp: CRIT.camps[0], genre: CRIT.genres[0],
      espece: CRIT.especes[0], pouvoirs: [], groupes: [], annee: new Date().getFullYear(), oeuvre: "", indice: "", description: ""
    };
    const image = window.IMAGES[brouillon.id];
    etat = {
      nouveau,
      idOriginal: nouveau ? null : brouillon.id,
      original: JSON.stringify(brouillon),
      brouillon,
      idManuel: !nouveau,
      imageNouvelle: null,                         // { blob, urlLocale, source } : une image choisie mais pas encore enregistrée
      imageRetiree: false,
      cadrage: image && image.cadrage ? image.cadrage : CADRAGE_PAR_DEFAUT,
      cadrageOriginal: image && image.cadrage ? image.cadrage : CADRAGE_PAR_DEFAUT,
      rarete: "rare",
      champs: {}
    };
  }

  function aDesChangements() {
    if (!etat) return false;
    return JSON.stringify(etat.brouillon) !== etat.original || etat.imageNouvelle !== null || etat.imageRetiree || etat.cadrage !== etat.cadrageOriginal;
  }

  function imageActuelle() {
    if (etat.imageNouvelle) return etat.imageNouvelle.urlLocale;
    if (etat.imageRetiree || etat.nouveau) return null;
    const enregistree = window.IMAGES[etat.idOriginal];
    return enregistree ? enregistree.fichier : null;
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Messages et appels au serveur
  // ---------------------------------------------------------------------------------------------------------------

  let minuteurMessage = null;

  function dire(texte, type) {
    const boite = $("message");
    boite.textContent = texte;
    boite.className = "message" + (type ? " " + type : "");
    boite.hidden = false;
    clearTimeout(minuteurMessage);
    minuteurMessage = setTimeout(() => { boite.hidden = true; }, type === "erreur" ? 9000 : 4000);
  }

  $("message").addEventListener("click", () => { $("message").hidden = true; });

  async function appeler(chemin, corps, requete, type) {
    let reponse;
    try {
      reponse = await fetch(chemin + (requete || ""), {
        method: "POST",
        headers: { "X-Admin": "1", "Content-Type": type || "application/json" },
        body: corps instanceof Blob ? corps : JSON.stringify(corps || {})
      });
    } catch (erreur) {
      throw new Error("Le serveur du panneau ne répond plus. Relance « Lancer-admin.bat ».");
    }
    let donnees = {};
    try { donnees = await reponse.json(); } catch (erreur) { /* réponse vide */ }
    if (!reponse.ok) throw new Error(donnees.erreur || "Erreur " + reponse.status);
    return donnees;
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Deux façons d'enregistrer :
  //  - le panneau lancé sur l'ordinateur (« Lancer-admin.bat ») parle au petit serveur local (outils/serveur-admin.py) ;
  //  - le panneau en ligne parle directement à GitHub (js/admin-depot.js), après connexion Google (js/admin-acces.js).
  // ---------------------------------------------------------------------------------------------------------------

  const parametres = new URLSearchParams(location.search);
  const enLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const surServeurLocal = enLocal && location.port === "8125";
  const adresseDeTest = enLocal ? parametres.get("depot-test") : null;   // pour les essais automatiques avec un faux GitHub
  const modeGithub = !surServeurLocal;

  const moteurLocal = {
    async enregistrer(o) {
      await appeler("/api/personnage", { personnage: o.fiche, nouveau: o.nouveau });
      if (o.imageNouvelle) {
        await appeler("/api/image", o.imageNouvelle.blob, "?id=" + encodeURIComponent(o.fiche.id) + "&cadrage=" + encodeURIComponent(o.cadrage)
          + "&source=" + encodeURIComponent(o.imageNouvelle.source), "image/jpeg");
      } else if (o.imageRetiree) {
        await appeler("/api/retirer-image", {}, "?id=" + encodeURIComponent(o.fiche.id));
      } else if (o.cadrage !== o.cadrageOriginal && window.IMAGES[o.fiche.id]) {
        await appeler("/api/cadrage", {}, "?id=" + encodeURIComponent(o.fiche.id) + "&cadrage=" + encodeURIComponent(o.cadrage));
      }
    },
    async supprimer(id) { await appeler("/api/supprimer", { id }); },
    async groupe(nom) { await appeler("/api/groupe", { nom }); },
    async recupererImage(adresse) {
      const reponse = await fetch("/api/recuperer?url=" + encodeURIComponent(adresse), { headers: { "X-Admin": "1" } });
      if (!reponse.ok) {
        let message = "Impossible de récupérer cette image.";
        try { message = (await reponse.json()).erreur || message; } catch (erreur) { /* pas de détail */ }
        throw new Error(message);
      }
      return reponse.blob();
    },
    suiteEnregistrement: ""
  };

  const moteurGithub = {
    async enregistrer(o) {
      const octets = o.imageNouvelle ? new Uint8Array(await o.imageNouvelle.blob.arrayBuffer()) : null;
      await window.DEPOT_GITHUB.enregistrer({
        fiche: o.fiche, nouveau: o.nouveau, retirerImage: o.imageRetiree, cadrage: o.cadrage,
        image: octets ? { octets, source: o.imageNouvelle.source } : null
      });
    },
    async supprimer(id) { await window.DEPOT_GITHUB.supprimer(id); },
    async groupe(nom) { await window.DEPOT_GITHUB.ajouterGroupe(nom); },
    async recupererImage(adresse) {
      let reponse;
      try {
        reponse = await fetch(adresse);
      } catch (erreur) {
        throw new Error("Ce site ne laisse pas récupérer son image depuis ici. Copie l'image (clic droit → Copier l'image) puis colle-la avec Ctrl+V, ou enregistre-la et choisis le fichier.");
      }
      if (!reponse.ok) throw new Error("Impossible de récupérer cette image.");
      return reponse.blob();
    },
    suiteEnregistrement: " Le site sera à jour dans environ une minute."
  };

  const moteur = modeGithub ? moteurGithub : moteurLocal;

  // ---------------------------------------------------------------------------------------------------------------
  // La liste à gauche
  // ---------------------------------------------------------------------------------------------------------------

  function afficherListe() {
    const recherche = simplifier($("recherche").value);
    const theme = $("filtre-theme").value;
    const sansImage = $("filtre-sans-image").checked;
    const liste = $("liste");
    liste.textContent = "";

    const gardes = window.PERSONNAGES.filter(p =>
      (!theme || p.univers === theme)
      && (!sansImage || !window.IMAGES[p.id])
      && (!recherche || simplifier([p.nom, p.id].concat(p.autresNoms).join(" ")).includes(recherche)));

    gardes.forEach(p => {
      const ligne = el("li");
      const bouton = el("button", "ligne-perso " + classeDuTheme(p.univers));
      bouton.type = "button";
      if (etat && !etat.nouveau && etat.idOriginal === p.id) bouton.setAttribute("aria-current", "true");
      const mini = el("span", "mini");
      const image = window.IMAGES[p.id];
      if (image) {
        const img = el("img");
        img.src = image.fichier;
        img.alt = "";
        img.loading = "lazy";
        mini.appendChild(img);
      } else {
        mini.textContent = "—";
        mini.title = "Pas d'image";
      }
      bouton.appendChild(mini);
      bouton.appendChild(el("span", "nom", p.nom));
      bouton.appendChild(el("span", "theme", p.univers));
      bouton.addEventListener("click", () => choisir(p.id));
      ligne.appendChild(bouton);
      liste.appendChild(ligne);
    });

    if (!gardes.length) liste.appendChild(el("li", "liste-vide", "Aucun personnage ne correspond."));
    const avecImage = window.PERSONNAGES.filter(p => window.IMAGES[p.id]).length;
    $("compteur").textContent = window.PERSONNAGES.length + " personnages · " + avecImage + " avec image";
  }

  function remplirFiltreTheme() {
    const select = $("filtre-theme");
    select.appendChild(new Option("Tous les thèmes", ""));
    CRIT.univers.forEach(u => select.appendChild(new Option(u, u)));
  }

  function confirmerAbandon() {
    return !aDesChangements() || window.confirm("Tu as des changements pas encore enregistrés. Les abandonner ?");
  }

  function choisir(id) {
    if (!confirmerAbandon()) return;
    const personnage = window.PERSONNAGES.find(p => p.id === id);
    if (!personnage) return;
    ouvrirEtat(personnage, false);
    history.replaceState(null, "", "#" + encodeURIComponent(id));
    construireEditeur();
    afficherListe();
    window.scrollTo({ top: 0 });
  }

  function nouveauPersonnage() {
    if (!confirmerAbandon()) return;
    ouvrirEtat(null, true);
    history.replaceState(null, "", location.pathname);
    construireEditeur();
    afficherListe();
    etat.champs.nom.focus();
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Les règles de vérification (les mêmes que celles du serveur, pour prévenir avant d'enregistrer)
  // ---------------------------------------------------------------------------------------------------------------

  function nettoyerTexte(t) {
    return String(t || "").replace(/\s+/g, " ").trim();
  }

  function fabriquerId(nom) {
    return simplifier(nom).replace(/ /g, "-").slice(0, 40).replace(/^-+|-+$/g, "");
  }

  function fichePropre() {
    const b = etat.brouillon;
    const fiche = {
      id: b.id,
      nom: nettoyerTexte(b.nom),
      autresNoms: b.autresNoms.map(nettoyerTexte).filter(Boolean),
      univers: b.univers, camp: b.camp, genre: b.genre, espece: b.espece,
      pouvoirs: b.pouvoirs.slice(), groupes: b.groupes.slice(),
      annee: Number(b.annee),
      oeuvre: nettoyerTexte(b.oeuvre),
      indice: nettoyerTexte(b.indice),
      description: nettoyerTexte(b.description)
    };
    if (nettoyerTexte(b.averifier)) fiche.averifier = nettoyerTexte(b.averifier);
    return fiche;
  }

  function trouverProblemes() {
    const f = fichePropre();
    const problemes = [];
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.id) || f.id.length > 40) problemes.push("Identifiant : lettres minuscules sans accent, chiffres et tirets (il se remplit tout seul d'après le nom).");
    else if (etat.nouveau && window.PERSONNAGES.some(p => p.id === f.id)) problemes.push("Un personnage a déjà cet identifiant (« " + f.id + " ») : change le nom ou l'identifiant.");
    if (!f.nom || f.nom.length > 60) problemes.push("Nom : à remplir (60 caractères maximum).");
    if (f.autresNoms.length > 12 || f.autresNoms.some(a => a.length > 60)) problemes.push("Autres noms : 12 maximum, 60 caractères chacun.");
    if (!f.pouvoirs.length) problemes.push("Pouvoirs : choisis au moins une valeur (ou « Aucun »).");
    if (!f.groupes.length) problemes.push("Groupes : choisis au moins une valeur (ou « Aucun »).");
    if (!Number.isInteger(f.annee) || f.annee < 1700 || f.annee > new Date().getFullYear() + 1) problemes.push("Année : un nombre entre 1700 et l'année prochaine.");
    if (!f.oeuvre) problemes.push("Œuvre : à remplir (le titre de la première apparition).");
    if (f.indice.length < 5 || f.indice.length > 300) problemes.push("Indice : entre 5 et 300 caractères (là : " + f.indice.length + ").");
    if (f.description.length < 40 || f.description.length > 2500) problemes.push("Description : entre 40 et 2 500 caractères (là : " + f.description.length + ").");
    if (etat.nouveau && !etat.imageNouvelle) problemes.push("Image : pas obligatoire, mais sans image la carte garde sa silhouette.");
    return problemes;
  }

  function problemesBloquants(problemes) {
    return problemes.filter(p => !p.startsWith("Image :"));
  }

  // ---------------------------------------------------------------------------------------------------------------
  // L'éditeur
  // ---------------------------------------------------------------------------------------------------------------

  function champ(etiquette, controle, aide) {
    const bloc = el("label", "champ");
    bloc.appendChild(el("span", "etiquette", etiquette));
    bloc.appendChild(controle);
    if (aide) bloc.appendChild(el("span", "aide", aide));
    return bloc;
  }

  function creerSelect(cle, valeurs) {
    const select = el("select");
    valeurs.forEach(v => select.appendChild(new Option(v, v)));
    select.value = etat.brouillon[cle];
    select.addEventListener("change", () => { etat.brouillon[cle] = select.value; apresChangement(); });
    etat.champs[cle] = select;
    return select;
  }

  function creerTexte(cle, type) {
    const input = el("input");
    input.type = type || "text";
    input.value = etat.brouillon[cle] === undefined ? "" : etat.brouillon[cle];
    input.addEventListener("input", () => {
      etat.brouillon[cle] = type === "number" ? Number(input.value) : input.value;
      if (cle === "nom" && etat.nouveau && !etat.idManuel) {
        etat.brouillon.id = fabriquerId(input.value);
        etat.champs.id.value = etat.brouillon.id;
      }
      if (cle === "id") etat.idManuel = true;
      apresChangement();
    });
    etat.champs[cle] = input;
    return input;
  }

  function creerZoneTexte(cle, lignes, minimum, maximum) {
    const zone = el("textarea");
    zone.rows = lignes;
    zone.value = etat.brouillon[cle] || "";
    const compteur = el("span", "compteur");
    const maj = () => {
      const n = nettoyerTexte(zone.value).length;
      compteur.textContent = n + " caractères (de " + minimum + " à " + maximum + ")";
    };
    zone.addEventListener("input", () => { etat.brouillon[cle] = zone.value; maj(); apresChangement(); });
    maj();
    etat.champs[cle] = zone;
    const boite = el("div");
    boite.style.display = "grid";
    boite.appendChild(zone);
    boite.appendChild(compteur);
    return boite;
  }

  // Une rangée de pastilles à cocher (pouvoirs, groupes). « Aucun » ne se mélange avec rien d'autre.
  function creerPastilles(cle, valeurs) {
    const boite = el("div", "pastilles");
    const maj = () => {
      boite.querySelectorAll(".pastille").forEach(b => b.setAttribute("aria-pressed", String(etat.brouillon[cle].includes(b.dataset.valeur))));
    };
    valeurs.forEach(valeur => {
      const b = el("button", "pastille", valeur);
      b.type = "button";
      b.dataset.valeur = valeur;
      b.addEventListener("click", () => {
        const liste = etat.brouillon[cle];
        if (liste.includes(valeur)) {
          etat.brouillon[cle] = liste.filter(v => v !== valeur);
        } else if (valeur === "Aucun") {
          etat.brouillon[cle] = ["Aucun"];
        } else {
          etat.brouillon[cle] = liste.filter(v => v !== "Aucun").concat(valeur);
        }
        maj();
        apresChangement();
      });
      boite.appendChild(b);
    });
    maj();
    return boite;
  }

  function construireEditeur() {
    const racine = $("editeur");
    racine.textContent = "";
    if (!etat) return;
    const b = etat.brouillon;

    // --- en-tête
    const tete = el("div", "editeur-tete");
    tete.appendChild(el("h2", "", etat.nouveau ? "Nouveau personnage" : b.nom));
    tete.appendChild(el("span", "info-calendrier", texteCalendrier()));
    racine.appendChild(tete);

    const corps = el("div", "editeur-corps");
    const formulaire = el("div", "formulaire");

    // --- identité
    const identite = el("fieldset", "groupe-champs");
    identite.appendChild(el("legend", "", "Identité"));
    const rangeeNom = el("div", "rangee");
    rangeeNom.appendChild(champ("Nom affiché", creerTexte("nom")));
    const champId = creerTexte("id");
    champId.readOnly = !etat.nouveau;
    rangeeNom.appendChild(champ("Identifiant", champId, etat.nouveau ? "Se remplit tout seul. Ne pourra plus changer ensuite." : "Ne change jamais (les sauvegardes des joueurs en dépendent)."));
    identite.appendChild(rangeeNom);
    const autres = el("input");
    autres.type = "text";
    autres.value = b.autresNoms.join(", ");
    autres.addEventListener("input", () => { b.autresNoms = autres.value.split(",").map(s => s.trim()).filter(Boolean); apresChangement(); });
    etat.champs.autresNoms = autres;
    identite.appendChild(champ("Autres noms (pour la recherche)", autres, "Séparés par des virgules. Ex : Peter Parker, L'Homme-Araignée"));
    formulaire.appendChild(identite);

    // --- classement (les 7 critères du jeu)
    const classement = el("fieldset", "groupe-champs");
    classement.appendChild(el("legend", "", "Les critères du jeu"));
    const rangee1 = el("div", "rangee");
    rangee1.appendChild(champ("Thème", creerSelect("univers", CRIT.univers), "D'où il vient : la toute première apparition."));
    rangee1.appendChild(champ("Camp", creerSelect("camp", CRIT.camps)));
    rangee1.appendChild(champ("Genre", creerSelect("genre", CRIT.genres)));
    rangee1.appendChild(champ("Espèce", creerSelect("espece", CRIT.especes)));
    classement.appendChild(rangee1);

    const blocPouvoirs = el("div", "champ");
    blocPouvoirs.appendChild(el("span", "etiquette", "Pouvoirs (un ou plusieurs)"));
    blocPouvoirs.appendChild(creerPastilles("pouvoirs", CRIT.pouvoirs));
    classement.appendChild(blocPouvoirs);

    const blocGroupes = el("div", "champ");
    blocGroupes.appendChild(el("span", "etiquette", "Groupes (un ou plusieurs)"));
    const pastillesGroupes = creerPastilles("groupes", CRIT.groupes);
    blocGroupes.appendChild(pastillesGroupes);
    const ajout = el("div", "ajout-groupe");
    const nouveauGroupe = el("input");
    nouveauGroupe.type = "text";
    nouveauGroupe.placeholder = "Un groupe qui n'est pas dans la liste ? Écris son nom";
    nouveauGroupe.maxLength = 40;
    const boutonGroupe = el("button", "bouton", "Ajouter ce groupe");
    boutonGroupe.type = "button";
    boutonGroupe.addEventListener("click", async () => {
      const nom = nettoyerTexte(nouveauGroupe.value);
      if (!nom) return;
      try {
        await moteur.groupe(nom);
        CRIT.groupes.splice(CRIT.groupes.length - 1, 0, nom);   // comme le serveur : avant « Aucun »
        etat.brouillon.groupes = etat.brouillon.groupes.filter(g => g !== "Aucun").concat(nom);
        dire("Groupe « " + nom + " » ajouté à la liste.", "reussi");
        construireEditeur();   // la liste des groupes se reconstruit avec le nouveau
      } catch (erreur) {
        dire(erreur.message, "erreur");
      }
    });
    ajout.appendChild(nouveauGroupe);
    ajout.appendChild(boutonGroupe);
    blocGroupes.appendChild(ajout);
    classement.appendChild(blocGroupes);

    const rangee2 = el("div", "rangee");
    rangee2.appendChild(champ("Année de première apparition", creerTexte("annee", "number")));
    rangee2.appendChild(champ("Œuvre d'origine", creerTexte("oeuvre"), "Le titre de la première apparition."));
    classement.appendChild(rangee2);
    formulaire.appendChild(classement);

    // --- textes
    const textes = el("fieldset", "groupe-champs");
    textes.appendChild(el("legend", "", "Textes"));
    textes.appendChild(champ("Indice (montré après quelques essais ratés)", creerZoneTexte("indice", 2, 5, 300), "Il ne doit rien trahir."));
    textes.appendChild(champ("Description (la fiche, montrée à la fin de la partie)", creerZoneTexte("description", 8, 40, 2500), "La carte utilise la première et la dernière phrase."));
    textes.appendChild(champ("À vérifier (facultatif)", creerTexte("averifier"), "Un doute à trancher plus tard. N'apparaît pas dans le jeu."));
    formulaire.appendChild(textes);

    // --- problèmes et boutons
    const liste = el("ul", "problemes");
    liste.id = "problemes";
    formulaire.appendChild(liste);

    const actions = el("div", "actions");
    const enregistrer = el("button", "bouton bouton-principal", etat.nouveau ? "Ajouter ce personnage" : "Enregistrer les changements");
    enregistrer.type = "button";
    enregistrer.id = "bouton-enregistrer";
    enregistrer.addEventListener("click", enregistrerTout);
    actions.appendChild(enregistrer);
    const annuler = el("button", "bouton", "Annuler les changements");
    annuler.type = "button";
    annuler.id = "bouton-annuler";
    annuler.addEventListener("click", () => {
      if (!confirmerAbandon()) return;
      if (etat.nouveau) { etat = null; construireEditeur(); afficherListe(); return; }
      choisirSansDemander(etat.idOriginal);
    });
    actions.appendChild(annuler);
    actions.appendChild(el("span", "espace"));
    if (!etat.nouveau) {
      const supprimer = el("button", "bouton bouton-danger", "Supprimer ce personnage");
      supprimer.type = "button";
      supprimer.addEventListener("click", supprimerPersonnage);
      actions.appendChild(supprimer);
    }
    formulaire.appendChild(actions);
    corps.appendChild(formulaire);

    // --- colonne de droite : la vraie carte + l'image
    const droite = el("div", "colonne-apercu");
    const apercu = el("div", "apercu-carte");
    apercu.id = "apercu-carte";
    droite.appendChild(apercu);
    const rarete = el("div", "choix-rarete");
    RARETES_APERCU.forEach(([cle, nom]) => {
      const bouton = el("button", "pastille", nom);
      bouton.type = "button";
      bouton.setAttribute("aria-pressed", String(etat.rarete === cle));
      bouton.addEventListener("click", () => {
        etat.rarete = cle;
        rarete.querySelectorAll(".pastille").forEach(x => x.setAttribute("aria-pressed", "false"));
        bouton.setAttribute("aria-pressed", "true");
        afficherApercu();
      });
      rarete.appendChild(bouton);
    });
    droite.appendChild(rarete);
    droite.appendChild(creerZoneImage());
    corps.appendChild(droite);

    racine.appendChild(corps);
    apresChangement();
  }

  function choisirSansDemander(id) {
    etat = null;
    choisir(id);
  }

  function texteCalendrier() {
    if (etat.nouveau) return "Sera ajouté à la fin du calendrier : jour n° " + (window.CALENDRIER.length + 1);
    const position = window.CALENDRIER.indexOf(etat.idOriginal);
    if (position < 0) return "Pas dans le calendrier";
    const numero = joursEntre(window.DATE_LANCEMENT, new Date()) + 1;
    const date = dateCourteEnFrancais(dateDepuisTexte(window.DATE_LANCEMENT, position));
    const statut = position + 1 <= numero ? " (déjà passé : ne peut plus être supprimé)" : " (à venir)";
    return "Personnage du jour n° " + (position + 1) + " : " + date + statut;
  }

  // ---------------------------------------------------------------------------------------------------------------
  // La carte d'aperçu (la VRAIE carte du jeu, fabriquée par js/carte.js) et la zone d'image
  // ---------------------------------------------------------------------------------------------------------------

  function copieAffichable() {
    const b = etat.brouillon;
    return {
      id: b.id || "nouveau-personnage",
      nom: nettoyerTexte(b.nom) || "Nom du personnage",
      autresNoms: b.autresNoms,
      univers: b.univers, camp: b.camp, genre: b.genre, espece: b.espece,
      pouvoirs: b.pouvoirs.length ? b.pouvoirs : ["Aucun"],
      groupes: b.groupes.length ? b.groupes : ["Aucun"],
      annee: Number(b.annee) || 2000,
      oeuvre: nettoyerTexte(b.oeuvre) || "Œuvre",
      indice: nettoyerTexte(b.indice),
      description: nettoyerTexte(b.description) || "Une première phrase. Une dernière phrase."
    };
  }

  function afficherApercu() {
    const zone = $("apercu-carte");
    if (!zone) return;
    zone.textContent = "";
    const copie = copieAffichable();
    const liste = window.PERSONNAGES;
    const position = etat.nouveau ? -1 : liste.findIndex(p => p.id === etat.idOriginal);
    const ancien = position >= 0 ? liste[position] : null;
    const imageAvant = window.IMAGES[copie.id];
    if (position >= 0) liste[position] = copie; else liste.push(copie);   // la carte cherche le personnage dans la liste du jeu
    try {
      const url = imageActuelle();
      if (url) window.IMAGES[copie.id] = { fichier: url, cadrage: etat.cadrage }; else delete window.IMAGES[copie.id];
      const scene = creerCarteDom({ id: copie.id, rarete: etat.rarete, essais: 3, date: "2026-10-14", numero: 1 }, { retournee: true });
      zone.appendChild(scene);
    } catch (erreur) {
      zone.textContent = "Aperçu impossible pour l'instant : " + erreur.message;
    } finally {
      if (position >= 0) liste[position] = ancien; else liste.pop();
      if (imageAvant) window.IMAGES[copie.id] = imageAvant; else delete window.IMAGES[copie.id];
    }
  }

  function creerZoneImage() {
    const zone = el("div", "zone-image");
    zone.id = "zone-image";

    const cadre = el("div", "cadre-image");
    cadre.id = "cadre-image";
    zone.appendChild(cadre);

    const reglageX = creerReglage("Gauche-droite", 0, 100, () => lireCadrage()[0], valeur => ecrireCadrage(valeur, lireCadrage()[1]));
    const reglageY = creerReglage("Haut-bas", 0, 100, () => lireCadrage()[1], valeur => ecrireCadrage(lireCadrage()[0], valeur));
    zone.appendChild(reglageX);
    zone.appendChild(reglageY);
    zone.appendChild(el("p", "aide", "Les curseurs décident de la partie de l'image visible dans le cadre large de la carte."));

    const fichier = el("input");
    fichier.type = "file";
    fichier.accept = "image/*";
    fichier.hidden = true;
    fichier.addEventListener("change", async () => {
      if (fichier.files[0]) await utiliserImage(fichier.files[0], fichier.files[0].name);
      fichier.value = "";
    });
    const choisirFichier = el("button", "bouton", "Choisir un fichier…");
    choisirFichier.type = "button";
    choisirFichier.addEventListener("click", () => fichier.click());
    zone.appendChild(choisirFichier);
    zone.appendChild(fichier);
    zone.appendChild(el("p", "aide", "Ou colle une image copiée (Ctrl+V), ou glisse-la ici."));

    const ligneUrl = el("div", "ligne-url");
    const url = el("input");
    url.type = "url";
    url.placeholder = "Adresse d'une image (https://…)";
    const recuperer = el("button", "bouton", "Récupérer");
    recuperer.type = "button";
    const lancer = async () => { if (url.value.trim()) { await utiliserAdresse(url.value.trim()); url.value = ""; } };
    recuperer.addEventListener("click", lancer);
    url.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); lancer(); } });
    ligneUrl.appendChild(url);
    ligneUrl.appendChild(recuperer);
    zone.appendChild(ligneUrl);

    const retirer = el("button", "bouton bouton-danger", "Retirer l'image");
    retirer.type = "button";
    retirer.id = "bouton-retirer-image";
    retirer.addEventListener("click", () => {
      etat.imageNouvelle = null;
      etat.imageRetiree = !etat.nouveau && Boolean(window.IMAGES[etat.idOriginal]);
      apresChangement();
    });
    zone.appendChild(retirer);

    zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("survol"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("survol"));
    zone.addEventListener("drop", async e => {
      e.preventDefault();
      zone.classList.remove("survol");
      const fichiers = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith("image/"));
      if (fichiers.length) { await utiliserImage(fichiers[0], fichiers[0].name); return; }
      const liste = (e.dataTransfer.getData("text/uri-list") || "").split("\n").map(s => s.trim()).filter(s => s && !s.startsWith("#"));
      let adresse = liste[0];
      if (!adresse) {
        const html = e.dataTransfer.getData("text/html");
        const trouve = html && /<img[^>]+src=["']([^"']+)["']/i.exec(html);
        adresse = trouve ? trouve[1] : "";
      }
      if (adresse) await utiliserAdresse(adresse);
      else dire("Je n'ai rien reconnu dans ce que tu as glissé. Essaie « Copier l'image » puis Ctrl+V.", "erreur");
    });

    return zone;
  }

  function creerReglage(nom, min, max, lire, ecrire) {
    const ligne = el("label", "reglage");
    ligne.appendChild(el("span", "", nom));
    const curseur = el("input");
    curseur.type = "range";
    curseur.min = min;
    curseur.max = max;
    curseur.value = lire();
    curseur.addEventListener("input", () => ecrire(Number(curseur.value)));
    curseur.dataset.reglage = nom;
    ligne.appendChild(curseur);
    return ligne;
  }

  function lireCadrage() {
    return etat.cadrage.split(" ").map(v => parseInt(v, 10));
  }

  function ecrireCadrage(x, y) {
    etat.cadrage = x + "% " + y + "%";
    majCadreImage();
    apresChangement();
  }

  function majCadreImage() {
    const cadre = $("cadre-image");
    if (!cadre) return;
    cadre.textContent = "";
    const url = imageActuelle();
    if (url) {
      const img = el("img");
      img.src = url;
      img.alt = "";
      img.style.objectPosition = etat.cadrage;
      img.addEventListener("error", () => { img.remove(); cadre.textContent = "Fichier d'image introuvable"; });
      cadre.appendChild(img);
    } else {
      cadre.textContent = "Pas d'image : la carte garde sa silhouette";
    }
    document.querySelectorAll("#zone-image input[type=range]").forEach((c, i) => { c.value = lireCadrage()[i]; });
    const retirer = $("bouton-retirer-image");
    if (retirer) retirer.disabled = !url;
  }

  // Réduit l'image (700 × 900 pixels maximum) et la transforme en JPEG léger, comme toutes les autres images du jeu.
  async function versJpeg(blob) {
    const bitmap = await createImageBitmap(blob);
    const echelle = Math.min(1, 700 / bitmap.width, 900 / bitmap.height);
    const canevas = document.createElement("canvas");
    canevas.width = Math.max(1, Math.round(bitmap.width * echelle));
    canevas.height = Math.max(1, Math.round(bitmap.height * echelle));
    const ctx = canevas.getContext("2d");
    ctx.fillStyle = "#ece7da";   // fond clair pour les images transparentes
    ctx.fillRect(0, 0, canevas.width, canevas.height);
    ctx.drawImage(bitmap, 0, 0, canevas.width, canevas.height);
    return new Promise(resolve => canevas.toBlob(resolve, "image/jpeg", 0.85));
  }

  async function utiliserImage(blob, source) {
    if (!etat) { dire("Ouvre d'abord un personnage, ou clique sur « Nouveau personnage ».", "erreur"); return; }
    try {
      const jpeg = await versJpeg(blob);
      if (etat.imageNouvelle) URL.revokeObjectURL(etat.imageNouvelle.urlLocale);
      etat.imageNouvelle = { blob: jpeg, urlLocale: URL.createObjectURL(jpeg), source: source || "" };
      etat.imageRetiree = false;
      etat.cadrage = CADRAGE_PAR_DEFAUT;
      apresChangement();
      dire("Image prête (" + Math.round(jpeg.size / 1024) + " Ko). Pense à enregistrer.", "reussi");
    } catch (erreur) {
      dire("Cette image n'est pas lisible. Essaie un fichier jpg, png ou webp.", "erreur");
    }
  }

  async function utiliserAdresse(adresse) {
    if (!/^https?:\/\//i.test(adresse)) { dire("L'adresse doit commencer par https://", "erreur"); return; }
    try {
      await utiliserImage(await moteur.recupererImage(adresse), adresse);
    } catch (erreur) {
      dire(erreur.message, "erreur");
    }
  }

  // Coller une image copiée (Ctrl+V), n'importe où dans la page
  document.addEventListener("paste", async e => {
    if (!etat) return;
    const fichiers = Array.from((e.clipboardData && e.clipboardData.files) || []).filter(f => f.type.startsWith("image/"));
    if (fichiers.length) {
      e.preventDefault();
      await utiliserImage(fichiers[0], "image collée");
      return;
    }
    const cible = e.target;
    const dansUnChamp = cible && (cible.tagName === "INPUT" || cible.tagName === "TEXTAREA");
    const texte = e.clipboardData && e.clipboardData.getData("text");
    if (!dansUnChamp && texte && /^https?:\/\/\S+$/i.test(texte.trim())) {
      e.preventDefault();
      await utiliserAdresse(texte.trim());
    }
  });

  // ---------------------------------------------------------------------------------------------------------------
  // Mise à jour de l'écran après chaque changement
  // ---------------------------------------------------------------------------------------------------------------

  function apresChangement() {
    if (!etat) return;
    afficherApercu();
    majCadreImage();
    const problemes = trouverProblemes();
    const liste = $("problemes");
    if (liste) {
      liste.textContent = "";
      problemes.forEach(p => liste.appendChild(el("li", "", p)));
    }
    const bloquants = problemesBloquants(problemes);
    const enregistrer = $("bouton-enregistrer");
    if (enregistrer) enregistrer.disabled = bloquants.length > 0 || !aDesChangements();
    const annuler = $("bouton-annuler");
    if (annuler) annuler.disabled = !aDesChangements() && !etat.nouveau;
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Enregistrer, supprimer
  // ---------------------------------------------------------------------------------------------------------------

  async function enregistrerTout() {
    const bouton = $("bouton-enregistrer");
    bouton.disabled = true;
    const fiche = fichePropre();
    try {
      await moteur.enregistrer({
        fiche, nouveau: etat.nouveau, imageNouvelle: etat.imageNouvelle, imageRetiree: etat.imageRetiree,
        cadrage: etat.cadrage, cadrageOriginal: etat.cadrageOriginal
      });
      etat.original = JSON.stringify(etat.brouillon);   // plus rien à abandonner : on recharge la page avec les fichiers à jour
      etat.imageNouvelle = null;
      etat.imageRetiree = false;
      etat.cadrageOriginal = etat.cadrage;
      sessionStorage.setItem("admin-message", (etat.nouveau ? "« " + fiche.nom + " » a été ajouté (à la fin du calendrier)." : "« " + fiche.nom + " » est enregistré.") + moteur.suiteEnregistrement);
      location.hash = "#" + encodeURIComponent(fiche.id);
      location.reload();
    } catch (erreur) {
      dire(erreur.message, "erreur");
      apresChangement();
    }
  }

  async function supprimerPersonnage() {
    const nom = etat.brouillon.nom;
    const position = window.CALENDRIER.indexOf(etat.idOriginal);
    const texte = "Supprimer « " + nom + " » ?\n\n"
      + "• Sa fiche et son image seront retirées du jeu" + (position >= 0 ? " et du calendrier (les jours suivants seront décalés d'un jour)." : ".") + "\n"
      + "• Les numéros des cartes des personnages suivants dans l'album changeront.\n"
      + "• Les joueurs qui avaient cette carte la perdent.\n"
      + "• Une copie reste dans outils/sauvegardes/ au cas où.\n\n"
      + "Avant le lancement officiel c'est sans gros risque ; après, il vaut mieux modifier un personnage que le supprimer.";
    if (!window.confirm(texte)) return;
    try {
      await moteur.supprimer(etat.idOriginal);
      etat.original = JSON.stringify(etat.brouillon);
      etat.imageNouvelle = null; etat.imageRetiree = false; etat.cadrageOriginal = etat.cadrage;
      sessionStorage.setItem("admin-message", "« " + nom + " » est supprimé." + moteur.suiteEnregistrement);
      history.replaceState(null, "", location.pathname);
      location.reload();
    } catch (erreur) {
      dire(erreur.message, "erreur");
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Démarrage
  // ---------------------------------------------------------------------------------------------------------------

  window.addEventListener("beforeunload", e => {
    if (aDesChangements()) { e.preventDefault(); e.returnValue = ""; }
  });

  function lancerInterface() {
    CRIT = window.CRITERES;
    $("principal").hidden = false;
    if (modeGithub) {
      $("bouton-cle").hidden = false;
      $("bouton-deconnexion").hidden = false;
    }
    remplirFiltreTheme();
    $("recherche").addEventListener("input", afficherListe);
    $("filtre-theme").addEventListener("change", afficherListe);
    $("filtre-sans-image").addEventListener("change", afficherListe);
    $("bouton-nouveau").addEventListener("click", nouveauPersonnage);
    afficherListe();

    const idDansLAdresse = decodeURIComponent(location.hash.slice(1));
    if (idDansLAdresse && window.PERSONNAGES.some(p => p.id === idDansLAdresse)) {
      ouvrirEtat(window.PERSONNAGES.find(p => p.id === idDansLAdresse), false);
      construireEditeur();
      afficherListe();
      const courant = document.querySelector('.ligne-perso[aria-current="true"]');
      if (courant) courant.scrollIntoView({ block: "center" });
    }

    window.addEventListener("hashchange", () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id && (!etat || etat.idOriginal !== id) && window.PERSONNAGES.some(p => p.id === id)) choisir(id);
    });

    try {
      const message = sessionStorage.getItem("admin-message");
      if (message) { sessionStorage.removeItem("admin-message"); dire(message, "reussi"); }
    } catch (erreur) { /* pas grave */ }
  }

  async function demarrer() {
    if (!modeGithub) { lancerInterface(); return; }
    $("bouton-cle").addEventListener("click", () => window.ACCES_ADMIN.changerLaCle());
    const apresAcces = async () => {
      try {
        await window.DEPOT_GITHUB.charger();
        lancerInterface();
      } catch (erreur) {
        window.ACCES_ADMIN.erreur("Impossible de lire les fiches sur GitHub : " + erreur.message);
      }
    };
    if (adresseDeTest) {   // essai en local avec un faux GitHub : pas de connexion Google
      window.DEPOT_GITHUB._changerAdresse(adresseDeTest);
      window.DEPOT_GITHUB.definirJeton("test");
      await apresAcces();
      return;
    }
    window.ACCES_ADMIN.demarrer(apresAcces);
  }

  demarrer();
})();
