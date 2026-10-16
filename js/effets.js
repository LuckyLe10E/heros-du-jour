// Les petits effets : confettis à la victoire, secousse de la case de saisie, et l'outil qui dit si on doit les éviter.
// Si le téléphone (ou l'ordinateur) est réglé sur « moins d'animations », aucun effet ne se joue.

// Vrai si le joueur a demandé moins d'animations.
function animationsReduites() {
  return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

// Secoue la case de saisie (le nom tapé n'est pas valable, ou a déjà été proposé).
function secouerLaSaisie() {
  son("erreur");   // le petit bruit sourd, même quand l'animation est réduite
  if (animationsReduites()) return;
  const champ = document.getElementById("saisie");
  champ.classList.remove("secousse");
  void champ.offsetWidth;            // force le navigateur à relancer l'animation même si on secoue deux fois de suite
  champ.classList.add("secousse");
}

// Lance une pluie de confettis (plus il y en a, plus la carte est rare). Ils s'effacent tout seuls.
function lancerConfettis(rarete) {
  if (animationsReduites()) return;
  const nombre = { legendaire: 90, rare: 55, commune: 32 }[rarete] || 32;
  // Les couleurs viennent de celles du site (les couleurs d'univers, la feuille d'or, le tampon)
  const couleurs = rarete === "legendaire"
    ? ["#f7e08a", "#d9a52a", "#fff1b8", "#c4352c", "#ffffff"]
    : ["#c4352c", "#2f5dba", "#e08a1e", "#7b4db5", "#2f8f5b", "#d9a52a"];

  const zone = document.createElement("div");
  zone.className = "confettis";
  zone.setAttribute("aria-hidden", "true");
  for (let i = 0; i < nombre; i++) {
    const piece = document.createElement("i");
    piece.style.left = (Math.random() * 100) + "%";
    piece.style.background = couleurs[Math.floor(Math.random() * couleurs.length)];
    piece.style.setProperty("--derive", (Math.random() * 160 - 80) + "px");      // dérive à gauche ou à droite
    piece.style.setProperty("--tours", (360 + Math.random() * 720) + "deg");     // tours sur elle-même
    piece.style.animationDuration = (2.4 + Math.random() * 1.6) + "s";
    piece.style.animationDelay = (Math.random() * 0.5) + "s";
    piece.style.width = (6 + Math.random() * 6) + "px";
    piece.style.height = (8 + Math.random() * 8) + "px";
    zone.appendChild(piece);
  }
  document.body.appendChild(zone);
  setTimeout(() => zone.remove(), 5000);
}
