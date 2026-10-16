# Le petit serveur du « Panneau admin » de Héros du Jour (outils/admin.html).
#
# Il tourne UNIQUEMENT sur l'ordinateur de Luca (adresse 127.0.0.1, port 8125) : personne d'autre ne peut s'y connecter.
# Il sert à lire et à modifier les fichiers du projet (data/personnages.js, data/calendrier.js, data/constantes.js, data/images.js,
# images/personnages/) depuis la page d'administration. Rien n'est mis en ligne tant que Claude (ou le bouton « Mettre en ligne »
# du panneau, plus tard) n'envoie pas les changements vers GitHub.
#
# Sécurité : avant chaque modification, une copie du fichier est gardée dans outils/sauvegardes/ ; le nouveau fichier est
# vérifié (syntaxe + relecture des données) avant de remplacer l'ancien.
#
# Lancement : double-clic sur « Lancer-admin.bat » à la racine du projet.

import datetime
import http.server
import ipaddress
import json
import os
import re
import shutil
import socket
import socketserver
import subprocess
import sys
import urllib.parse
import urllib.request

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8125
FICHIER_PERSONNAGES = os.path.join(RACINE, "data", "personnages.js")
FICHIER_CALENDRIER = os.path.join(RACINE, "data", "calendrier.js")
FICHIER_CONSTANTES = os.path.join(RACINE, "data", "constantes.js")
FICHIER_IMAGES = os.path.join(RACINE, "data", "images.js")
DOSSIER_IMAGES = os.path.join(RACINE, "images", "personnages")
DOSSIER_SAUVEGARDES = os.path.join(RACINE, "outils", "sauvegardes")
TAILLE_MAX_IMAGE = 4 * 1024 * 1024
MOTIF_ID = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MOTIF_CADRAGE = re.compile(r"^\d{1,3}% \d{1,3}%$")
ENTETE_SECTION_AJOUTS = "  // ==================== AJOUTS (panneau admin) ===================="
AGENT_NAVIGATEUR = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"}


class ErreurAdmin(Exception):
    """Une erreur à expliquer simplement à Luca (le message est affiché dans le panneau)."""


# ---------------------------------------------------------------------------------------------------------------------
# Lecture des données (on laisse Node.js relire les vrais fichiers du jeu : ainsi on voit exactement ce que le jeu verra)
# ---------------------------------------------------------------------------------------------------------------------

SCRIPT_NODE = """
const vm = require("vm"), fs = require("fs");
const c = { window: {} }; vm.createContext(c);
for (const f of process.argv.slice(1)) vm.runInContext(fs.readFileSync(f, "utf8"), c);
const w = c.window;
console.log(JSON.stringify({ personnages: w.PERSONNAGES, calendrier: w.CALENDRIER, criteres: w.CRITERES,
  dateLancement: w.DATE_LANCEMENT, apercu: w.PERSONNAGES_APERCU, images: w.IMAGES }));
"""


def node():
    chemin = shutil.which("node")
    if not chemin:
        raise ErreurAdmin("Node.js est introuvable sur cet ordinateur : le panneau ne peut pas vérifier les fichiers.")
    return chemin


def charger_donnees():
    fichiers = [os.path.join(RACINE, "data", n) for n in ("constantes.js", "personnages.js", "calendrier.js", "images.js")]
    resultat = subprocess.run([node(), "-e", SCRIPT_NODE, *fichiers], capture_output=True, text=True, encoding="utf-8", timeout=30)
    if resultat.returncode != 0:
        raise ErreurAdmin("Les fichiers de données ont une erreur : " + resultat.stderr.strip().splitlines()[-1][:200])
    return json.loads(resultat.stdout)


def numero_du_jour(date_lancement):
    lancement = datetime.date.fromisoformat(date_lancement)
    return (datetime.date.today() - lancement).days + 1


# ---------------------------------------------------------------------------------------------------------------------
# Écriture sûre des fichiers
# ---------------------------------------------------------------------------------------------------------------------

