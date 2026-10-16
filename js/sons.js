// Les sons du jeu : tout est fabriqué par le navigateur (aucun fichier audio, aucun droit d'auteur).
// L'ambiance est « papier et bureau » : clic de stylo, bois feutré, tampon, glissement de papier, petites cloches.
//
//  - Studio : l'atelier qui fabrique les sons (oscillateurs, bruits filtrés, cloches, notes pincées…) et les envoie dans une console de mixage.
//  - SONS : le catalogue (une fonction par son : « clic », « victoire-rare », « theme-marvel »…).
//  - Musique : une petite musique d'ambiance jazz doux qui se joue toute seule, sans fin et sans répétition identique.
//  - Sons : ce que le jeu utilise (Sons.jouer("clic"), Sons.musiqueDemarrer(), Sons.regler({…})).
//
// Les navigateurs interdisent le son tant que le joueur n'a pas touché la page : il faut appeler Sons.reprendre() après un premier toucher.

(function () {
  // ---------------------------------------------------------------------------------------------------------------
  // Petits outils
  // ---------------------------------------------------------------------------------------------------------------

  const midiEnHertz = note => 440 * Math.pow(2, (note - 69) / 12);

  // ---------------------------------------------------------------------------------------------------------------
  // L'atelier
  // ---------------------------------------------------------------------------------------------------------------

  class Studio {
    // ctx : le contexte audio (réel, ou « hors ligne » pour les mesures) ; destination : où envoyer le son final.
    constructor(ctx, destination, reglages) {
      this.ctx = ctx;
      this.hauteur = 1;
      const r = reglages || {};

      this.busSons = ctx.createGain();
      this.busActif = this.busSons;   // où partent les sons en ce moment (change quand on joue un son à volume réduit)
      this.busMusique = ctx.createGain();
      this.baisseMusique = ctx.createGain();   // la musique baisse un peu pendant les grands moments (victoire, thème)
      this.volumeSons = ctx.createGain();
      this.volumeMusique = ctx.createGain();
      this.filtreDouceur = ctx.createBiquadFilter();
      this.filtreDouceur.type = "lowpass";
      this.filtreDouceur.Q.value = 0.5;
      this.melangeur = ctx.createGain();
      this.compresseur = ctx.createDynamicsCompressor();
      this.compresseur.threshold.value = -16;
      this.compresseur.knee.value = 14;
      this.compresseur.ratio.value = 4;
      this.compresseur.attack.value = 0.004;
      this.compresseur.release.value = 0.18;

      // Un peu de « salle » : une réverbération courte et sourde (comme un petit bureau)
      this.entreeSalle = ctx.createGain();
      this.salleActive = this.entreeSalle;
      this.salle = ctx.createConvolver();
      this.salle.buffer = this.fabriquerLaSalle(1.3, 2.6);
      this.sortieSalle = ctx.createGain();
      this.sortieSalle.gain.value = 0.55;

      this.busSons.connect(this.filtreDouceur);
      this.filtreDouceur.connect(this.volumeSons);
      this.volumeSons.connect(this.melangeur);
      this.busMusique.connect(this.baisseMusique);
      this.baisseMusique.connect(this.volumeMusique);
      this.volumeMusique.connect(this.melangeur);
      this.entreeSalle.connect(this.salle);
      this.salle.connect(this.sortieSalle);
      this.sortieSalle.connect(this.melangeur);
      this.melangeur.connect(this.compresseur);
      this.compresseur.connect(destination);

      this.regler({ volumeSons: r.volumeSons === undefined ? 0.8 : r.volumeSons, volumeMusique: r.volumeMusique === undefined ? 0.35 : r.volumeMusique,
                    hauteur: r.hauteur || 0, douceur: r.douceur === undefined ? 0.35 : r.douceur });

      // Un bruit blanc d'une seconde, réutilisé par tous les sons de papier
      const n = ctx.sampleRate;
      this.bruitBlanc = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = this.bruitBlanc.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.cachePincees = {};
    }

    // volumeSons, volumeMusique : 0 à 1 ; hauteur : en demi-tons (-6 à +6) ; douceur : 0 (brillant) à 1 (très feutré)
    regler(r) {
      if (r.volumeSons !== undefined) this.volumeSons.gain.value = r.volumeSons;
      if (r.volumeMusique !== undefined) this.volumeMusique.gain.value = r.volumeMusique;
      if (r.hauteur !== undefined) this.hauteur = Math.pow(2, r.hauteur / 12);
      if (r.douceur !== undefined) this.filtreDouceur.frequency.value = 18000 * Math.pow(0.12, r.douceur);   // 18 000 Hz → ~2 100 Hz
    }

    fabriquerLaSalle(duree, finesse) {
      const sr = this.ctx.sampleRate;
      const n = Math.floor(sr * duree);
      const tampon = this.ctx.createBuffer(2, n, sr);
      for (let c = 0; c < 2; c++) {
        const d = tampon.getChannelData(c);
        let lisse = 0;
        for (let i = 0; i < n; i++) {
          lisse = lisse * 0.6 + (Math.random() * 2 - 1) * 0.4;   // un peu sourd : moins d'aigus
          d[i] = lisse * Math.pow(1 - i / n, finesse);
        }
      }
      return tampon;
    }

    // Courbe de volume : monte vite (att), puis redescend doucement jusqu'au silence (dur)
    enveloppe(param, t, att, dur, pic) {
      param.setValueAtTime(0.0001, t);
      param.exponentialRampToValueAtTime(Math.max(pic, 0.0002), t + att);
      param.exponentialRampToValueAtTime(0.0001, t + att + dur);
    }

    // Branche une source vers la console, avec un peu de salle si on le demande
    envoyer(noeud, cible, salle) {
      noeud.connect(cible || this.busActif);
      if (salle > 0) {
        const envoi = this.ctx.createGain();
        envoi.gain.value = salle;
        noeud.connect(envoi);
        envoi.connect(cible === this.busMusique ? this.entreeSalle : this.salleActive);
      }
    }

    // Une note : f en Hz, fFin pour glisser vers une autre fréquence
    ton(o) {
      const ctx = this.ctx;
      const att = o.att === undefined ? 0.004 : o.att;
      const dur = o.dur === undefined ? 0.2 : o.dur;
      const osc = ctx.createOscillator();
      osc.type = o.type || "sine";
      osc.frequency.setValueAtTime(o.f * this.hauteur, o.t);
      if (o.fFin) osc.frequency.exponentialRampToValueAtTime(o.fFin * this.hauteur, o.t + att + dur);
      if (o.detune) osc.detune.value = o.detune;
      const g = ctx.createGain();
      this.enveloppe(g.gain, o.t, att, dur, o.pic === undefined ? 0.2 : o.pic);
      let sortie = osc;
      if (o.filtre) {
        const bq = ctx.createBiquadFilter();
        bq.type = "lowpass";
        bq.frequency.value = o.filtre;
        osc.connect(bq);
        sortie = bq;
      }
      sortie.connect(g);
      this.envoyer(g, o.cible, o.salle);
      osc.start(o.t);
      osc.stop(o.t + att + dur + 0.1);
    }

    // Un souffle de bruit filtré : du papier, un frottement, un petit « tac »
    bruit(o) {
      const ctx = this.ctx;
      const att = o.att === undefined ? 0.003 : o.att;
      const dur = o.dur === undefined ? 0.08 : o.dur;
      const src = ctx.createBufferSource();
      src.buffer = this.bruitBlanc;
      src.loop = true;
      const bq = ctx.createBiquadFilter();
      bq.type = o.type || "bandpass";
      bq.frequency.setValueAtTime(o.f * this.hauteur, o.t);
      if (o.fFin) bq.frequency.exponentialRampToValueAtTime(o.fFin * this.hauteur, o.t + att + dur);
      bq.Q.value = o.q === undefined ? 0.8 : o.q;
      const g = ctx.createGain();
      this.enveloppe(g.gain, o.t, att, dur, o.pic === undefined ? 0.2 : o.pic);
      src.connect(bq);
      bq.connect(g);
      this.envoyer(g, o.cible, o.salle);
      src.start(o.t, Math.random() * 0.5);
      src.stop(o.t + att + dur + 0.1);
    }

    // Un coup sourd (tampon, grosse caisse) : une note grave qui plonge
    coup(o) {
      this.ton({ f: o.f, fFin: o.fFin, t: o.t, att: 0.002, dur: o.dur, pic: o.pic, cible: o.cible, salle: o.salle });
    }

    // Une petite cloche (plusieurs notes superposées qui s'éteignent à des vitesses différentes)
    cloche(f, t, dur, pic, cible, salle) {
      const parties = [[1, 1, 1], [2.76, 0.45, 0.55], [5.4, 0.22, 0.32], [8.93, 0.1, 0.2]];
      parties.forEach(([rapport, force, vitesse]) => {
        this.ton({ f: f * rapport, t, att: 0.002, dur: dur * vitesse, pic: pic * force, cible, salle: salle === undefined ? 0.35 : salle });
      });
    }

    // Un bloc de bois (marimba doux)
    bois(f, t, dur, pic, cible, salle) {
      this.ton({ f, t, att: 0.002, dur, pic, cible, salle: salle === undefined ? 0.2 : salle });
      this.ton({ f: f * 3.93, t, att: 0.001, dur: dur * 0.18, pic: pic * 0.35, cible, salle: 0 });
      this.bruit({ t, dur: 0.012, f: Math.min(f * 4, 5000), q: 1.4, pic: pic * 0.18, cible });
    }

    // Une corde pincée (harpe, koto, guitare) : algorithme de Karplus-Strong
    pincee(f, t, dur, pic, o) {
      const ctx = this.ctx;
      const opt = o || {};
      const brillance = opt.brillance === undefined ? 0.5 : opt.brillance;
      const freq = f * this.hauteur;
      const cle = Math.round(freq) + "-" + dur + "-" + brillance;
      let tampon = this.cachePincees[cle];
      if (!tampon) {
        const sr = ctx.sampleRate;
        const n = Math.floor(sr * dur);
        tampon = ctx.createBuffer(1, n, sr);
        const d = tampon.getChannelData(0);
        const periode = Math.max(2, Math.round(sr / freq));
        const ligne = new Float32Array(periode);
        for (let i = 0; i < periode; i++) ligne[i] = Math.random() * 2 - 1;
        for (let passe = 0; passe < Math.round((1 - brillance) * 6); passe++) {   // moins de brillance = corde plus sourde
          for (let i = 0; i < periode; i++) ligne[i] = (ligne[i] + ligne[(i + 1) % periode]) / 2;
        }
        const amortissement = 0.9955 + brillance * 0.0035;
        let index = 0;
        let crete = 0;
        for (let i = 0; i < n; i++) {
          const courant = ligne[index];
          d[i] = courant;
          ligne[index] = amortissement * 0.5 * (courant + ligne[(index + 1) % periode]);
          index = (index + 1) % periode;
          if (Math.abs(courant) > crete) crete = Math.abs(courant);
        }
        for (let i = 0; i < n; i++) d[i] /= (crete || 1);
        this.cachePincees[cle] = tampon;
      }
      const src = ctx.createBufferSource();
      src.buffer = tampon;
      const g = ctx.createGain();
      g.gain.setValueAtTime(pic, t);
      g.gain.setValueAtTime(pic, t + dur - 0.12);
      g.gain.linearRampToValueAtTime(0.0001, t + dur - 0.01);
      let sortie = src;
      if (opt.distorsion) {
        const ws = ctx.createWaveShaper();
        const courbe = new Float32Array(1024);
        for (let i = 0; i < 1024; i++) courbe[i] = Math.tanh(((i / 1023) * 2 - 1) * opt.distorsion);
        ws.curve = courbe;
        src.connect(ws);
        sortie = ws;
      }
      sortie.connect(g);
      this.envoyer(g, opt.cible, opt.salle === undefined ? 0.2 : opt.salle);
      src.start(t);
    }

    // Une nappe : plusieurs notes tenues qui gonflent doucement (cordes, nappe de synthé)
    nappe(notes, t, dur, pic, o) {
      const ctx = this.ctx;
      const opt = o || {};
      const att = opt.att === undefined ? 0.25 : opt.att;
      notes.forEach(f => {
        [-7, 7].forEach(detune => {
          const osc = ctx.createOscillator();
          osc.type = opt.type || "sawtooth";
          osc.frequency.value = f * this.hauteur;
          osc.detune.value = detune;
          const bq = ctx.createBiquadFilter();
          bq.type = "lowpass";
          bq.frequency.setValueAtTime(opt.filtreDebut || 500, t);
          bq.frequency.exponentialRampToValueAtTime(opt.filtreFin || 2200, t + att + dur * 0.5);
          const g = ctx.createGain();
          this.enveloppe(g.gain, t, att, dur, pic / (notes.length * 1.4));
          osc.connect(bq);
          bq.connect(g);
          this.envoyer(g, opt.cible, opt.salle === undefined ? 0.35 : opt.salle);
          osc.start(t);
          osc.stop(t + att + dur + 0.1);
        });
      });
    }

    // Une note de cuivre (fanfare) : dents de scie filtrées
    cuivre(f, t, dur, pic, o) {
      const opt = o || {};
      this.ton({ f, type: "sawtooth", t, att: opt.att || 0.03, dur, pic, filtre: opt.filtre || 1500, cible: opt.cible, salle: opt.salle === undefined ? 0.3 : opt.salle });
      this.ton({ f, type: "sawtooth", t, att: opt.att || 0.03, dur, pic: pic * 0.8, filtre: opt.filtre || 1500, detune: 9, cible: opt.cible, salle: 0 });
    }

    // Une note de piano électrique doux (musique d'ambiance)
    rhodes(note, t, dur, pic, cible) {
      const f = midiEnHertz(note);
      this.ton({ f, t, att: 0.006, dur, pic: pic * 0.7, cible, salle: 0.45 });
      this.ton({ f: f * 2, t, att: 0.004, dur: dur * 0.55, pic: pic * 0.22, cible, salle: 0.3 });
      this.ton({ f: f * 3.01, t, att: 0.003, dur: dur * 0.25, pic: pic * 0.07, cible, salle: 0 });
      this.ton({ f: f * 7.1, t, att: 0.001, dur: 0.07, pic: pic * 0.1, cible, salle: 0 });   // le petit « tic » du marteau
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Le catalogue des sons
  // ---------------------------------------------------------------------------------------------------------------

  // Chaque son est une fonction (atelier, instant). « id » est le nom utilisé par le jeu.
  const CATALOGUE = [];

  function ajouter(groupe, id, titre, description, fonction) {
    CATALOGUE.push({ groupe, id, titre, description, fonction });
  }

  // ----- Interface -----
  ajouter("Interface", "clic", "Clic", "Quand on choisit un nom dans la liste.", (S, t) => {
    S.ton({ f: 1900, fFin: 1250, type: "triangle", t, att: 0.001, dur: 0.04, pic: 0.34 });
    S.bruit({ t, dur: 0.015, f: 4200, q: 1.2, pic: 0.14 });
  });

  ajouter("Interface", "stylo", "Clic de stylo", "Quand on valide un essai (Entrée).", (S, t) => {
    S.ton({ f: 2300, fFin: 1700, type: "triangle", t, att: 0.001, dur: 0.03, pic: 0.24 });
    S.bruit({ t, dur: 0.012, f: 5200, q: 1.5, pic: 0.12 });
    S.ton({ f: 1500, fFin: 950, type: "triangle", t: t + 0.075, att: 0.001, dur: 0.045, pic: 0.18 });
    S.bruit({ t: t + 0.075, dur: 0.015, f: 3200, q: 1.2, pic: 0.08 });
  });

  ajouter("Interface", "case-vert", "Case verte", "Une case identique : bois clair et joyeux.", (S, t) => {
    S.bois(784, t, 0.28, 0.3);
    S.cloche(1568, t, 0.3, 0.05, null, 0.4);
  });

  ajouter("Interface", "case-orange", "Case orange", "Une case en partie identique : bois plus rond.", (S, t) => {
    S.bois(587, t, 0.22, 0.28);
  });

  ajouter("Interface", "case-rouge", "Case rouge", "Une case différente : petit « tok » sourd.", (S, t) => {
    S.ton({ f: 215, fFin: 170, t, att: 0.002, dur: 0.14, pic: 0.34 });
    S.bruit({ t, dur: 0.02, f: 900, q: 1, pic: 0.12 });
  });

  ajouter("Interface", "ligne-essai", "Ligne de 7 cases", "Les 7 cases d'un essai qui se retournent une à une (couleurs au hasard).", (S, t) => {
    const couleurs = ["vert", "orange", "rouge"];
    const sons = { vert: "case-vert", orange: "case-orange", rouge: "case-rouge" };
    for (let i = 0; i < 7; i++) {
      const choix = couleurs[Math.floor(Math.random() * 3)];
      CATALOGUE.find(c => c.id === sons[choix]).fonction(S, t + i * 0.16);
    }
  });

  ajouter("Interface", "erreur", "Nom introuvable", "Un nom qui n'existe pas, ou déjà essayé : deux petits coups de bois sourds.", (S, t) => {
    S.ton({ f: 165, fFin: 140, t, att: 0.002, dur: 0.1, pic: 0.36 });
    S.ton({ f: 140, fFin: 118, t: t + 0.1, att: 0.002, dur: 0.14, pic: 0.34 });
    S.bruit({ t, dur: 0.02, f: 700, q: 1, pic: 0.1 });
    S.bruit({ t: t + 0.1, dur: 0.02, f: 600, q: 1, pic: 0.1 });
  });

  ajouter("Interface", "tampon", "Tampon du jour", "Le tampon « Numéro du jour » qui s'imprime.", (S, t) => {
    S.coup({ f: 120, fFin: 52, t, dur: 0.22, pic: 0.62 });
    S.bruit({ t, dur: 0.14, f: 900, type: "lowpass", q: 0.7, pic: 0.34 });
    S.bruit({ t: t + 0.005, dur: 0.03, f: 2800, q: 0.9, pic: 0.14 });
    S.bruit({ t: t + 0.07, dur: 0.05, f: 1800, fFin: 700, q: 0.8, pic: 0.07 });   // le papier qui se détend
  });

  ajouter("Interface", "papier", "Papier froissé", "Une feuille que l'on manipule (ouvrir le « ? », le profil…).", (S, t) => {
    for (let i = 0; i < 5; i++) {
      S.bruit({ t: t + i * 0.045 + Math.random() * 0.02, dur: 0.035 + Math.random() * 0.03, f: 3500 + Math.random() * 3500, q: 0.9, pic: 0.07 + Math.random() * 0.05 });
    }
  });

  ajouter("Interface", "fenetre-ouvre", "Fenêtre qui s'ouvre", "Un papier qui glisse vers le haut.", (S, t) => {
    S.bruit({ t, dur: 0.2, f: 900, fFin: 3200, q: 0.7, att: 0.05, pic: 0.14, salle: 0.15 });
    S.bois(660, t + 0.14, 0.12, 0.1);
  });

  ajouter("Interface", "fenetre-ferme", "Fenêtre qui se ferme", "Un papier qui redescend.", (S, t) => {
    S.bruit({ t, dur: 0.18, f: 2800, fFin: 800, q: 0.7, att: 0.03, pic: 0.12, salle: 0.15 });
  });

  ajouter("Interface", "copier", "Copié", "Quand le résultat est copié ou partagé.", (S, t) => {
    S.ton({ f: 1180, type: "triangle", t, att: 0.002, dur: 0.05, pic: 0.24 });
    S.ton({ f: 1760, type: "triangle", t: t + 0.065, att: 0.002, dur: 0.09, pic: 0.24, salle: 0.2 });
  });

  ajouter("Interface", "indice", "Nouvel indice", "Un indice apparaît : une petite cloche discrète.", (S, t) => {
    S.cloche(988, t, 0.7, 0.13);
    S.bruit({ t, dur: 0.08, f: 5000, type: "highpass", q: 0.5, pic: 0.05 });
  });

  ajouter("Interface", "essai-offert", "Essai offert", "Le personnage offert qui se pose en bas de la liste.", (S, t) => {
    S.ton({ f: 420, fFin: 920, t, att: 0.004, dur: 0.09, pic: 0.17 });
    S.cloche(1318, t + 0.08, 0.45, 0.09);
  });

  // ----- Résultats -----
  ajouter("Résultats", "victoire-commune", "Victoire : Commune", "Deux petites notes de cloche, simples.", (S, t) => {
    S.cloche(523, t, 0.7, 0.24);
    S.cloche(659, t + 0.14, 0.9, 0.24);
    S.nappe([262, 330], t, 0.9, 0.08, { att: 0.12 });
  });

  ajouter("Résultats", "victoire-rare", "Victoire : Rare", "Un petit arpège brillant.", (S, t) => {
    [523, 659, 784, 1047].forEach((f, i) => S.cloche(f, t + i * 0.1, 1.0, 0.25));
    S.nappe([262, 330, 392], t, 1.2, 0.11, { att: 0.15 });
    S.bois(262, t, 0.3, 0.2);
  });

  ajouter("Résultats", "victoire-legendaire", "Victoire : Légendaire", "Le grand moment : arpège, nappe qui gonfle, étincelles.", (S, t) => {
    S.coup({ f: 95, fFin: 48, t, dur: 0.5, pic: 0.5, salle: 0.3 });
    [523, 659, 784, 1047, 1318, 1568].forEach((f, i) => S.cloche(f, t + 0.05 + i * 0.09, 1.6, 0.26));
    S.nappe([131, 196, 262, 330, 392], t + 0.1, 2.3, 0.2, { att: 0.55, filtreDebut: 400, filtreFin: 2600, salle: 0.5 });
    S.cloche(2093, t + 0.62, 1.8, 0.2);
    S.cloche(2637, t + 0.7, 1.8, 0.16);
    S.cloche(3136, t + 0.78, 1.8, 0.13);
    for (let i = 0; i < 9; i++) {
      S.cloche(2200 + Math.random() * 2800, t + 0.9 + i * 0.11 + Math.random() * 0.06, 0.6, 0.045);
    }
  });

  ajouter("Résultats", "defaite", "Défaite", "Trois notes qui descendent doucement, sans humilier.", (S, t) => {
    [392, 330, 262].forEach((f, i) => S.bois(f, t + i * 0.24, 0.7, 0.26, null, 0.35));
    S.nappe([220, 262, 330], t + 0.1, 1.1, 0.09, { att: 0.2, filtreDebut: 350, filtreFin: 1200 });
  });

  ajouter("Résultats", "carte-retourne", "Carte qui se retourne", "Le glissement puis le « thup » de la carte.", (S, t) => {
    S.bruit({ t, dur: 0.28, f: 500, fFin: 2600, q: 0.7, att: 0.06, pic: 0.17, salle: 0.2 });
    S.coup({ f: 210, fFin: 120, t: t + 0.27, dur: 0.09, pic: 0.3 });
    S.bruit({ t: t + 0.27, dur: 0.03, f: 2400, q: 0.9, pic: 0.1 });
  });

  ajouter("Résultats", "carte-amelioree", "Carte améliorée", "Une petite gamme qui monte avec des étincelles.", (S, t) => {
    [523, 587, 659, 784, 880, 1047].forEach((f, i) => {
      S.bois(f, t + i * 0.06, 0.25, 0.17);
      S.cloche(f * 2, t + i * 0.06, 0.5, 0.05);
    });
    S.cloche(2093, t + 0.4, 1.2, 0.17);
    S.cloche(2637, t + 0.46, 1.2, 0.13);
  });

  ajouter("Résultats", "cadeau-bonus", "Cadeau : partie bonus", "Un papier qu'on déplie, trois cloches et une étincelle.", (S, t) => {
    S.bruit({ t, dur: 0.16, f: 2200, fFin: 5200, q: 0.9, att: 0.04, pic: 0.1 });
    [784, 988, 1175].forEach((f, i) => S.cloche(f, t + 0.15 + i * 0.12, 0.9, 0.2));
    S.cloche(2349, t + 0.55, 1.1, 0.12);
  });

  ajouter("Résultats", "succes", "Succès débloqué", "Une petite cloche en deux temps.", (S, t) => {
    S.cloche(784, t, 0.8, 0.25);
    S.cloche(1047, t + 0.14, 1.1, 0.27);
    S.cloche(2093, t + 0.16, 0.7, 0.07);
  });

  // ----- Thèmes (à la révélation de la carte) -----
  ajouter("Thèmes", "theme-marvel", "Thème : Marvel", "Une petite fanfare de cuivres, franche et héroïque.", (S, t) => {
    S.bruit({ t, dur: 0.06, f: 3000, q: 0.8, pic: 0.12 });
    S.cuivre(262, t, 0.34, 0.18);
    S.cuivre(392, t + 0.22, 0.34, 0.2);
    S.cuivre(523, t + 0.44, 0.9, 0.24);
    S.cuivre(659, t + 0.44, 0.9, 0.16);
    S.cuivre(784, t + 0.44, 0.9, 0.14);
  });

  ajouter("Thèmes", "theme-dc", "Thème : DC", "Plus grave et plus sombre : cuivres lents et timbale.", (S, t) => {
    S.coup({ f: 100, fFin: 45, t, dur: 0.55, pic: 0.7, salle: 0.4 });
    S.cuivre(147, t + 0.05, 0.9, 0.2, { att: 0.12, filtre: 1000, salle: 0.45 });
    S.cuivre(220, t + 0.3, 0.9, 0.2, { att: 0.12, filtre: 1000, salle: 0.45 });
    S.cuivre(294, t + 0.6, 1.1, 0.22, { att: 0.12, filtre: 1100, salle: 0.45 });
    S.cuivre(349, t + 0.6, 1.1, 0.14, { att: 0.12, filtre: 1100, salle: 0.45 });
  });

  ajouter("Thèmes", "theme-manga", "Thème : Manga", "Des cordes pincées (koto) sur une gamme pentatonique.", (S, t) => {
    [587, 698, 784, 880, 1047, 880].forEach((f, i) => S.pincee(f, t + i * 0.1, 1.0, 0.34, { brillance: 0.7, salle: 0.3 }));
    S.pincee(294, t, 1.2, 0.3, { brillance: 0.5 });
  });

  ajouter("Thèmes", "theme-inde", "Thème : Indé", "Un accord de guitare rugueux, joué un peu de travers.", (S, t) => {
    [82, 123, 165, 247].forEach((f, i) => S.pincee(f, t + i * 0.028, 1.1, 0.11, { brillance: 0.6, distorsion: 3.2, salle: 0.15 }));
    S.bruit({ t, dur: 0.05, f: 2200, q: 0.9, pic: 0.07 });
    S.coup({ f: 85, fFin: 55, t: t + 0.3, dur: 0.18, pic: 0.22 });
  });

  ajouter("Thèmes", "theme-films", "Thème : Films", "Un clap de cinéma, puis des cordes qui gonflent.", (S, t) => {
    S.bruit({ t, dur: 0.025, f: 1800, q: 1.2, pic: 0.45 });
    S.bruit({ t: t + 0.16, dur: 0.035, f: 1500, q: 1.2, pic: 0.55 });
    S.nappe([131, 196, 330, 392, 523], t + 0.3, 1.5, 0.75, { att: 0.55, filtreDebut: 500, filtreFin: 3200, salle: 0.5 });
    S.bruit({ t: t + 0.75, dur: 0.9, f: 6500, type: "highpass", q: 0.5, att: 0.35, pic: 0.08, salle: 0.3 });
  });

  ajouter("Thèmes", "theme-series", "Thème : Séries", "Un petit carillon de télévision, deux notes.", (S, t) => {
    S.ton({ f: 784, type: "triangle", t, att: 0.004, dur: 0.5, pic: 0.2, salle: 0.35 });
    S.ton({ f: 1568, type: "sine", t, att: 0.004, dur: 0.2, pic: 0.06, salle: 0.2 });
    S.ton({ f: 1175, type: "triangle", t: t + 0.2, att: 0.004, dur: 0.8, pic: 0.22, salle: 0.4 });
    S.ton({ f: 2349, type: "sine", t: t + 0.2, att: 0.004, dur: 0.3, pic: 0.05, salle: 0.2 });
  });

  ajouter("Thèmes", "theme-jeux", "Thème : Jeux vidéo", "Un petit arpège de bips, puis une pièce qui tinte.", (S, t) => {
    [523, 659, 784, 1047, 1318].forEach((f, i) => S.ton({ f, type: "square", t: t + i * 0.065, att: 0.002, dur: 0.07, pic: 0.2, filtre: 3800 }));
    S.ton({ f: 988, type: "square", t: t + 0.4, att: 0.002, dur: 0.07, pic: 0.2, filtre: 3800 });
    S.ton({ f: 1319, type: "square", t: t + 0.47, att: 0.002, dur: 0.45, pic: 0.2, filtre: 3800, salle: 0.15 });
  });

  ajouter("Thèmes", "theme-livres", "Thème : Livres", "Un glissando de harpe et une page qu'on tourne.", (S, t) => {
    S.bruit({ t, dur: 0.18, f: 1500, fFin: 4500, q: 0.8, att: 0.05, pic: 0.1 });
    [262, 330, 392, 523, 659, 784, 988].forEach((f, i) => S.pincee(f, t + 0.12 + i * 0.07, 1.3, 0.3, { brillance: 0.4, salle: 0.4 }));
  });

  // ---------------------------------------------------------------------------------------------------------------
  // La musique d'ambiance (jazz doux, qui se compose toute seule)
  // ---------------------------------------------------------------------------------------------------------------

  // Les 8 mesures de la boucle : la basse (note MIDI) et les notes de l'accord au piano électrique
  const MESURES = [
    { basse: 38, accord: [53, 57, 60, 64] },   // Ré mineur 9
    { basse: 43, accord: [53, 59, 62, 64] },   // Sol 13
    { basse: 36, accord: [52, 59, 62, 67] },   // Do majeur 9
    { basse: 45, accord: [55, 58, 61, 64] },   // La 7 b9
    { basse: 41, accord: [55, 57, 60, 64] },   // Fa majeur 9
    { basse: 40, accord: [55, 59, 62, 66] },   // Mi mineur 7
    { basse: 38, accord: [53, 57, 60, 64] },   // Ré mineur 9
    { basse: 43, accord: [53, 59, 62, 64] }    // Sol 13
  ];
  const GAMME_MELODIE = [72, 74, 76, 79, 81, 84, 86];   // Do pentatonique, un peu au-dessus de l'accord

  class Musique {
    constructor(studio) {
      this.S = studio;
      this.bpm = 72;
      this.mesure = 0;
      this.prochain = 0;
      this.minuteur = null;
      this.indexMelodie = 3;
    }

    demarrer() {
      if (this.minuteur) return;
      const S = this.S;
      this.prochain = S.ctx.currentTime + 0.15;
      this.mesure = 0;
      S.busMusique.gain.cancelScheduledValues(S.ctx.currentTime);
      S.busMusique.gain.setValueAtTime(0.0001, S.ctx.currentTime);
      S.busMusique.gain.linearRampToValueAtTime(1, S.ctx.currentTime + 3);   // la musique entre doucement
      this.minuteur = setInterval(() => this.planifier(), 120);
      this.planifier();
    }

    arreter() {
      if (!this.minuteur) return;
      const S = this.S;
      clearInterval(this.minuteur);
      this.minuteur = null;
      S.busMusique.gain.cancelScheduledValues(S.ctx.currentTime);
      S.busMusique.gain.setValueAtTime(S.busMusique.gain.value, S.ctx.currentTime);
      S.busMusique.gain.linearRampToValueAtTime(0.0001, S.ctx.currentTime + 1.2);   // et sort doucement
    }

    actif() {
      return Boolean(this.minuteur);
    }

    planifier() {
      const S = this.S;
      const dureeMesure = (60 / this.bpm) * 4;
      while (this.prochain < S.ctx.currentTime + 0.6) {
        this.jouerUneMesure(this.prochain, this.mesure);
        this.prochain += dureeMesure;
        this.mesure++;
      }
    }

    jouerUneMesure(t0, numero) {
      const S = this.S;
      const M = S.busMusique;
      const m = MESURES[numero % MESURES.length];
      const temps = 60 / this.bpm;
      const swing = 0.58;
      const croche = i => t0 + Math.floor(i / 2) * temps + (i % 2 ? swing * temps : 0);   // les croches « swinguées »

      // Piano électrique : un accord posé sur le premier temps, un autre qui répond parfois
      m.accord.forEach((n, k) => S.rhodes(n, t0 + k * 0.012, temps * 3.2, 0.1, M));
      if (Math.random() < 0.65) m.accord.forEach((n, k) => S.rhodes(n + (k === 3 ? 0 : 0), croche(3) + k * 0.01, temps * 1.1, 0.065, M));

      // Basse
      S.ton({ f: midiEnHertz(m.basse), t: t0, att: 0.01, dur: temps * 1.6, pic: 0.26, cible: M, salle: 0.1 });
      S.ton({ f: midiEnHertz(m.basse) * 2, t: t0, att: 0.01, dur: temps * 0.5, pic: 0.05, cible: M, salle: 0 });
      if (Math.random() < 0.75) {
        const note = midiEnHertz(m.basse + (Math.random() < 0.5 ? 7 : 0));
        S.ton({ f: note, t: t0 + 2 * temps, att: 0.01, dur: temps * 1.1, pic: 0.2, cible: M, salle: 0.1 });
      }

      // Batterie très douce : grosse caisse, balai sur les temps 2 et 4, petit charleston swingué
      S.coup({ f: 85, fFin: 45, t: t0, dur: 0.16, pic: 0.2, cible: M });
      if (Math.random() < 0.4) S.coup({ f: 80, fFin: 45, t: croche(5), dur: 0.14, pic: 0.14, cible: M });
      [1, 3].forEach(b => S.bruit({ t: t0 + b * temps, dur: 0.16, f: 2600, q: 0.6, pic: 0.05, cible: M, salle: 0.15 }));
      for (let i = 0; i < 8; i++) {
        S.bruit({ t: croche(i), dur: 0.03, f: 7500, type: "highpass", q: 0.5, pic: i % 2 ? 0.026 : 0.016, cible: M });
      }

      // Craquements de vieux disque / papier
      for (let i = 0; i < 3; i++) {
        S.bruit({ t: t0 + Math.random() * temps * 4, dur: 0.006, f: 2600 + Math.random() * 2500, q: 0.7, pic: 0.03, cible: M });
      }

      // Mélodie clairsemée (petit bois aigu, comme une boîte à musique)
      for (let i = 0; i < 8; i++) {
        if (Math.random() < 0.3) {
          this.indexMelodie = Math.max(0, Math.min(GAMME_MELODIE.length - 1, this.indexMelodie + Math.floor(Math.random() * 3) - 1));
          S.bois(midiEnHertz(GAMME_MELODIE[this.indexMelodie]), croche(i), 0.5, 0.11, M, 0.45);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Ce que le jeu utilise
  // ---------------------------------------------------------------------------------------------------------------

  let ctx = null;
  let studio = null;
  let musique = null;
  let reglages = { volumeSons: 0.8, volumeMusique: 0.35, hauteur: 0, douceur: 0.35 };
  let silence = false;
  let deverrouille = false;   // vrai après le premier toucher du joueur (avant, le navigateur interdit le son)

  function creer() {
    if (studio) return true;
    const Contexte = window.AudioContext || window.webkitAudioContext;
    if (!Contexte) return false;
    try {
      ctx = new Contexte();
      studio = new Studio(ctx, ctx.destination, reglages);
      musique = new Musique(studio);
      return true;
    } catch (erreur) {
      ctx = null;
      studio = null;
      return false;
    }
  }

  window.Sons = {
    // À appeler après un toucher du joueur : réveille l'audio du navigateur.
    reprendre() {
      if (!creer()) return false;
      if (ctx.state === "suspended") ctx.resume();
      return true;
    },

    // À appeler au premier toucher du joueur : à partir de là, les sons peuvent jouer.
    deverrouiller() {
      deverrouille = true;
      return this.reprendre();
    },

    estDeverrouille() {
      return deverrouille;
    },

    // options : delai (en secondes, pour jouer un peu plus tard) et volume (1 = normal, 0.5 = moitié moins fort)
    jouer(id, options) {
      if (silence || !deverrouille || !this.reprendre()) return;
      const son = CATALOGUE.find(c => c.id === id);
      if (!son) return;
      const o = options || {};
      const t = ctx.currentTime + 0.02 + (o.delai || 0);
      const volume = o.volume === undefined ? 1 : o.volume;
      if (volume !== 1) {
        const bus = ctx.createGain();
        bus.gain.value = volume;
        bus.connect(studio.busSons);
        const salle = ctx.createGain();
        salle.gain.value = volume;
        salle.connect(studio.entreeSalle);
        studio.busActif = bus;
        studio.salleActive = salle;
        try {
          son.fonction(studio, t);
        } finally {
          studio.busActif = studio.busSons;
          studio.salleActive = studio.entreeSalle;
        }
      } else {
        son.fonction(studio, t);
      }
      if (son.groupe === "Résultats" || son.groupe === "Thèmes") {   // un grand moment : la musique s'efface un peu le temps de l'entendre
        const g = studio.baisseMusique.gain;
        g.cancelScheduledValues(ctx.currentTime);
        g.setValueAtTime(g.value, ctx.currentTime);
        g.linearRampToValueAtTime(0.35, t + 0.1);
        g.setValueAtTime(0.35, t + 2.2);
        g.linearRampToValueAtTime(1, t + 3.4);
      }
    },

    // Quand la page est cachée (autre onglet, téléphone verrouillé), on met le son en pause
    suspendre() {
      if (ctx && ctx.state === "running") ctx.suspend();
    },

    reveiller() {
      if (ctx && ctx.state === "suspended" && deverrouille) ctx.resume();
    },

    liste() {
      return CATALOGUE.map(c => ({ groupe: c.groupe, id: c.id, titre: c.titre, description: c.description }));
    },

    // volumeSons, volumeMusique (0 à 1), hauteur (demi-tons), douceur (0 à 1)
    regler(r) {
      reglages = Object.assign({}, reglages, r);
      if (studio) studio.regler(r);
    },

    reglagesActuels() {
      return Object.assign({}, reglages);
    },

    // Coupe ou rétablit tout (sons et musique)
    muet(valeur) {
      silence = Boolean(valeur);
      if (silence) this.musiqueArreter();
    },

    estMuet() {
      return silence;
    },

    musiqueDemarrer() {
      if (silence || !deverrouille || !this.reprendre()) return;
      musique.demarrer();
    },

    musiqueArreter() {
      if (musique) musique.arreter();
    },

    musiqueActive() {
      return Boolean(musique && musique.actif());
    },

    tempoMusique(bpm) {
      if (creer()) musique.bpm = bpm;
    },

    // Mesure un son sans le jouer (pour les contrôles) : durée, crête et volume moyen.
    async mesurer(id) {
      const son = CATALOGUE.find(c => c.id === id);
      const sr = 44100;
      const hors = new OfflineAudioContext(2, sr * 5, sr);
      const atelier = new Studio(hors, hors.destination, reglages);
      son.fonction(atelier, 0.05);
      const rendu = await hors.startRendering();
      let crete = 0;
      let somme = 0;
      let dernier = 0;
      const n = rendu.length;
      const d = rendu.getChannelData(0);
      for (let i = 0; i < n; i++) {
        const a = Math.abs(d[i]);
        if (a > crete) crete = a;
        somme += d[i] * d[i];
        if (a > 0.003) dernier = i;
      }
      return { id, duree: Math.round(dernier / sr * 100) / 100, crete: Math.round(crete * 1000) / 1000, rms: Math.round(Math.sqrt(somme / n) * 10000) / 10000 };
    },

    // Mesure la musique sur quelques mesures (pour les contrôles)
    async mesurerLaMusique(mesures) {
      const sr = 22050;
      const nb = mesures || 4;
      const dureeMesure = (60 / 72) * 4;
      const hors = new OfflineAudioContext(2, Math.ceil(sr * (dureeMesure * nb + 1)), sr);
      const atelier = new Studio(hors, hors.destination, reglages);
      const m = new Musique(atelier);
      for (let i = 0; i < nb; i++) m.jouerUneMesure(0.1 + i * dureeMesure, i);
      const rendu = await hors.startRendering();
      const d = rendu.getChannelData(0);
      let crete = 0;
      let somme = 0;
      for (let i = 0; i < d.length; i++) {
        crete = Math.max(crete, Math.abs(d[i]));
        somme += d[i] * d[i];
      }
      return { mesures: nb, crete: Math.round(crete * 1000) / 1000, rms: Math.round(Math.sqrt(somme / d.length) * 10000) / 10000 };
    }
  };
})();
