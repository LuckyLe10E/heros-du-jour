// Les images des personnages (cartes, album, fiches d'essai, image de carte partagée).
//
// Une entrée par personnage qui a une image :
//   "id-du-personnage": { fichier: "images/personnages/id-du-personnage.jpg", credit: "...", cadrage: "50% 20%" },
//  - fichier : l'image, rangée dans images/personnages/ (le plus simple : l'id du personnage comme nom de fichier) ;
//  - credit : une note pour mémoire (d'où vient l'image, à qui elle appartient). Elle n'est AFFICHÉE NULLE PART : Luca ne veut
//    aucune liste de crédits ; la page « Mentions légales » dit seulement « Les images appartiennent à leurs ayants droit ».
//    Elle sert si un ayant droit demande un retrait. Projet gratuit et sans revenus (décision de Luca) ;
//  - cadrage (facultatif) : quelle partie de l'image reste visible quand elle est recadrée. « 50% 20% » = centrée, plutôt vers le
//    haut (le visage). « 50% 50% » = tout au centre.
// Un personnage sans image garde la silhouette. Si le fichier d'un personnage est introuvable, la silhouette reste aussi.
//
// Ce fichier est rempli par Claude à partir des images que Luca dépose dans images/a-ajouter/ (voir BRIEF.md, « Images des personnages »).