def sauvegarder_copie(chemin):
    if not os.path.exists(chemin):
        return
    os.makedirs(DOSSIER_SAUVEGARDES, exist_ok=True)
    horodatage = datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    shutil.copy2(chemin, os.path.join(DOSSIER_SAUVEGARDES, os.path.basename(chemin) + "." + horodatage))


def ecrire_fichier_js(chemin, texte):
    """Garde une copie, vérifie la syntaxe du nouveau fichier, puis remplace l'ancien."""
    temporaire = chemin + ".nouveau.js"
    with open(temporaire, "w", encoding="utf-8", newline="") as f:
        f.write(texte)
    verification = subprocess.run([node(), "--check", temporaire], capture_output=True, text=True, encoding="utf-8", timeout=30)
    if verification.returncode != 0:
        os.remove(temporaire)
        raise ErreurAdmin("Le fichier modifié aurait été cassé, rien n'a été changé : " + verification.stderr.strip().splitlines()[-1][:200])
    sauvegarder_copie(chemin)
    os.replace(temporaire, chemin)


def lire_texte(chemin):
    with open(chemin, encoding="utf-8", newline="") as f:
        return f.read()


def fin_de_ligne(texte):
    return "\r\n" if "\r\n" in texte else "\n"


# ---------------------------------------------------------------------------------------------------------------------
# data/personnages.js : on modifie le texte « fiche par fiche » pour garder les commentaires et la mise en page
# ---------------------------------------------------------------------------------------------------------------------

DEBUT_FICHE = re.compile(r'^  \{ id: "([^"]+)"')


def trouver_fiches(lignes):
    """Renvoie la liste (id, première ligne, dernière ligne) de chaque fiche."""
    fiches = []
    i = 0
    while i < len(lignes):
        m = DEBUT_FICHE.match(lignes[i])
        if m:
            j = i
            while j < len(lignes) and not re.search(r"\}\s*,?\s*$", lignes[j]):
                j += 1
            fiches.append((m.group(1), i, j))
            i = j
        i += 1
    return fiches


def texte_js(valeur):
    return json.dumps(valeur, ensure_ascii=False)


def liste_js(liste):
    return "[" + ", ".join(texte_js(v) for v in liste) + "]"


def serialiser_fiche(p):
    lignes = [
        '  { id: %s, nom: %s, autresNoms: %s,' % (texte_js(p["id"]), texte_js(p["nom"]), liste_js(p["autresNoms"])),
        '    univers: %s, camp: %s, genre: %s, espece: %s,' % tuple(texte_js(p[k]) for k in ("univers", "camp", "genre", "espece")),
        '    pouvoirs: %s, groupes: %s,' % (liste_js(p["pouvoirs"]), liste_js(p["groupes"])),
        '    annee: %d, oeuvre: %s,' % (p["annee"], texte_js(p["oeuvre"])),
        '    indice: %s,' % texte_js(p["indice"]),
    ]
    if p.get("averifier"):
        lignes.append('    description: %s,' % texte_js(p["description"]))
        lignes.append('    averifier: %s },' % texte_js(p["averifier"]))
    else:
        lignes.append('    description: %s },' % texte_js(p["description"]))
    return lignes


