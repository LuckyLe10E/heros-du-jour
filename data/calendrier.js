// Le calendrier : quel personnage tombe quel jour.
//
// RÈGLES IMPORTANTES :
// - Le jour n°1 est la DATE_LANCEMENT. Personnage du jour = CALENDRIER[(numero - 1) % CALENDRIER.length].
// - Cette liste a été mélangée UNE FOIS. On ne la remélange JAMAIS.
// - On ne réordonne pas et on ne supprime pas les entrées passées.
// - Les nouveaux personnages s'ajoutent À LA FIN de la liste.

// Date du jour n°1 (année-mois-jour). PROVISOIRE : elle sera fixée à l'étape 10 (lancement officiel).
window.DATE_LANCEMENT = "2026-10-14";

window.CALENDRIER = [
  "vegeta", "thor", "sanji", "omni-man",
  "wolverine", "martian-manhunter", "black-widow", "rocket-raccoon",
  "catwoman", "leonardo", "all-might", "ichigo",
  "punisher", "rick-grimes", "cyborg", "two-face",
  "black-panther", "captain-marvel", "killua", "iron-man",
  "aquaman", "bane", "light-yagami", "wonder-woman",
  "kakashi", "professeur-x", "gojo", "freezer",
  "joker", "savage-dragon", "edward-elric", "nezuko",
  "superman", "green-lantern", "galactus", "supergirl",
  "la-chose", "deadpool", "l", "batman",
  "mikasa", "black-adam", "eren", "venom",
  "itachi", "zoro", "shazam", "goku",
  "gon", "ghost-rider", "daredevil", "bakugo",
  "deku", "green-arrow", "naruto", "judge-dredd",
  "poison-ivy", "jean-grey", "harley-quinn", "negan",
  "storm", "invincible", "pain", "loki",
  "green-goblin", "sasuke", "cyclops", "itadori",
  "nightwing", "darkseid", "deathstroke", "silver-surfer",
  "vision", "levi", "thanos", "tanjiro",
  "usagi-yojimbo", "doctor-strange", "scarlet-witch", "doctor-doom",
  "hawkeye", "luffy", "raven", "penguin",
  "spawn", "captain-america", "hulk", "flash",
  "sukuna", "red-skull", "piccolo", "magneto",
  "groot", "saitama", "lex-luthor", "gamora",
  "mister-fantastic", "spider-man", "hellboy", "john-constantine",
  // --- ajouts ---
  "talia-al-ghul", "erza", "elektra", "rogue",
  "emma-frost", "zatanna", "mera", "nami",
  "mystique", "rukia", "bulma", "she-hulk",
  "hit-girl", "batgirl", "wasp", "nico-robin",
  "sakura", "hela", "makima", "starfire",
  "ms-marvel", "black-canary", "cheetah", "invisible-woman",
  "michonne", "android-18", "usagi-tsukino",
  "darth-vader", "luke-skywalker", "leia", "yoda",
  "indiana-jones", "terminator", "ripley", "jack-sparrow",
  "neo", "michael-myers", "elsa", "woody",
  "walter-white", "eleven", "homer-simpson", "spongebob",
  "rick-sanchez", "spock", "james-kirk", "daryl-dixon",
  "grogu", "dana-scully", "tony-soprano", "dr-house",
  "mario", "link", "sonic", "pikachu",
  "lara-croft", "master-chief", "kratos", "samus-aran",
  "solid-snake", "bowser", "ezio", "ellie",
  "harry-potter", "hermione", "voldemort", "gandalf",
  "frodo", "sherlock-holmes", "dracula", "katniss",
  "geralt", "alice", "arsene-lupin", "james-bond"
];
