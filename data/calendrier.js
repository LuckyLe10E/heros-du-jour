// Le calendrier : quel personnage tombe quel jour.
//
// RÈGLES IMPORTANTES :
// - Le jour n°1 est la DATE_LANCEMENT. Personnage du jour = CALENDRIER[(numero - 1) % CALENDRIER.length].
// - Cette liste a été mélangée UNE FOIS (le 16 octobre 2026, pour l'alpha : thèmes alternés). On ne la remélange JAMAIS.
// - On ne réordonne pas et on ne supprime pas les entrées passées.
// - Les nouveaux personnages s'ajoutent À LA FIN de la liste.

// Date du jour n°1 (année-mois-jour) : le lancement de l'alpha (16 octobre 2026).
window.DATE_LANCEMENT = "2026-10-16";

window.CALENDRIER = [
  "mario", "black-panther", "voldemort", "rogue",
  "supergirl", "walter-white", "hit-girl", "black-canary",
  "ezio", "darth-vader", "black-adam", "bowser",
  "green-lantern", "silver-surfer", "dr-house", "sasuke",
  "cheetah", "sukuna", "neo", "daredevil",
  "spongebob", "naruto", "mera", "link",
  "rukia", "dana-scully", "wasp", "elsa",
  "green-arrow", "sherlock-holmes", "makima", "loki",
  "michonne", "all-might", "groot", "lara-croft",
  "professeur-x", "zatanna", "hawkeye", "homer-simpson",
  "android-18", "galactus", "arsene-lupin", "pain",
  "terminator", "bane", "judge-dredd", "levi",
  "poison-ivy", "cyclops", "starfire", "killua",
  "thanos", "gandalf", "spawn", "wonder-woman",
  "hermione", "thor", "harley-quinn", "geralt",
  "darkseid", "l", "black-widow", "deathstroke",
  "grogu", "vision", "rick-grimes", "ghost-rider",
  "talia-al-ghul", "freezer", "punisher", "spock",
  "usagi-tsukino", "nightwing", "green-goblin", "erza",
  "gamora", "daryl-dixon", "she-hulk", "yoda",
  "ms-marvel", "woody", "john-constantine", "rocket-raccoon",
  "eleven", "luffy", "lex-luthor", "nezuko",
  "james-kirk", "captain-marvel", "usagi-yojimbo", "itachi",
  "iron-man", "ripley", "spider-man", "superman",
  "master-chief", "zoro", "jean-grey", "michael-myers",
  "itadori", "two-face", "mikasa", "shazam",
  "mystique", "aquaman", "storm", "tony-soprano",
  "penguin", "piccolo", "jack-sparrow", "nico-robin",
  "invisible-woman", "gon", "scarlet-witch", "frodo",
  "deku", "martian-manhunter", "elektra", "pikachu",
  "bulma", "doctor-strange", "katniss", "bakugo",
  "omni-man", "ichigo", "venom", "saitama",
  "deadpool", "gojo", "joker", "dracula",
  "goku", "wolverine", "sanji", "mister-fantastic",
  "catwoman", "savage-dragon", "indiana-jones", "samus-aran",
  "nami", "leia", "invincible", "raven",
  "doctor-doom", "light-yagami", "hulk", "luke-skywalker",
  "eren", "red-skull", "sakura", "harry-potter",
  "kakashi", "ellie", "emma-frost", "tanjiro",
  "rick-sanchez", "vegeta", "leonardo", "magneto",
  "batman", "solid-snake", "flash", "hela",
  "hellboy", "sonic", "edward-elric", "negan",
  "james-bond", "la-chose", "batgirl", "alice",
  "cyborg", "kratos", "captain-america"
];