def valider_fiche(p, criteres, ids_existants, nouveau):
    """Renvoie la fiche nettoyée, ou lève une ErreurAdmin qui explique ce qui ne va pas."""
    def texte(cle, minimum, maximum, nom):
        valeur = p.get(cle)
        if not isinstance(valeur, str):
            raise ErreurAdmin(nom + " : à remplir.")
        valeur = re.sub(r"\s+", " ", valeur).strip()
        if not (minimum <= len(valeur) <= maximum):
            raise ErreurAdmin("%s : entre %d et %d caractères (là : %d)." % (nom, minimum, maximum, len(valeur)))
        return valeur

    def choix(cle, valeurs, nom):
        if p.get(cle) not in valeurs:
            raise ErreurAdmin(nom + " : choisis une valeur de la liste.")
        return p[cle]

    def liste_de_choix(cle, valeurs, nom):
        liste = p.get(cle)
        if not isinstance(liste, list) or not liste:
            raise ErreurAdmin(nom + " : choisis au moins une valeur.")
        if len(set(liste)) != len(liste) or any(v not in valeurs for v in liste):
            raise ErreurAdmin(nom + " : valeur inconnue ou en double.")
        if "Aucun" in liste and len(liste) > 1:
            raise ErreurAdmin(nom + " : « Aucun » ne peut pas être mélangé avec d'autres valeurs.")
        return liste

    identifiant = p.get("id")
    if not isinstance(identifiant, str) or not MOTIF_ID.match(identifiant) or len(identifiant) > 40:
        raise ErreurAdmin("Identifiant : des lettres minuscules sans accent, des chiffres et des tirets (ex. « spider-man »).")
    if nouveau and identifiant in ids_existants:
        raise ErreurAdmin("Ce personnage existe déjà (identifiant « %s »)." % identifiant)
    if not nouveau and identifiant not in ids_existants:
        raise ErreurAdmin("Personnage introuvable : « %s »." % identifiant)

    autres = p.get("autresNoms", [])
    if not isinstance(autres, list) or len(autres) > 12 or any(not isinstance(a, str) or not (1 <= len(a.strip()) <= 60) for a in autres):
        raise ErreurAdmin("Autres noms : 12 maximum, de 1 à 60 caractères chacun.")

    annee = p.get("annee")
    if isinstance(annee, bool) or not isinstance(annee, int) or not (1700 <= annee <= datetime.date.today().year + 1):
        raise ErreurAdmin("Année : un nombre entre 1700 et l'année prochaine.")

    fiche = {
        "id": identifiant,
        "nom": texte("nom", 1, 60, "Nom"),
        "autresNoms": [re.sub(r"\s+", " ", a).strip() for a in autres],
        "univers": choix("univers", criteres["univers"], "Thème"),
        "camp": choix("camp", criteres["camps"], "Camp"),
        "genre": choix("genre", criteres["genres"], "Genre"),
        "espece": choix("espece", criteres["especes"], "Espèce"),
        "pouvoirs": liste_de_choix("pouvoirs", criteres["pouvoirs"], "Pouvoirs"),
        "groupes": liste_de_choix("groupes", criteres["groupes"], "Groupes"),
        "annee": annee,
        "oeuvre": texte("oeuvre", 1, 100, "Œuvre"),
        "indice": texte("indice", 5, 300, "Indice"),
        "description": texte("description", 40, 2500, "Description"),
    }
    averifier = p.get("averifier")
    if averifier:
        fiche["averifier"] = texte("averifier", 1, 300, "À vérifier")
    return fiche