window.IMAGES = {
  "naruto": {
    "fichier": "images/personnages/naruto.jpg",
    "credit": "https://naruto.fandom.com/wiki/Naruto_Uzumaki",
    "cadrage": "50% 35%"
  },
  "spider-man": {
    "fichier": "images/personnages/spider-man.jpg",
    "credit": "https://marvel.fandom.com/wiki/Peter_Parker_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "batman": {
    "fichier": "images/personnages/batman.jpg",
    "credit": "https://dc.fandom.com/wiki/Bruce_Wayne_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "mario": {
    "fichier": "images/personnages/mario.jpg",
    "credit": "https://www.mariowiki.com/wiki/Mario",
    "cadrage": "50% 14%"
  },
  "goku": {
    "fichier": "images/personnages/goku.jpg",
    "credit": "https://dragonball.fandom.com/wiki/Goku",
    "cadrage": "50% 8%"
  },
  "gandalf": {
    "fichier": "images/personnages/gandalf.jpg",
    "credit": "https://lotr.fandom.com/wiki/Gandalf",
    "cadrage": "50% 14%"
  },
  "harry-potter": {
    "fichier": "images/personnages/harry-potter.jpg",
    "credit": "https://harrypotter.fandom.com/wiki/File%3APOA_promo_front_Harry_Potter_wand.jpg",
    "cadrage": "50% 14%"
  },
  "darth-vader": {
    "fichier": "images/personnages/darth-vader.jpg",
    "credit": "https://starwars.fandom.com/wiki/File%3ADarth_Vader.jpg",
    "cadrage": "50% 22%"
  },
  "joker": {
    "fichier": "images/personnages/joker.jpg",
    "credit": "https://dc.fandom.com/wiki/Joker_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "iron-man": {
    "fichier": "images/personnages/iron-man.jpg",
    "credit": "https://marvel.fandom.com/wiki/Anthony_Stark_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "captain-america": {
    "fichier": "images/personnages/captain-america.jpg",
    "credit": "https://marvel.fandom.com/wiki/Steven_Rogers_%28Earth-616%29",
    "cadrage": "50% 44%"
  },
  "thor": {
    "fichier": "images/personnages/thor.jpg",
    "credit": "https://marvel.fandom.com/wiki/Thor_Odinson_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "hulk": {
    "fichier": "images/personnages/hulk.jpg",
    "credit": "https://marvel.fandom.com/wiki/Bruce_Banner_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "black-widow": {
    "fichier": "images/personnages/black-widow.jpg",
    "credit": "https://marvel.fandom.com/wiki/Natalia_Romanova_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "hawkeye": {
    "fichier": "images/personnages/hawkeye.jpg",
    "credit": "https://marvel.fandom.com/wiki/Clinton_Barton_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "doctor-strange": {
    "fichier": "images/personnages/doctor-strange.jpg",
    "credit": "https://marvel.fandom.com/wiki/Stephen_Strange_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "black-panther": {
    "fichier": "images/personnages/black-panther.jpg",
    "credit": "https://marvel.fandom.com/wiki/T%27Challa_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "scarlet-witch": {
    "fichier": "images/personnages/scarlet-witch.jpg",
    "credit": "https://marvel.fandom.com/wiki/Wanda_Maximoff_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "wolverine": {
    "fichier": "images/personnages/wolverine.jpg",
    "credit": "https://marvel.fandom.com/wiki/James_Howlett_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "professeur-x": {
    "fichier": "images/personnages/professeur-x.jpg",
    "credit": "https://marvel.fandom.com/wiki/File%3ACharles_Xavier_%28Earth-616%29_from_Powers_of_X_Vol_1_1_001.jpg",
    "cadrage": "50% 8%"
  },
  "magneto": {
    "fichier": "images/personnages/magneto.jpg",
    "credit": "https://marvel.fandom.com/wiki/Max_Eisenhardt_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "storm": {
    "fichier": "images/personnages/storm.jpg",
    "credit": "https://marvel.fandom.com/wiki/Ororo_Munroe_%28Earth-616%29",
    "cadrage": "50% 54%"
  },
  "cyclops": {
    "fichier": "images/personnages/cyclops.jpg",
    "credit": "https://marvel.fandom.com/wiki/Scott_Summers_%28Earth-616%29",
    "cadrage": "50% 54%"
  },
  "jean-grey": {
    "fichier": "images/personnages/jean-grey.jpg",
    "credit": "https://marvel.fandom.com/wiki/Jean_Grey_%28Earth-616%29",
    "cadrage": "50% 38%"
  },
  "deadpool": {
    "fichier": "images/personnages/deadpool.jpg",
    "credit": "https://marvel.fandom.com/wiki/Wade_Wilson_%28Earth-616%29",
    "cadrage": "50% 38%"
  },
  "thanos": {
    "fichier": "images/personnages/thanos.jpg",
    "credit": "https://marvel.fandom.com/wiki/Thanos_%28Earth-616%29",
    "cadrage": "50% 7%"
  },
  "loki": {
    "fichier": "images/personnages/loki.jpg",
    "credit": "https://marvel.fandom.com/wiki/Loki_Laufeyson_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "doctor-doom": {
    "fichier": "images/personnages/doctor-doom.jpg",
    "credit": "https://marvel.fandom.com/wiki/Victor_von_Doom_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "green-goblin": {
    "fichier": "images/personnages/green-goblin.jpg",
    "credit": "https://marvel.fandom.com/wiki/File%3ANorman_Osborn_%28Earth-616%29_from_Bring_on_the_Bad_Guys_Green_Goblin_Vol_1_1_001.jpg",
    "cadrage": "50% 14%"
  },
  "venom": {
    "fichier": "images/personnages/venom.jpg",
    "credit": "https://marvel.fandom.com/wiki/Edward_Brock_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "captain-marvel": {
    "fichier": "images/personnages/captain-marvel.jpg",
    "credit": "https://marvel.fandom.com/wiki/Carol_Danvers_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "vision": {
    "fichier": "images/personnages/vision.jpg",
    "credit": "https://marvel.fandom.com/wiki/Vision_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "ghost-rider": {
    "fichier": "images/personnages/ghost-rider.jpg",
    "credit": "https://marvel.fandom.com/wiki/Johnathon_Blaze_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "punisher": {
    "fichier": "images/personnages/punisher.jpg",
    "credit": "https://marvel.fandom.com/wiki/Francis_Castle_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "daredevil": {
    "fichier": "images/personnages/daredevil.jpg",
    "credit": "https://marvel.fandom.com/wiki/Matthew_Murdock_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "rocket-raccoon": {
    "fichier": "images/personnages/rocket-raccoon.jpg",
    "credit": "https://marvel.fandom.com/wiki/Rocket_Raccoon_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "groot": {
    "fichier": "images/personnages/groot.jpg",
    "credit": "https://marvel.fandom.com/wiki/Groot_%28Earth-616%29",
    "cadrage": "50% 35%"
  },
  "gamora": {
    "fichier": "images/personnages/gamora.jpg",
    "credit": "https://marvel.fandom.com/wiki/Gamora_Zen_Whoberi_Ben_Titan_%28Earth-7528%29",
    "cadrage": "50% 14%"
  },
  "mister-fantastic": {
    "fichier": "images/personnages/mister-fantastic.jpg",
    "credit": "https://marvel.fandom.com/wiki/Reed_Richards_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "la-chose": {
    "fichier": "images/personnages/la-chose.jpg",
    "credit": "https://marvel.fandom.com/wiki/Benjamin_Grimm_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "silver-surfer": {
    "fichier": "images/personnages/silver-surfer.jpg",
    "credit": "https://marvel.fandom.com/wiki/Norrin_Radd_%28Earth-616%29",
    "cadrage": "50% 53%"
  },
  "galactus": {
    "fichier": "images/personnages/galactus.jpg",
    "credit": "https://marvel.fandom.com/wiki/Galan_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "red-skull": {
    "fichier": "images/personnages/red-skull.jpg",
    "credit": "https://marvel.fandom.com/wiki/Johann_Shmidt_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "rogue": {
    "fichier": "images/personnages/rogue.jpg",
    "credit": "https://marvel.fandom.com/wiki/Anna_Marie_LeBeau_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "mystique": {
    "fichier": "images/personnages/mystique.jpg",
    "credit": "https://marvel.fandom.com/wiki/Raven_Darkh%C3%B6lme_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "she-hulk": {
    "fichier": "images/personnages/she-hulk.jpg",
    "credit": "https://marvel.fandom.com/wiki/Jennifer_Walters_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "emma-frost": {
    "fichier": "images/personnages/emma-frost.jpg",
    "credit": "https://marvel.fandom.com/wiki/Emma_Frost_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "elektra": {
    "fichier": "images/personnages/elektra.jpg",
    "credit": "https://marvel.fandom.com/wiki/Elektra_Natchios_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "ms-marvel": {
    "fichier": "images/personnages/ms-marvel.jpg",
    "credit": "https://marvel.fandom.com/wiki/Kamala_Khan_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "invisible-woman": {
    "fichier": "images/personnages/invisible-woman.jpg",
    "credit": "https://marvel.fandom.com/wiki/Susan_Storm_%28Earth-616%29",
    "cadrage": "50% 14%"
  },
  "wasp": {
    "fichier": "images/personnages/wasp.jpg",
    "credit": "https://marvel.fandom.com/wiki/File%3AJanet_Van_Dyne_%28Earth-616%29_from_Avengers_Origins_Ant-Man_%26_the_Wasp_Vol_1_1_0001.jpg",
    "cadrage": "50% 22%"
  },
  "hela": {
    "fichier": "images/personnages/hela.jpg",
    "credit": "https://marvel.fandom.com/wiki/File%3AHela_Odinsdottir_%28Earth-199999%29_from_Thor_Ragnarok_001.jpg",
    "cadrage": "50% 22%"
  },
  "superman": {
    "fichier": "images/personnages/superman.jpg",
    "credit": "https://dc.fandom.com/wiki/Kal-El_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "wonder-woman": {
    "fichier": "images/personnages/wonder-woman.jpg",
    "credit": "https://dc.fandom.com/wiki/Diana_of_Themyscira_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "flash": {
    "fichier": "images/personnages/flash.jpg",
    "credit": "https://dc.fandom.com/wiki/Barry_Allen_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "green-lantern": {
    "fichier": "images/personnages/green-lantern.jpg",
    "credit": "https://dc.fandom.com/wiki/Harold_Jordan_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "aquaman": {
    "fichier": "images/personnages/aquaman.jpg",
    "credit": "https://dc.fandom.com/wiki/Arthur_Joseph_Curry_%28New_Earth%29",
    "cadrage": "50% 30%"
  },
  "cyborg": {
    "fichier": "images/personnages/cyborg.jpg",
    "credit": "https://dc.fandom.com/wiki/Victor_Stone_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "martian-manhunter": {
    "fichier": "images/personnages/martian-manhunter.jpg",
    "credit": "https://dc.fandom.com/wiki/J%27onn_J%27onzz_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "green-arrow": {
    "fichier": "images/personnages/green-arrow.jpg",
    "credit": "https://dc.fandom.com/wiki/Oliver_Queen_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "nightwing": {
    "fichier": "images/personnages/nightwing.jpg",
    "credit": "https://dc.fandom.com/wiki/Richard_Grayson_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "catwoman": {
    "fichier": "images/personnages/catwoman.jpg",
    "credit": "https://dc.fandom.com/wiki/Selina_Kyle_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "harley-quinn": {
    "fichier": "images/personnages/harley-quinn.jpg",
    "credit": "https://dc.fandom.com/wiki/Harleen_Quinzel_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "lex-luthor": {
    "fichier": "images/personnages/lex-luthor.jpg",
    "credit": "https://dc.fandom.com/wiki/File%3ALex_Luthor_003.jpg",
    "cadrage": "50% 14%"
  },
  "darkseid": {
    "fichier": "images/personnages/darkseid.jpg",
    "credit": "https://dc.fandom.com/wiki/Darkseid_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "deathstroke": {
    "fichier": "images/personnages/deathstroke.jpg",
    "credit": "https://dc.fandom.com/wiki/File%3ADeathstroke_%28DC_Dark_Legion%29_001.jpg",
    "cadrage": "50% 0%"
  },
  "bane": {
    "fichier": "images/personnages/bane.jpg",
    "credit": "https://dc.fandom.com/wiki/File%3ABane_%28Justice_League_Action%29.jpg",
    "cadrage": "50% 22%"
  },
  "poison-ivy": {
    "fichier": "images/personnages/poison-ivy.jpg",
    "credit": "https://dc.fandom.com/wiki/Pamela_Isley_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "two-face": {
    "fichier": "images/personnages/two-face.jpg",
    "credit": "https://dc.fandom.com/wiki/Harvey_Dent_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "penguin": {
    "fichier": "images/personnages/penguin.jpg",
    "credit": "https://dc.fandom.com/wiki/Oswald_Cobblepot_%28New_Earth%29",
    "cadrage": "50% 55%"
  },
  "supergirl": {
    "fichier": "images/personnages/supergirl.jpg",
    "credit": "https://dc.fandom.com/wiki/Kara_Zor-El_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "shazam": {
    "fichier": "images/personnages/shazam.jpg",
    "credit": "https://dc.fandom.com/wiki/Billy_Batson_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "raven": {
    "fichier": "images/personnages/raven.jpg",
    "credit": "https://dc.fandom.com/wiki/Raven_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "john-constantine": {
    "fichier": "images/personnages/john-constantine.jpg",
    "credit": "https://dc.fandom.com/wiki/John_Constantine_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "black-adam": {
    "fichier": "images/personnages/black-adam.jpg",
    "credit": "https://dc.fandom.com/wiki/Teth-Adam_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "batgirl": {
    "fichier": "images/personnages/batgirl.jpg",
    "credit": "https://dc.fandom.com/wiki/Barbara_Gordon_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "starfire": {
    "fichier": "images/personnages/starfire.jpg",
    "credit": "https://dc.fandom.com/wiki/Koriand%27r_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "zatanna": {
    "fichier": "images/personnages/zatanna.jpg",
    "credit": "https://dc.fandom.com/wiki/Zatanna_Zatara_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "mera": {
    "fichier": "images/personnages/mera.jpg",
    "credit": "https://dc.fandom.com/wiki/Mera_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "black-canary": {
    "fichier": "images/personnages/black-canary.jpg",
    "credit": "https://dc.fandom.com/wiki/Dinah_Laurel_Lance_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "cheetah": {
    "fichier": "images/personnages/cheetah.jpg",
    "credit": "https://dc.fandom.com/wiki/Barbara_Minerva_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "talia-al-ghul": {
    "fichier": "images/personnages/talia-al-ghul.jpg",
    "credit": "https://dc.fandom.com/wiki/Talia_al_Ghul_%28New_Earth%29",
    "cadrage": "50% 14%"
  },
  "vegeta": {
    "fichier": "images/personnages/vegeta.jpg",
    "credit": "https://dragonball.fandom.com/wiki/Vegeta",
    "cadrage": "50% 14%"
  },
  "piccolo": {
    "fichier": "images/personnages/piccolo.jpg",
    "credit": "https://dragonball.fandom.com/wiki/Piccolo",
    "cadrage": "50% 14%"
  },
  "freezer": {
    "fichier": "images/personnages/freezer.jpg",
    "credit": "https://dragonball.fandom.com/wiki/Frieza",
    "cadrage": "50% 22%"
  },
  "bulma": {
    "fichier": "images/personnages/bulma.jpg",
    "credit": "https://dragonball.fandom.com/wiki/Bulma",
    "cadrage": "50% 8%"
  },
  "android-18": {
    "fichier": "images/personnages/android-18.jpg",
    "credit": "https://dragonball.fandom.com/wiki/Android_18",
    "cadrage": "50% 8%"
  },
  "sasuke": {
    "fichier": "images/personnages/sasuke.jpg",
    "credit": "https://naruto.fandom.com/wiki/Sasuke_Uchiha",
    "cadrage": "50% 35%"
  },
  "kakashi": {
    "fichier": "images/personnages/kakashi.jpg",
    "credit": "https://naruto.fandom.com/wiki/Kakashi_Hatake",
    "cadrage": "50% 35%"
  },
  "itachi": {
    "fichier": "images/personnages/itachi.jpg",
    "credit": "https://naruto.fandom.com/wiki/Itachi_Uchiha",
    "cadrage": "50% 14%"
  },
  "pain": {
    "fichier": "images/personnages/pain.jpg",
    "credit": "https://naruto.fandom.com/wiki/Nagato",
    "cadrage": "50% 14%"
  },
  "sakura": {
    "fichier": "images/personnages/sakura.jpg",
    "credit": "https://naruto.fandom.com/wiki/Sakura_Haruno",
    "cadrage": "50% 35%"
  },
  "luffy": {
    "fichier": "images/personnages/luffy.jpg",
    "credit": "https://onepiece.fandom.com/wiki/Monkey_D._Luffy",
    "cadrage": "50% 8%"
  },
  "zoro": {
    "fichier": "images/personnages/zoro.jpg",
    "credit": "https://onepiece.fandom.com/wiki/Roronoa_Zoro",
    "cadrage": "50% 8%"
  },
  "sanji": {
    "fichier": "images/personnages/sanji.jpg",
    "credit": "https://onepiece.fandom.com/wiki/Sanji",
    "cadrage": "50% 8%"
  },
  "nami": {
    "fichier": "images/personnages/nami.jpg",
    "credit": "https://onepiece.fandom.com/wiki/Nami",
    "cadrage": "50% 14%"
  },
  "nico-robin": {
    "fichier": "images/personnages/nico-robin.jpg",
    "credit": "https://onepiece.fandom.com/wiki/Nico_Robin",
    "cadrage": "50% 8%"
  },
  "eren": {
    "fichier": "images/personnages/eren.jpg",
    "credit": "https://attackontitan.fandom.com/wiki/Eren_Yeager",
    "cadrage": "50% 22%"
  },
  "levi": {
    "fichier": "images/personnages/levi.jpg",
    "credit": "https://attackontitan.fandom.com/wiki/Levi_Ackerman",
    "cadrage": "50% 22%"
  },
  "mikasa": {
    "fichier": "images/personnages/mikasa.jpg",
    "credit": "https://attackontitan.fandom.com/wiki/Mikasa_Ackerman",
    "cadrage": "50% 22%"
  },
  "light-yagami": {
    "fichier": "images/personnages/light-yagami.jpg",
    "credit": "https://deathnote.fandom.com/wiki/Light_Yagami",
    "cadrage": "50% 8%"
  },
  "l": {
    "fichier": "images/personnages/l.jpg",
    "credit": "https://deathnote.fandom.com/wiki/L_%28character%29",
    "cadrage": "50% 8%"
  },
  "edward-elric": {
    "fichier": "images/personnages/edward-elric.jpg",
    "credit": "https://fma.fandom.com/wiki/Edward_Elric",
    "cadrage": "50% 14%"
  },
  "tanjiro": {
    "fichier": "images/personnages/tanjiro.jpg",
    "credit": "https://kimetsu-no-yaiba.fandom.com/wiki/Tanjiro_Kamado",
    "cadrage": "50% 8%"
  },
  "nezuko": {
    "fichier": "images/personnages/nezuko.jpg",
    "credit": "https://kimetsu-no-yaiba.fandom.com/wiki/Nezuko_Kamado",
    "cadrage": "50% 14%"
  },
  "gojo": {
    "fichier": "images/personnages/gojo.jpg",
    "credit": "https://jujutsu-kaisen.fandom.com/wiki/Satoru_Gojo",
    "cadrage": "50% 8%"
  },
  "itadori": {
    "fichier": "images/personnages/itadori.jpg",
    "credit": "https://jujutsu-kaisen.fandom.com/wiki/Yuji_Itadori",
    "cadrage": "50% 8%"
  },
  "sukuna": {
    "fichier": "images/personnages/sukuna.jpg",
    "credit": "https://jujutsu-kaisen.fandom.com/wiki/Sukuna",
    "cadrage": "50% 14%"
  },
  "deku": {
    "fichier": "images/personnages/deku.jpg",
    "credit": "https://bokunoheroacademia.fandom.com/wiki/Izuku_Midoriya",
    "cadrage": "50% 14%"
  },
  "all-might": {
    "fichier": "images/personnages/all-might.jpg",
    "credit": "https://bokunoheroacademia.fandom.com/wiki/Toshinori_Yagi",
    "cadrage": "50% 14%"
  },
  "bakugo": {
    "fichier": "images/personnages/bakugo.jpg",
    "credit": "https://bokunoheroacademia.fandom.com/wiki/Katsuki_Bakugo",
    "cadrage": "50% 8%"
  },
  "saitama": {
    "fichier": "images/personnages/saitama.jpg",
    "credit": "https://onepunchman.fandom.com/wiki/Saitama",
    "cadrage": "50% 22%"
  },
  "ichigo": {
    "fichier": "images/personnages/ichigo.jpg",
    "credit": "https://bleach.fandom.com/wiki/Ichigo_Kurosaki",
    "cadrage": "50% 40%"
  },
  "rukia": {
    "fichier": "images/personnages/rukia.jpg",
    "credit": "https://bleach.fandom.com/wiki/Rukia_Kuchiki",
    "cadrage": "50% 35%"
  },
  "gon": {
    "fichier": "images/personnages/gon.jpg",
    "credit": "https://hunterxhunter.fandom.com/wiki/Gon_Freecss",
    "cadrage": "50% 22%"
  },
  "killua": {
    "fichier": "images/personnages/killua.jpg",
    "credit": "https://hunterxhunter.fandom.com/wiki/Killua_Zoldyck",
    "cadrage": "50% 22%"
  },
  "makima": {
    "fichier": "images/personnages/makima.jpg",
    "credit": "https://chainsaw-man.fandom.com/wiki/Makima",
    "cadrage": "50% 14%"
  },
  "usagi-tsukino": {
    "fichier": "images/personnages/usagi-tsukino.jpg",
    "credit": "https://sailormoon.fandom.com/wiki/Usagi_Tsukino_/_Sailor_Moon_%28manga%29",
    "cadrage": "50% 22%"
  },
  "erza": {
    "fichier": "images/personnages/erza.jpg",
    "credit": "https://fairytail.fandom.com/wiki/Erza_Scarlet",
    "cadrage": "50% 22%"
  },
  "hellboy": {
    "fichier": "images/personnages/hellboy.jpg",
    "credit": "https://hellboy.fandom.com/wiki/Hellboy_%28character%29",
    "cadrage": "50% 45%"
  },
  "spawn": {
    "fichier": "images/personnages/spawn.jpg",
    "credit": "https://spawn.fandom.com/wiki/Spawn",
    "cadrage": "50% 14%"
  },
  "invincible": {
    "fichier": "images/personnages/invincible.jpg",
    "credit": "https://invincible.fandom.com/wiki/Invincible",
    "cadrage": "50% 0%"
  },
  "omni-man": {
    "fichier": "images/personnages/omni-man.jpg",
    "credit": "https://invincible.fandom.com/wiki/Omni-Man",
    "cadrage": "50% 3%"
  },
  "leonardo": {
    "fichier": "images/personnages/leonardo.jpg",
    "credit": "https://tmnt.fandom.com/wiki/Leonardo",
    "cadrage": "50% 22%"
  },
  "usagi-yojimbo": {
    "fichier": "images/personnages/usagi-yojimbo.jpg",
    "credit": "https://usagiyojimbo.fandom.com/wiki/Miyamoto_Usagi",
    "cadrage": "50% 22%"
  },
  "judge-dredd": {
    "fichier": "images/personnages/judge-dredd.jpg",
    "credit": "https://judgedredd.fandom.com/wiki/Joseph_Dredd",
    "cadrage": "50% 8%"
  },
  "rick-grimes": {
    "fichier": "images/personnages/rick-grimes.jpg",
    "credit": "https://walkingdead.fandom.com/wiki/File%3ARick_Grimes_%28TV_SERIES%29_2.png",
    "cadrage": "50% 35%"
  },
  "negan": {
    "fichier": "images/personnages/negan.jpg",
    "credit": "https://walkingdead.fandom.com/wiki/File%3ANegan-walking-dead.png",
    "cadrage": "50% 35%"
  },
  "michonne": {
    "fichier": "images/personnages/michonne.jpg",
    "credit": "https://walkingdead.fandom.com/wiki/File%3AMichonne-katana-sheath.jpg",
    "cadrage": "50% 22%"
  },
  "luke-skywalker": {
    "fichier": "images/personnages/luke-skywalker.jpg",
    "credit": "https://starwars.fandom.com/wiki/Luke_Skywalker",
    "cadrage": "50% 14%"
  },
  "leia": {
    "fichier": "images/personnages/leia.jpg",
    "credit": "https://starwars.fandom.com/wiki/File%3ALeiaOrgana-SWG4.png",
    "cadrage": "50% 5%"
  },
  "yoda": {
    "fichier": "images/personnages/yoda.jpg",
    "credit": "https://starwars.fandom.com/wiki/Yoda",
    "cadrage": "50% 22%"
  },
  "grogu": {
    "fichier": "images/personnages/grogu.jpg",
    "credit": "https://starwars.fandom.com/wiki/Din_Grogu",
    "cadrage": "50% 35%"
  },
  "indiana-jones": {
    "fichier": "images/personnages/indiana-jones.jpg",
    "credit": "https://indianajones.fandom.com/wiki/Indiana_Jones",
    "cadrage": "50% 14%"
  },
  "terminator": {
    "fichier": "images/personnages/terminator.jpg",
    "credit": "https://terminator.fandom.com/wiki/T-800",
    "cadrage": "50% 35%"
  },
  "ripley": {
    "fichier": "images/personnages/ripley.jpg",
    "credit": "https://avp.fandom.com/wiki/File%3AEllen_Ripley.jpg",
    "cadrage": "50% 3%"
  },
  "jack-sparrow": {
    "fichier": "images/personnages/jack-sparrow.jpg",
    "credit": "https://pirates.fandom.com/wiki/Jack_Sparrow",
    "cadrage": "50% 14%"
  },
  "neo": {
    "fichier": "images/personnages/neo.jpg",
    "credit": "https://matrix.fandom.com/wiki/Neo",
    "cadrage": "50% 14%"
  },
  "michael-myers": {
    "fichier": "images/personnages/michael-myers.jpg",
    "credit": "https://halloween.fandom.com/wiki/File%3AMichael_Myers.jpg",
    "cadrage": "50% 35%"
  },
  "elsa": {
    "fichier": "images/personnages/elsa.jpg",
    "credit": "https://disney.fandom.com/wiki/Elsa",
    "cadrage": "50% 22%"
  },
  "woody": {
    "fichier": "images/personnages/woody.jpg",
    "credit": "https://pixar.fandom.com/wiki/Woody",
    "cadrage": "50% 14%"
  },
  "james-bond": {
    "fichier": "images/personnages/james-bond.jpg",
    "credit": "https://jamesbond.fandom.com/wiki/James_Bond_%28Sean_Connery%29",
    "cadrage": "50% 22%"
  },
  "walter-white": {
    "fichier": "images/personnages/walter-white.jpg",
    "credit": "https://breakingbad.fandom.com/wiki/Walter_White",
    "cadrage": "50% 14%"
  },
  "eleven": {
    "fichier": "images/personnages/eleven.jpg",
    "credit": "https://strangerthings.fandom.com/wiki/Eleven",
    "cadrage": "50% 14%"
  },
  "homer-simpson": {
    "fichier": "images/personnages/homer-simpson.jpg",
    "credit": "https://simpsons.fandom.com/wiki/Homer_Simpson",
    "cadrage": "50% 35%"
  },
  "spongebob": {
    "fichier": "images/personnages/spongebob.jpg",
    "credit": "https://spongebob.fandom.com/wiki/File%3ASpongebob_25th_anniversary_render.png",
    "cadrage": "50% 14%"
  },
  "rick-sanchez": {
    "fichier": "images/personnages/rick-sanchez.jpg",
    "credit": "https://rickandmorty.fandom.com/wiki/Rick_Sanchez",
    "cadrage": "50% 14%"
  },
  "spock": {
    "fichier": "images/personnages/spock.jpg",
    "credit": "https://memory-alpha.fandom.com/wiki/File%3ASpock_dress_uniform.jpg",
    "cadrage": "50% 22%"
  },
  "james-kirk": {
    "fichier": "images/personnages/james-kirk.jpg",
    "credit": "https://memory-alpha.fandom.com/wiki/James_T._Kirk",
    "cadrage": "50% 35%"
  },
  "daryl-dixon": {
    "fichier": "images/personnages/daryl-dixon.jpg",
    "credit": "https://walkingdead.fandom.com/wiki/File%3A99414-the-walking-dead-daryl-dixon.jpg",
    "cadrage": "50% 14%"
  },
  "dana-scully": {
    "fichier": "images/personnages/dana-scully.jpg",
    "credit": "https://x-files.fandom.com/wiki/Dana_Scully",
    "cadrage": "50% 12%"
  },
  "tony-soprano": {
    "fichier": "images/personnages/tony-soprano.jpg",
    "credit": "https://sopranos.fandom.com/wiki/File%3ATony_Soprano_Season_5.png",
    "cadrage": "50% 8%"
  },
  "dr-house": {
    "fichier": "images/personnages/dr-house.jpg",
    "credit": "https://house.fandom.com/wiki/File%3AHugh-Laurie-as-Dr.-Gregory-House-and-Amy-Irving-as-Alice.jpg",
    "cadrage": "50% 14%"
  },
  "link": {
    "fichier": "images/personnages/link.jpg",
    "credit": "https://zelda.fandom.com/wiki/Link",
    "cadrage": "50% 14%"
  },
  "sonic": {
    "fichier": "images/personnages/sonic.jpg",
    "credit": "https://sonic.fandom.com/wiki/Sonic_the_Hedgehog",
    "cadrage": "50% 14%"
  },
  "pikachu": {
    "fichier": "images/personnages/pikachu.jpg",
    "credit": "https://pokemon.fandom.com/wiki/Pikachu",
    "cadrage": "50% 22%"
  },
  "lara-croft": {
    "fichier": "images/personnages/lara-croft.jpg",
    "credit": "https://tombraider.fandom.com/wiki/File%3ASOTTR-Croft.png",
    "cadrage": "50% 30%"
  },
  "master-chief": {
    "fichier": "images/personnages/master-chief.jpg",
    "credit": "https://halo.fandom.com/wiki/John-117",
    "cadrage": "50% 35%"
  },
  "kratos": {
    "fichier": "images/personnages/kratos.jpg",
    "credit": "https://godofwar.fandom.com/wiki/Kratos",
    "cadrage": "50% 14%"
  },
  "samus-aran": {
    "fichier": "images/personnages/samus-aran.jpg",
    "credit": "https://metroid.fandom.com/wiki/Samus_Aran",
    "cadrage": "50% 14%"
  },
  "solid-snake": {
    "fichier": "images/personnages/solid-snake.jpg",
    "credit": "https://metalgear.fandom.com/wiki/File%3ASolid_Snake_The_Twin_Snakes.jpg",
    "cadrage": "50% 0%"
  },
  "bowser": {
    "fichier": "images/personnages/bowser.jpg",
    "credit": "https://www.mariowiki.com/wiki/Bowser",
    "cadrage": "50% 22%"
  },
  "ezio": {
    "fichier": "images/personnages/ezio.jpg",
    "credit": "https://assassinscreed.fandom.com/wiki/Ezio_Auditore_da_Firenze",
    "cadrage": "50% 8%"
  },
  "ellie": {
    "fichier": "images/personnages/ellie.jpg",
    "credit": "https://thelastofus.fandom.com/wiki/Ellie_Williams",
    "cadrage": "50% 35%"
  },
  "hermione": {
    "fichier": "images/personnages/hermione.jpg",
    "credit": "https://harrypotter.fandom.com/wiki/File%3AHermione_Granger%E2%84%A2_in_Robe_Arms_Crossed_-_Harry_Potter_and_the_Half-Blood_Prince%E2%84%A2.png",
    "cadrage": "50% 8%"
  },
  "voldemort": {
    "fichier": "images/personnages/voldemort.jpg",
    "credit": "https://harrypotter.fandom.com/wiki/Tom_Riddle",
    "cadrage": "50% 14%"
  },
  "frodo": {
    "fichier": "images/personnages/frodo.jpg",
    "credit": "https://lotr.fandom.com/wiki/Frodo_Baggins",
    "cadrage": "50% 35%"
  },
  "sherlock-holmes": {
    "fichier": "images/personnages/sherlock-holmes.jpg",
    "credit": "https://sherlock-holmes.fandom.com/wiki/Sherlock_Holmes",
    "cadrage": "50% 22%"
  },
  "dracula": {
    "fichier": "images/personnages/dracula.jpg",
    "credit": "https://dracula.fandom.com/wiki/Count_Dracula",
    "cadrage": "50% 8%"
  },
  "katniss": {
    "fichier": "images/personnages/katniss.jpg",
    "credit": "https://thehungergames.fandom.com/wiki/File%3AHunger-games-katniss-everdeen_458.jpg",
    "cadrage": "50% 35%"
  },
  "geralt": {
    "fichier": "images/personnages/geralt.jpg",
    "credit": "https://witcher.fandom.com/wiki/Geralt_of_Rivia",
    "cadrage": "50% 14%"
  },
  "alice": {
    "fichier": "images/personnages/alice.jpg",
    "credit": "https://aliceinwonderland.fandom.com/wiki/Alice",
    "cadrage": "50% 14%"
  },
  "hit-girl": {
    "fichier": "images/personnages/hit-girl.jpg",
    "credit": "https://kick-ass.fandom.com/wiki/File%3AHit-girl.jpg",
    "cadrage": "50% 22%"
  },
  "arsene-lupin": {
    "fichier": "images/personnages/arsene-lupin.jpg",
    "credit": "https://commons.wikimedia.org/wiki/File%3AArsene_Lupin_art_Pierre_La_Fit.png",
    "cadrage": "50% 14%"
  },
  "savage-dragon": {
    "fichier": "images/personnages/savage-dragon.jpg",
    "credit": "81AgvpQztWL._AC_UF1000,1000_QL80_.jpg",
    "cadrage": "50% 46%"
  }
};
