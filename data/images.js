// Les images des personnages (cartes, album, fiches d'essai, image de carte partagée).
//
// Une entrée par personnage qui a une image :
//   "id-du-personnage": { fichier: "images/personnages/id-du-personnage.jpg", credit: "...", cadrage: "50% 20%" },
//  - fichier : l'image, rangée dans images/personnages/ (le plus simple : l'id du personnage comme nom de fichier) ;
//  - credit : à qui appartient l'image et d'où elle vient. Il apparaît UNIQUEMENT sur la page « Mentions légales » (Luca ne veut
//    aucun crédit ailleurs : ni sous les cartes, ni sur les images partagées).
//    Les images appartiennent à leurs ayants droit : projet gratuit et sans revenus (décision de Luca) ;
//  - cadrage (facultatif) : quelle partie de l'image reste visible quand elle est recadrée. « 50% 20% » = centrée, plutôt vers le
//    haut (le visage). « 50% 50% » = tout au centre.
// Un personnage sans image garde la silhouette. Si le fichier d'un personnage est introuvable, la silhouette reste aussi.
//
// Ce fichier est rempli par Claude à partir des images que Luca dépose dans images/a-ajouter/ (voir BRIEF.md, « Images des personnages »).

window.IMAGES = {
};