def enregistrer_fiche(p, nouveau):
    donnees = charger_donnees()
    ids = {x["id"] for x in donnees["personnages"]}
    fiche = valider_fiche(p, donnees["criteres"], ids, nouveau)

    texte = lire_texte(FICHIER_PERSONNAGES)
    nl = fin_de_ligne(texte)
    lignes = texte.split(nl)
    fiches = trouver_fiches(lignes)

    if nouveau:
        # Toujours À LA FIN (règle du projet : les numéros des cartes de l'album ne doivent jamais changer)
        fin = max(i for i, l in enumerate(lignes) if l.strip() == "];")
        bloc = []
        if ENTETE_SECTION_AJOUTS not in lignes:
            bloc += ["", ENTETE_SECTION_AJOUTS]
        bloc += [""] + serialiser_fiche(fiche)
        # on retire les lignes vides juste avant « ]; » pour ne pas en accumuler
        debut_insertion = fin
        while debut_insertion > 0 and lignes[debut_insertion - 1].strip() == "":
            debut_insertion -= 1
        derniere = debut_insertion - 1
        if not lignes[derniere].rstrip().endswith(","):   # la dernière fiche actuelle n'a pas de virgule : il en faut une avant la nouvelle
            lignes[derniere] = lignes[derniere].rstrip() + ","
        lignes = lignes[:debut_insertion] + bloc + [""] + lignes[fin:]
    else:
        _, debut, fin = next(f for f in fiches if f[0] == fiche["id"])
        lignes = lignes[:debut] + serialiser_fiche(fiche) + lignes[fin + 1:]

    ecrire_fichier_js(FICHIER_PERSONNAGES, nl.join(lignes))

    if nouveau:
        ajouter_au_calendrier(fiche["id"])

    # Relecture : la fiche enregistrée doit être exactement celle qu'on a envoyée
    apres = charger_donnees()
    relue = next((x for x in apres["personnages"] if x["id"] == fiche["id"]), None)
    if relue != fiche:
        raise ErreurAdmin("La relecture de la fiche ne correspond pas à ce qui a été envoyé : une copie de l'ancien fichier est dans outils/sauvegardes/.")
    return fiche


# ---------------------------------------------------------------------------------------------------------------------
# data/calendrier.js, data/constantes.js, data/images.js
# ---------------------------------------------------------------------------------------------------------------------

def ajouter_au_calendrier(identifiant):
    texte = lire_texte(FICHIER_CALENDRIER)
    nl = fin_de_ligne(texte)
    fin = texte.rindex("];")
    avant = texte[:fin].rstrip()
    nouveau = avant + "," + nl + "  " + texte_js(identifiant) + nl + texte[fin:]
    ecrire_fichier_js(FICHIER_CALENDRIER, nouveau)


def retirer_du_calendrier(identifiant):
    texte = lire_texte(FICHIER_CALENDRIER)
    motif = re.compile(r'\s*"' + re.escape(identifiant) + r'"\s*,?')
    nouveau, n = motif.subn("", texte, count=1)
    if n != 1:
        raise ErreurAdmin("Le personnage n'est pas dans le calendrier.")
    # on remet un retour à la ligne propre avant « ]; » et on enlève une virgule qui resterait en fin de liste
    nouveau = re.sub(r",\s*\];", "\n];", nouveau)
    nouveau = re.sub(r"\[\s*\n\s*", "[\n  ", nouveau)
    ecrire_fichier_js(FICHIER_CALENDRIER, nouveau)


def ajouter_groupe(nom):
    nom = re.sub(r"\s+", " ", nom or "").strip()
    if not (2 <= len(nom) <= 40) or any(c in nom for c in '"\\<>'):
        raise ErreurAdmin("Nom du groupe : de 2 à 40 caractères, sans guillemets.")
    donnees = charger_donnees()
    if nom.lower() in (g.lower() for g in donnees["criteres"]["groupes"]):
        raise ErreurAdmin("Ce groupe existe déjà.")
    texte = lire_texte(FICHIER_CONSTANTES)
    nl = fin_de_ligne(texte)
    marque = "    // Aucun groupe"
    if marque not in texte:
        raise ErreurAdmin("Impossible de trouver où ajouter le groupe dans constantes.js.")
    if "    // Ajouts (panneau admin)" in texte:
        nouveau = texte.replace(marque, "    " + texte_js(nom) + "," + nl + marque, 1)
    else:
        nouveau = texte.replace(marque, "    // Ajouts (panneau admin)" + nl + "    " + texte_js(nom) + "," + nl + marque, 1)
    ecrire_fichier_js(FICHIER_CONSTANTES, nouveau)


def lire_images_js():
    texte = lire_texte(FICHIER_IMAGES)
    i = texte.index("window.IMAGES = ")
    return texte[:i], json.loads(texte[i + len("window.IMAGES = "):].strip().rstrip(";"))


def ecrire_images_js(entete, images):
    ecrire_fichier_js(FICHIER_IMAGES, entete.replace("\r\n", "\n") + "window.IMAGES = " + json.dumps(images, ensure_ascii=False, indent=2) + ";\n")


def enregistrer_image(identifiant, octets, source, cadrage):
    donnees = charger_donnees()
    if identifiant not in {x["id"] for x in donnees["personnages"]}:
        raise ErreurAdmin("Personnage introuvable : « %s »." % identifiant)
    if not octets or octets[:2] != b"\xff\xd8":
        raise ErreurAdmin("L'image doit être un JPEG (le panneau la convertit tout seul).")
    if len(octets) > TAILLE_MAX_IMAGE:
        raise ErreurAdmin("L'image est trop lourde (4 Mo maximum).")
    os.makedirs(DOSSIER_IMAGES, exist_ok=True)
    chemin = os.path.join(DOSSIER_IMAGES, identifiant + ".jpg")
    if os.path.exists(chemin):
        os.makedirs(DOSSIER_SAUVEGARDES, exist_ok=True)
        shutil.copy2(chemin, os.path.join(DOSSIER_SAUVEGARDES, identifiant + ".jpg." + datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f")))
    with open(chemin, "wb") as f:
        f.write(octets)
    entete, images = lire_images_js()
    ancien = images.get(identifiant, {})
    images[identifiant] = {
        "fichier": "images/personnages/" + identifiant + ".jpg",
        "credit": (source or "")[:300],
        "cadrage": cadrage if cadrage and MOTIF_CADRAGE.match(cadrage) else ancien.get("cadrage", "50% 20%"),
    }
    ecrire_images_js(entete, images)


def regler_cadrage(identifiant, cadrage):
    if not MOTIF_CADRAGE.match(cadrage or ""):
        raise ErreurAdmin("Cadrage invalide.")
    entete, images = lire_images_js()
    if identifiant not in images:
        raise ErreurAdmin("Ce personnage n'a pas d'image.")
    images[identifiant]["cadrage"] = cadrage
    ecrire_images_js(entete, images)


def retirer_image(identifiant):
    entete, images = lire_images_js()
    chemin = os.path.join(DOSSIER_IMAGES, identifiant + ".jpg")
    if os.path.exists(chemin):
        os.makedirs(DOSSIER_SAUVEGARDES, exist_ok=True)
        shutil.move(chemin, os.path.join(DOSSIER_SAUVEGARDES, identifiant + ".jpg." + datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f")))
    if identifiant in images:
        del images[identifiant]
        ecrire_images_js(entete, images)


def supprimer_personnage(identifiant):
    donnees = charger_donnees()
    ids = [x["id"] for x in donnees["personnages"]]
    if identifiant not in ids:
        raise ErreurAdmin("Personnage introuvable.")
    if identifiant in (donnees.get("apercu") or []):
        raise ErreurAdmin("Ce personnage figure sur l'image d'aperçu du lien partagé : change d'abord PERSONNAGES_APERCU (demande à Claude).")
    calendrier = donnees["calendrier"]
    if identifiant in calendrier:
        position = calendrier.index(identifiant)
        numero = numero_du_jour(donnees["dateLancement"])
        if position + 1 <= numero:
            raise ErreurAdmin("Ce personnage a déjà été le personnage du jour n° %d : on ne supprime jamais un jour passé du calendrier. "
                              "Tu peux le modifier, mais pas le supprimer." % (position + 1))
    if len(ids) <= 50:
        raise ErreurAdmin("Il faut garder au moins 50 personnages pour que le jeu reste intéressant.")

    texte = lire_texte(FICHIER_PERSONNAGES)
    nl = fin_de_ligne(texte)
    lignes = texte.split(nl)
    _, debut, fin = next(f for f in trouver_fiches(lignes) if f[0] == identifiant)
    fin_suppression = fin + 1
    if fin_suppression < len(lignes) and lignes[fin_suppression].strip() == "":
        fin_suppression += 1
    lignes = lignes[:debut] + lignes[fin_suppression:]
    # Si la section « AJOUTS » n'a plus aucune fiche, on retire son titre
    if ENTETE_SECTION_AJOUTS in lignes:
        position_titre = lignes.index(ENTETE_SECTION_AJOUTS)
        if not any(f[1] > position_titre for f in trouver_fiches(lignes)):
            fin_titre = position_titre + 1
            while fin_titre < len(lignes) and lignes[fin_titre].strip() == "":
                fin_titre += 1
            debut_titre = position_titre
            while debut_titre > 0 and lignes[debut_titre - 1].strip() == "":
                debut_titre -= 1
            lignes = lignes[:debut_titre] + [""] + lignes[fin_titre:]
    ecrire_fichier_js(FICHIER_PERSONNAGES, nl.join(lignes))
    if identifiant in calendrier:
        retirer_du_calendrier(identifiant)
    retirer_image(identifiant)


# ---------------------------------------------------------------------------------------------------------------------
# Récupération d'une image à partir d'une adresse web (donnée par Luca dans le panneau)
# ---------------------------------------------------------------------------------------------------------------------

def adresse_publique(nom_d_hote):
    try:
        for info in socket.getaddrinfo(nom_d_hote, None):
            adresse = ipaddress.ip_address(info[4][0])
            if adresse.is_private or adresse.is_loopback or adresse.is_link_local or adresse.is_reserved:
                return False
    except OSError:
        return False
    return True


def recuperer_image(adresse):
    analyse = urllib.parse.urlparse(adresse)
    if analyse.scheme not in ("http", "https") or not analyse.hostname:
        raise ErreurAdmin("Adresse invalide (elle doit commencer par https://).")
    if not adresse_publique(analyse.hostname):
        raise ErreurAdmin("Adresse refusée.")
    entetes = dict(AGENT_NAVIGATEUR, Referer=analyse.scheme + "://" + analyse.netloc + "/",
                   Accept="image/avif,image/webp,image/*,*/*;q=0.8")
    try:
        with urllib.request.urlopen(urllib.request.Request(adresse, headers=entetes), timeout=25) as reponse:
            type_contenu = reponse.headers.get("Content-Type", "").split(";")[0].strip()
            octets = reponse.read(15 * 1024 * 1024 + 1)
    except Exception as erreur:
        raise ErreurAdmin("Impossible de récupérer cette image (%s). Essaie plutôt « Copier l'image » puis Ctrl+V dans le panneau." % str(erreur)[:80])
    if not type_contenu.startswith("image/") or type_contenu == "image/svg+xml":
        raise ErreurAdmin("Cette adresse ne mène pas à une image (jpg, png ou webp).")
    if len(octets) > 15 * 1024 * 1024:
        raise ErreurAdmin("L'image est trop lourde.")
    return type_contenu, octets


# ---------------------------------------------------------------------------------------------------------------------
# Le serveur web
# ---------------------------------------------------------------------------------------------------------------------

class Gestionnaire(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=RACINE, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")   # toujours la version à jour des fichiers
        super().end_headers()

    def log_message(self, *args):
        pass

    # --- protection : seul le panneau, ouvert sur cet ordinateur, a le droit de parler à ce serveur ---
    def acces_autorise(self):
        hotes = {"localhost:%d" % PORT, "127.0.0.1:%d" % PORT}
        if self.headers.get("Host", "") not in hotes:
            return False
        origine = self.headers.get("Origin")
        if origine and origine not in ("http://localhost:%d" % PORT, "http://127.0.0.1:%d" % PORT):
            return False
        return True

    def repondre(self, code, donnees):
        corps = json.dumps(donnees, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def lire_corps(self, maximum=8 * 1024 * 1024):
        taille = int(self.headers.get("Content-Length", 0))
        if taille <= 0 or taille > maximum:
            raise ErreurAdmin("Envoi vide ou trop gros.")
        return self.rfile.read(taille)

    def do_GET(self):
        if not self.acces_autorise():
            self.send_error(403)
            return
        adresse = urllib.parse.urlparse(self.path)
        if adresse.path == "/":
            self.send_response(302)
            self.send_header("Location", "/outils/admin.html")
            self.end_headers()
            return
        if adresse.path == "/api/recuperer":
            if self.headers.get("X-Admin") != "1":
                self.send_error(403)
                return
            try:
                cible = urllib.parse.parse_qs(adresse.query).get("url", [""])[0]
                type_contenu, octets = recuperer_image(cible)
            except ErreurAdmin as erreur:
                self.repondre(400, {"erreur": str(erreur)})
                return
            self.send_response(200)
            self.send_header("Content-Type", type_contenu)
            self.send_header("Content-Length", str(len(octets)))
            self.end_headers()
            self.wfile.write(octets)
            return
        super().do_GET()

    def do_POST(self):
        if not self.acces_autorise() or self.headers.get("X-Admin") != "1":
            self.send_error(403)
            return
        adresse = urllib.parse.urlparse(self.path)
        parametres = {cle: valeurs[0] for cle, valeurs in urllib.parse.parse_qs(adresse.query).items()}
        try:
            if adresse.path == "/api/personnage":
                corps = json.loads(self.lire_corps())
                fiche = enregistrer_fiche(corps.get("personnage") or {}, bool(corps.get("nouveau")))
                self.repondre(200, {"ok": True, "personnage": fiche})
            elif adresse.path == "/api/supprimer":
                corps = json.loads(self.lire_corps())
                supprimer_personnage(corps.get("id", ""))
                self.repondre(200, {"ok": True})
            elif adresse.path == "/api/groupe":
                corps = json.loads(self.lire_corps())
                ajouter_groupe(corps.get("nom", ""))
                self.repondre(200, {"ok": True})
            elif adresse.path == "/api/image":
                identifiant = parametres.get("id", "")
                if not MOTIF_ID.match(identifiant):
                    raise ErreurAdmin("Identifiant invalide.")
                enregistrer_image(identifiant, self.lire_corps(TAILLE_MAX_IMAGE + 1024), parametres.get("source", ""), parametres.get("cadrage"))
                self.repondre(200, {"ok": True})
            elif adresse.path == "/api/cadrage":
                regler_cadrage(parametres.get("id", ""), parametres.get("cadrage", ""))
                self.repondre(200, {"ok": True})
            elif adresse.path == "/api/retirer-image":
                if not MOTIF_ID.match(parametres.get("id", "")):
                    raise ErreurAdmin("Identifiant invalide.")
                retirer_image(parametres["id"])
                self.repondre(200, {"ok": True})
            else:
                self.repondre(404, {"erreur": "Action inconnue."})
        except ErreurAdmin as erreur:
            self.repondre(400, {"erreur": str(erreur)})
        except (ValueError, KeyError) as erreur:
            self.repondre(400, {"erreur": "Demande incorrecte : " + str(erreur)[:100]})
        except Exception as erreur:   # un vrai problème : on l'explique sans planter le serveur
            self.repondre(500, {"erreur": "Problème inattendu : " + str(erreur)[:150]})


class Serveur(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = False   # si le panneau est déjà ouvert, on le dit au lieu de lancer un second serveur


if __name__ == "__main__":
    try:
        serveur = Serveur(("127.0.0.1", PORT), Gestionnaire)
    except OSError:
        print("Le panneau admin est déjà lancé : ouvre http://localhost:%d/outils/admin.html" % PORT, flush=True)
        sys.exit(0)
    print("Panneau admin prêt : http://localhost:%d/outils/admin.html" % PORT, flush=True)
    print("(Laisse cette fenêtre ouverte tant que tu utilises le panneau. Ferme-la pour l'arrêter.)", flush=True)
    serveur.serve_forever()
