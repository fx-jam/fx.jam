#!/usr/bin/env python3
import json, os, re, subprocess
from collections import OrderedDict
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

PORT  = 7890
TOKEN = os.environ.get("VPS_API_TOKEN", "")
REPO  = os.environ.get("REPO_PATH", "/home/ubuntu/projects/hamcat.live")
ALLOWED = {"git","pnpm","npm","node","npx","wrangler","python3","pip3","ls","cat","find","head","tail","systemctl","journalctl","crontab"}

def run(args, cwd=None, timeout=120):
    cwd = cwd or REPO
    try:
        r = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return {"stdout": r.stdout, "stderr": r.stderr, "code": r.returncode}
    except subprocess.TimeoutExpired:
        return {"error": "timeout", "code": -1}
    except FileNotFoundError:
        return {"error": "command not found: " + args[0], "code": -1}
    except Exception as e:
        return {"error": str(e), "code": -1}

def build_steps(clean=True):
    """Installe et construit le site. `clean` vide le cache de contenu d'Astro
    et reinstalle depuis le verrou, comme le fait la CI."""
    steps = {}
    if clean:
        steps["clean"] = run(["node","-e",
            "const f=require('fs');"
            "for (const d of ['dist','.astro','node_modules'])"
            " f.rmSync(d,{recursive:true,force:true});"], timeout=120)
        steps["install"] = run(["npm","ci"], timeout=300)
    steps["build"] = run(["npm","run","build"], timeout=300)
    return steps


def safe_path(rel):
    full = os.path.realpath(os.path.join(REPO, rel))
    root = os.path.realpath(REPO)
    if not full.startswith(root + os.sep) and full != root:
        return None, "path traversal denied"
    return full, None


# ── Atelier : application des reponses ───────────────────────────────────────
#  Patcher du frontmatter est ce qui a casse 27 fiches en septembre. Trois
#  garde-fous, dans cet ordre :
#    1. liste blanche de champs — rien d'autre ne peut etre ecrit ;
#    2. build propre APRES ecriture, dans les conditions de la CI ;
#    3. restauration integrale si le build echoue — on ne laisse jamais le
#       depot dans un etat casse, et rien n'est pousse.
ATELIER_FIELDS = {"cover", "city", "role", "duration", "description", "lineup",
                  "recordState", "eventUrl", "tracklist", "featured", "notes",
                  "organizer", "formation"}
# Valeurs fermees : un champ enumere au schema n'accepte pas n'importe quoi, et
# une valeur hors liste ferait echouer le build de TOUTES les fiches.
ATELIER_ENUM = {"recordState": {"none", "soon", "tracklist"}}
ATELIER_BOOL = {"featured"}
ATELIER_DIR  = "src/content/gigs"

def _yq(s):
    """Scalaire YAML entre apostrophes, la convention du depot."""
    return "'" + str(s).replace("'", "''") + "'"

def _yval(field, value):
    if field in ATELIER_BOOL:
        return "true" if str(value).strip().lower() in ("true", "oui", "1", "yes") else "false"
    if field == "lineup":
        # Saisie libre : un nom par ligne, ou separes par des virgules.
        parts = [x.strip() for x in re.split(r"[\n,;]+", str(value)) if x.strip()]
        return json.dumps(parts, ensure_ascii=False)
    return _yq(" ".join(str(value).split()))

def patch_frontmatter(text, field, value):
    if not text.startswith("---"):
        raise ValueError("frontmatter absent")
    end = text.index("\n---", 3)
    head, rest = text[:end], text[end:]
    line = "%s: %s" % (field, _yval(field, value))
    pat  = re.compile(r"^%s:.*$" % re.escape(field), re.M)
    if pat.search(head):
        head = pat.sub(lambda _: line, head, count=1)
    else:
        head = head.rstrip("\n") + "\n" + line
    return head + rest

def atelier_apply(answers, message):
    changed, skipped, backups = [], [], {}
    for a in answers:
        gig   = str(a.get("gig", "")).strip()
        field = str(a.get("field", "")).strip()
        value = a.get("value", "")
        if field not in ATELIER_FIELDS:
            skipped.append({"gig": gig, "field": field, "why": "champ non autorise"}); continue
        if field in ATELIER_ENUM and str(value).strip() not in ATELIER_ENUM[field]:
            skipped.append({"gig": gig, "field": field, "why": "valeur hors vocabulaire"}); continue
        if not gig or "/" in gig or ".." in gig:
            skipped.append({"gig": gig, "field": field, "why": "identifiant invalide"}); continue
        if not str(value).strip():
            skipped.append({"gig": gig, "field": field, "why": "reponse vide"}); continue
        rel = "%s/%s.md" % (ATELIER_DIR, gig)
        full, err = safe_path(rel)
        if err or not os.path.isfile(full):
            skipped.append({"gig": gig, "field": field, "why": "fiche introuvable"}); continue
        try:
            with open(full, encoding="utf-8") as f: original = f.read()
            if rel not in backups: backups[rel] = original
            # Calcul AVANT ouverture : ouvrir en "w" tronque immediatement, et
            # une exception ensuite laissait le fichier vide. C'est ce qui a
            # vide 71 fiches le 23/09.
            nouveau = patch_frontmatter(original, field, value)
            if not nouveau.strip():
                raise ValueError("resultat vide — ecriture refusee")
            with open(full, "w", encoding="utf-8") as f:
                f.write(nouveau)
            changed.append({"gig": gig, "field": field})
        except Exception as e:
            # Filet : si quoi que ce soit a touche le fichier, on remet l'original.
            try:
                with open(full, "w", encoding="utf-8") as f: f.write(backups[rel])
            except Exception:
                pass
            skipped.append({"gig": gig, "field": field, "why": str(e)})

    if not changed:
        return {"ok": False, "error": "aucune reponse applicable",
                "changed": [], "skipped": skipped}

    steps = build_steps(clean=True)
    if steps["build"].get("code") != 0:
        for rel, original in backups.items():
            full, _ = safe_path(rel)
            with open(full, "w", encoding="utf-8") as f: f.write(original)
        return {"ok": False, "error": "build en echec — fiches restaurees, rien pousse",
                "changed": [], "skipped": skipped, "steps": steps}

    steps.update({"add":    run(["git", "add", "-A"]),
                  "commit": run(["git", "commit", "-m", message or
                                 "atelier: %d reponses appliquees" % len(changed)]),
                  "push":   run(["git", "push", "origin", "main"])})
    ok = all(steps[k].get("code", 1) in (0, 1) for k in ("add", "commit", "push"))
    return {"ok": ok, "changed": changed, "skipped": skipped, "steps": steps}


# ── Ecriture eclair : valider sans construire ────────────────────────────────
#  Mesure du 23/09 : build propre 89 s, build tiede 32 s. Payer ca a chaque
#  reponse est impensable. Or pour un champ issu de la liste blanche, verifier
#  ne demande pas Astro : il suffit de relire le frontmatter obtenu.
#
#  La verification ci-dessous attrape exactement la panne de septembre — des
#  restes de listes en bloc orphelines apres une reecriture. Chaque ligne du
#  frontmatter doit etre un `cle: valeur`. Rien d'autre n'est tolere, puisque
#  rien d'autre n'est produit.
def validate_frontmatter(text):
    if not text.startswith("---"):
        return "frontmatter absent"
    try:
        end = text.index("\n---", 3)
    except ValueError:
        return "frontmatter non ferme"
    head = text[4:end]
    for i, line in enumerate(head.split("\n"), start=2):
        if not line.strip():
            continue
        if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*\s*:", line):
            return "ligne %d invalide: %s" % (i, line[:60])
    return None

def atelier_quick(answers):
    """Patche et commite SANS build. Chaque reponse est acquise en <1 s ;
    la publication est differee a /atelier/push."""
    changed, skipped = [], []
    for a in answers:
        gig   = str(a.get("gig", "")).strip()
        field = str(a.get("field", "")).strip()
        value = a.get("value", "")
        if field not in ATELIER_FIELDS:
            skipped.append({"gig": gig, "field": field, "why": "champ non autorise"}); continue
        if field in ATELIER_ENUM and str(value).strip() not in ATELIER_ENUM[field]:
            skipped.append({"gig": gig, "field": field, "why": "valeur hors vocabulaire"}); continue
        if not gig or "/" in gig or ".." in gig or not str(value).strip():
            skipped.append({"gig": gig, "field": field, "why": "entree invalide"}); continue
        rel = "%s/%s.md" % (ATELIER_DIR, gig)
        full, err = safe_path(rel)
        if err or not os.path.isfile(full):
            skipped.append({"gig": gig, "field": field, "why": "fiche introuvable"}); continue
        try:
            with open(full, encoding="utf-8") as f: original = f.read()
            nouveau = patch_frontmatter(original, field, value)
            probleme = validate_frontmatter(nouveau)
            if probleme or not nouveau.strip():
                raise ValueError(probleme or "resultat vide")
            with open(full, "w", encoding="utf-8") as f: f.write(nouveau)
            changed.append({"gig": gig, "field": field})
        except Exception as e:
            skipped.append({"gig": gig, "field": field, "why": str(e)})

    if not changed:
        return {"ok": False, "changed": [], "skipped": skipped, "commit": None}
    # Commit local immediat : la reponse est sauvee avant d'etre publiee.
    msg = "atelier: %s" % ", ".join("%s/%s" % (c["gig"], c["field"]) for c in changed[:3])
    if len(changed) > 3: msg += " (+%d)" % (len(changed) - 3)
    add = run(["git", "add", "--", ATELIER_DIR])
    com = run(["git", "commit", "-m", msg])
    return {"ok": True, "changed": changed, "skipped": skipped,
            "commit": com.get("code") in (0, 1)}

def atelier_push():
    """Publie les commits en attente. Un build tiede sert de porte : s'il
    echoue, rien ne part et les commits restent locaux, reparables."""
    en_attente = run(["git", "rev-list", "--count", "origin/main..HEAD"])
    n = (en_attente.get("stdout") or "0").strip()
    if n in ("", "0"):
        return {"ok": True, "pushed": 0, "message": "rien en attente"}
    steps = build_steps(clean=False)
    if steps["build"].get("code") != 0:
        return {"ok": False, "pushed": 0, "error": "build en echec — rien pousse",
                "en_attente": n, "steps": steps}
    push = run(["git", "push", "origin", "main"])
    return {"ok": push.get("code") == 0, "pushed": int(n), "steps": {"push": push}}

# ── Edition complete d'une fiche ─────────────────────────────────────────────
#  Le patch ligne a ligne suffisait tant qu'on ne remplissait qu'un trou. Editer
#  une fiche entiere demande autre chose, et la tentation serait de reserialiser
#  tout le frontmatter. C'est exactement ce qu'il ne faut pas faire : trois
#  fiches portent encore des listes en bloc YAML (`genre:` puis `  - psydub`),
#  et une reecriture globale les normaliserait sans qu'on l'ait demande — donc
#  toucherait des donnees qu'on n'edite pas.
#
#  La regle retenue : le frontmatter est lu comme une SUITE DE BLOCS, un par
#  cle, gardes tels quels. Enregistrer ne reecrit que les blocs des champs
#  effectivement modifies. Tout le reste ressort octet pour octet.

FICHE_TYPES = {
    "title": "str", "date": "date", "format": "enum", "role": "str",
    "organizer": "str", "formation": "str",
    "venue": "str", "city": "str", "country": "str",
    "description": "text", "genre": "list", "duration": "str",
    "lineup": "list", "image": "str", "media": "media", "cover": "str",
    "recordState": "enum", "tracklist": "str", "recording": "str",
    "recordings": "recordings", "eventUrl": "str",
    "featured": "bool", "draft": "bool", "notes": "text",
}
FICHE_ENUM = {
    "format": {"dj", "live", "hybride"},
    "recordState": {"none", "soon", "tracklist"},
}
FICHE_REQUIS = ("title", "date", "format", "venue")


def parse_fm(text):
    """Rend (blocs, corps). `blocs` est une liste de (cle, lignes brutes) dans
    l'ordre du fichier — les lignes de continuation d'une liste en bloc restent
    attachees a leur cle."""
    if not text.startswith("---"):
        raise ValueError("frontmatter absent")
    i = text.find("\n---", 3)
    if i < 0:
        raise ValueError("frontmatter non ferme")
    head, body = text[4:i], text[i + 4:]
    blocs, cle, buf = [], None, []
    for line in head.split("\n"):
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):(.*)$", line)
        if m:
            if cle is not None:
                blocs.append((cle, buf))
            cle, buf = m.group(1), [line]
        elif cle is not None:
            buf.append(line)                      # continuation (liste en bloc)
        elif line.strip():
            raise ValueError("ligne orpheline: " + line[:60])
    if cle is not None:
        blocs.append((cle, buf))
    return blocs, body


def render_fm(blocs, body):
    lignes = []
    for _, buf in blocs:
        lignes.extend(buf)
    return "---\n" + "\n".join(lignes) + "\n---" + body


def decode_bloc(buf):
    """Valeur exploitable par l'interface, quelle que soit la forme ecrite."""
    tete = buf[0]
    brut = tete.split(":", 1)[1].strip()
    suite = [l for l in buf[1:] if l.strip()]
    if not brut and suite:                        # liste en bloc
        out = []
        for l in suite:
            s = l.strip()
            if s.startswith("- "):
                item = s[2:].strip()
                m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$", item)
                # « - url: '...' » ouvre un objet ; « - psydub » est un scalaire.
                out.append({m.group(1): m.group(2).strip().strip("'\"")} if m
                           else item.strip("'\""))
            elif out and isinstance(out[-1], dict) and ":" in s:
                k, v = s.split(":", 1)
                out[-1][k.strip()] = v.strip().strip("'\"")
        return out
    if brut in ("true", "false"):
        return brut == "true"
    if brut[:1] in ("[", "{", '"'):
        try:
            return json.loads(brut)
        except ValueError:
            pass
    return brut.strip("'\"").replace("''", "'")


def encode_champ(champ, valeur):
    """Une seule serialisation, JSON — qui est un sous-ensemble de YAML 1.2.
    C'est deja la forme employee dans le depot pour `media` et `genre`, et elle
    echappe les retours a la ligne d'une description sans cas particulier."""
    t = FICHE_TYPES[champ]
    if t == "bool":
        if isinstance(valeur, bool):
            v = valeur
        else:
            v = str(valeur).strip().lower() in ("true", "oui", "1", "yes")
        return "%s: %s" % (champ, "true" if v else "false")
    if t == "list":
        if isinstance(valeur, list):
            items = [str(x).strip() for x in valeur if str(x).strip()]
        else:
            items = [x.strip() for x in re.split(r"[\n,;]+", str(valeur)) if x.strip()]
        return "%s: %s" % (champ, json.dumps(items, ensure_ascii=False))
    if t == "media":
        items = []
        for m in (valeur or []):
            mid = str(m.get("id", "")).strip()
            kind = str(m.get("kind", "image")).strip()
            if not mid:
                continue
            if kind not in ("image", "video"):
                raise ValueError("media.kind hors vocabulaire: " + kind)
            items.append({"id": mid, "kind": kind})
        return "%s: %s" % (champ, json.dumps(items, ensure_ascii=False))
    if t == "recordings":
        items = []
        for r in (valeur or []):
            url = str(r.get("url", "")).strip()
            if not url:
                continue
            o = {"url": url}
            if str(r.get("label", "")).strip():
                o["label"] = str(r["label"]).strip()
            items.append(o)
        return "%s: %s" % (champ, json.dumps(items, ensure_ascii=False))
    s = str(valeur)
    if t != "text":
        s = " ".join(s.split())                   # un scalaire n'a pas de retours
    else:
        s = s.replace("\r\n", "\n").strip()
    if champ in FICHE_ENUM and s not in FICHE_ENUM[champ]:
        raise ValueError("%s hors vocabulaire: %s" % (champ, s[:40]))
    if t == "date" and not re.match(r"^\d{4}-\d{2}-\d{2}$", s):
        raise ValueError("date attendue au format AAAA-MM-JJ")
    return "%s: %s" % (champ, json.dumps(s, ensure_ascii=False))


def valider_blocs(blocs):
    """La panne de septembre, en une phrase : une valeur ecrite sur la ligne de
    la cle par-dessus une ancienne liste en bloc, laissant les `  - item`
    orphelins dessous. Rejouer ce cas ici coute une boucle et l'attrape."""
    for cle, buf in blocs:
        tete = buf[0].split(":", 1)
        if len(tete) != 2:
            return "bloc sans cle: " + buf[0][:60]
        inline = tete[1].strip()
        suite = [l for l in buf[1:] if l.strip()]
        if inline and suite:
            return "cle %s : valeur en ligne ET lignes de suite" % cle
        if not inline and not suite:
            continue                              # champ vide, tolere
        for l in suite:
            if not l.startswith((" ", "\t")):
                return "cle %s : ligne de suite non indentee" % cle
    return None


def lire_fiche(gig):
    rel = "%s/%s.md" % (ATELIER_DIR, gig)
    full, err = safe_path(rel)
    if err or not os.path.isfile(full):
        return None
    with open(full, encoding="utf-8") as f:
        text = f.read()
    blocs, _ = parse_fm(text)
    return {k: decode_bloc(buf) for k, buf in blocs}


def lister_fiches():
    d, _ = safe_path(ATELIER_DIR)
    out = []
    for fn in sorted(os.listdir(d)):
        if not fn.endswith(".md"):
            continue
        try:
            f = lire_fiche(fn[:-3])
        except Exception as e:
            out.append({"id": fn[:-3], "erreur": str(e)}); continue
        if f is not None:
            f["id"] = fn[:-3]
            out.append(f)
    return out


def enregistrer_fiche(gig, champs, creer=False):
    """Ecrit plusieurs champs d'un coup. Les blocs non touches ressortent
    inchanges ; le corps du document est preserve."""
    if not gig or "/" in gig or ".." in gig or not re.match(r"^[a-z0-9\-]+$", gig):
        return {"ok": False, "error": "identifiant invalide"}
    inconnus = [c for c in champs if c not in FICHE_TYPES]
    if inconnus:
        return {"ok": False, "error": "champ non autorise: " + ", ".join(inconnus[:3])}

    rel = "%s/%s.md" % (ATELIER_DIR, gig)
    full, err = safe_path(rel)
    if err:
        return {"ok": False, "error": "chemin refuse"}
    existe = os.path.isfile(full)
    if creer and existe:
        return {"ok": False, "error": "une fiche porte deja cet identifiant"}
    if not creer and not existe:
        return {"ok": False, "error": "fiche introuvable"}

    if existe:
        with open(full, encoding="utf-8") as f:
            original = f.read()
        blocs, body = parse_fm(original)
    else:
        original, body = None, "\n"
        manquants = [c for c in FICHE_REQUIS if not str(champs.get(c, "")).strip()]
        if manquants:
            return {"ok": False, "error": "champs requis manquants: " + ", ".join(manquants)}
        blocs = []

    try:
        for champ, valeur in champs.items():
            ligne = encode_champ(champ, valeur)
            pose = False
            for i, (k, _) in enumerate(blocs):
                if k == champ:
                    blocs[i] = (champ, [ligne]); pose = True; break
            if not pose:
                blocs.append((champ, [ligne]))
        nouveau = render_fm(blocs, body)
        probleme = valider_blocs(blocs) if nouveau.strip() else "resultat vide"
        if probleme:
            raise ValueError(probleme)
    except Exception as e:
        return {"ok": False, "error": str(e)}

    try:
        with open(full, "w", encoding="utf-8") as f:
            f.write(nouveau)
    except Exception as e:
        if original is not None:
            with open(full, "w", encoding="utf-8") as f:
                f.write(original)
        return {"ok": False, "error": str(e)}

    msg = ("atelier: fiche %s creee" if creer else "atelier: %s (%d champs)")
    msg = msg % ((gig,) if creer else (gig, len(champs)))
    steps = {"add": run(["git", "add", "-A"]), "commit": run(["git", "commit", "-m", msg])}
    return {"ok": True, "gig": gig, "champs": sorted(champs), "steps": steps}


def supprimer_fiche(gig):
    """Suppression franche. Le brouillon (`draft: true`) est le geste courant et
    passe par `enregistrer_fiche` ; celle-ci sert quand la fiche n'aurait jamais
    du exister. Git garde l'historique, rien n'est perdu pour de bon."""
    if not gig or "/" in gig or ".." in gig:
        return {"ok": False, "error": "identifiant invalide"}
    rel = "%s/%s.md" % (ATELIER_DIR, gig)
    full, err = safe_path(rel)
    if err or not os.path.isfile(full):
        return {"ok": False, "error": "fiche introuvable"}
    r = run(["git", "rm", "-f", rel])
    if r.get("code") != 0:
        return {"ok": False, "error": (r.get("stderr") or "git rm en echec").strip()}
    return {"ok": True, "gig": gig,
            "steps": {"commit": run(["git", "commit", "-m", "atelier: fiche %s supprimee" % gig])}}



# ── Les deux faces d'une facette ─────────────────────────────────────────────
#  Meme philosophie que les fiches : on ne reconstruit pas le fichier, on y pose
#  trois cles. `son.json` fait 54 Ko de donnees historiques qui n'ont rien a
#  voir avec les jaquettes — les perdre pour une faute de frappe dans une phrase
#  de recto serait absurde.
FACETTES = {"son", "regie", "projets", "blog", "outils", "contact"}
FACETTE_CLES = {"recto", "verso", "chantier"}
CLES_CHIFFRES = {"dates", "apres", "sets", "styles", "lieux", "medias", "billets"}


def _chemin_facette(cle):
    if cle not in FACETTES:
        return None, "facette inconnue"
    return safe_path("src/data/%s.json" % cle)


def lister_facettes():
    out = []
    for cle in sorted(FACETTES):
        full, err = _chemin_facette(cle)
        if err or not os.path.isfile(full):
            continue
        try:
            with open(full, encoding="utf-8") as f:
                d = json.load(f)
        except Exception as e:
            out.append({"cle": cle, "erreur": str(e)}); continue
        out.append({"cle": cle, "label": d.get("label", cle),
                    "teaser": d.get("teaser", ""),
                    "recto": d.get("recto") or {},
                    "verso": d.get("verso") or {},
                    "chantier": d.get("chantier")})
    return out


def _nettoie_recto(r):
    if not isinstance(r, dict):
        raise ValueError("recto : objet attendu")
    chiffres = []
    for c in (r.get("chiffres") or [])[:3]:
        cle = str((c or {}).get("cle", "")).strip()
        if cle not in CLES_CHIFFRES:
            raise ValueError("chiffre inconnu : " + cle[:20])
        o = {"cle": cle}
        if str((c or {}).get("quoi", "")).strip():
            o["quoi"] = str(c["quoi"]).strip()
        chiffres.append(o)
    return {"image":  str(r.get("image", "") or "").strip(),
            "titre":  " ".join(str(r.get("titre", "") or "").split()),
            "phrase": " ".join(str(r.get("phrase", "") or "").split()),
            "chiffres": chiffres}


def _nettoie_verso(v):
    if not isinstance(v, dict):
        raise ValueError("verso : objet attendu")
    entrees = []
    for e in (v.get("entrees") or [])[:6]:
        titre = " ".join(str((e or {}).get("titre", "") or "").split())
        if not titre:
            continue
        o = {"titre": titre}
        for k in ("texte", "href"):
            val = " ".join(str((e or {}).get(k, "") or "").split())
            if val:
                o[k] = val
        entrees.append(o)
    return {"intro": str(v.get("intro", "") or "").replace("\r\n", "\n").strip(),
            "entrees": entrees}


def enregistrer_facette(cle, champs):
    full, err = _chemin_facette(cle)
    if err:
        return {"ok": False, "error": err}
    if not os.path.isfile(full):
        return {"ok": False, "error": "fichier de facette introuvable"}
    inconnus = [c for c in champs if c not in FACETTE_CLES]
    if inconnus:
        return {"ok": False, "error": "champ non autorise: " + ", ".join(inconnus[:3])}

    with open(full, encoding="utf-8") as f:
        original = f.read()
    try:
        d = json.loads(original, object_pairs_hook=OrderedDict)
        if "recto" in champs:
            d["recto"] = _nettoie_recto(champs["recto"])
        if "verso" in champs:
            d["verso"] = _nettoie_verso(champs["verso"])
        if "chantier" in champs:
            t = str(champs["chantier"] or "").strip()
            d["chantier"] = t or None
        nouveau = json.dumps(d, ensure_ascii=False, indent=2) + "\n"
        json.loads(nouveau)                      # relecture : on n'ecrit pas a l'aveugle
    except Exception as e:
        return {"ok": False, "error": str(e)}

    try:
        with open(full, "w", encoding="utf-8") as f:
            f.write(nouveau)
    except Exception as e:
        with open(full, "w", encoding="utf-8") as f:
            f.write(original)
        return {"ok": False, "error": str(e)}

    steps = {"add": run(["git", "add", "-A"]),
             "commit": run(["git", "commit", "-m",
                            "atelier: facette %s (%s)" % (cle, ", ".join(sorted(champs)))])}
    return {"ok": True, "cle": cle, "champs": sorted(champs), "steps": steps}


class Agent(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): pass

    def authed(self):
        if self.headers.get("Authorization","") == "Bearer " + TOKEN:
            return True
        self._json({"error": "Unauthorized"}, 401)
        return False

    def _json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n)) if n else {}

    def do_GET(self):
        if not self.authed(): return
        p  = urlparse(self.path)
        qs = parse_qs(p.query)
        if p.path == "/status":
            self._json({"branch": run(["git","branch","--show-current"]),
                        "log":    run(["git","log","-5","--oneline"]),
                        "status": run(["git","status","--short"])})
        elif p.path == "/read":
            rel = qs.get("path",[""])[0]
            if not rel: return self._json({"error":"param path requis"},400)
            full, err = safe_path(rel)
            if err: return self._json({"error":err},403)
            try:
                with open(full, encoding="utf-8") as f:
                    self._json({"path":rel,"content":f.read()})
            except FileNotFoundError: self._json({"error":"introuvable"},404)
        elif p.path == "/ls":
            rel  = qs.get("path",[""])[0]
            full = os.path.join(REPO, rel) if rel else REPO
            try:
                entries = [{"name":n,"type":"dir" if os.path.isdir(os.path.join(full,n)) else "file"}
                           for n in sorted(os.listdir(full))]
                self._json({"path":rel or "/","entries":entries})
            except Exception as e: self._json({"error":str(e)},500)
        elif p.path == "/logs":
            self._json(run(["journalctl","-u",qs.get("unit",["vps-agent"])[0],
                            "-n",qs.get("n",["80"])[0],"--no-pager"]))
        else: self._json({"error":"route inconnue"},404)

    def do_POST(self):
        if not self.authed(): return
        p    = urlparse(self.path)
        body = self._body()
        if p.path == "/write":
            rel, content = body.get("path",""), body.get("content","")
            if not rel: return self._json({"error":"param path requis"},400)
            full, err = safe_path(rel)
            if err: return self._json({"error":err},403)
            os.makedirs(os.path.dirname(full), exist_ok=True)
            with open(full,"w",encoding="utf-8") as f: f.write(content)
            self._json({"ok":True,"path":rel,"bytes":len(content.encode())})
        elif p.path == "/exec":
            args = body.get("args",[])
            if not args: return self._json({"error":"param args requis"},400)
            if args[0] not in ALLOWED:
                return self._json({"error":"commande refusee: "+args[0]},403)
            self._json(run(args, cwd=body.get("cwd",REPO), timeout=body.get("timeout",120)))
        elif p.path == "/build":
            # Verification prealable, dans les memes conditions que la CI :
            # dependances reinstallees et cache de contenu vide. Sans ca un
            # frontmatter casse passe inapercu en local (Astro sert son cache)
            # et ne tombe qu'une fois pousse.
            self._json(build_steps(clean=body.get("clean", True)))
        elif p.path == "/deploy":
            steps = {}
            # {"check": true} : on ne pousse que si le build passe.
            if body.get("check"):
                steps.update(build_steps(clean=True))
                if steps["build"].get("code") != 0:
                    return self._json({"ok": False, "steps": steps,
                                       "error": "build en echec — rien n'a ete pousse"})
            steps.update({"add":    run(["git","add","-A"]),
                          "commit": run(["git","commit","-m",body.get("message","deploy via vps-agent")]),
                          "push":   run(["git","push","origin","main"])})
            ok = all(steps[k].get("code",1) in (0,1) for k in ("add","commit","push"))
            self._json({"ok": ok, "steps":steps})
        elif p.path == "/atelier/quick":
            answers = body.get("answers") or []
            if not isinstance(answers, list) or not answers:
                return self._json({"error": "param answers requis"}, 400)
            if len(answers) > 50:
                return self._json({"error": "lot trop grand pour /quick"}, 400)
            self._json(atelier_quick(answers))
        elif p.path == "/atelier/fiches":
            self._json({"ok": True, "fiches": lister_fiches()})
        elif p.path == "/atelier/save":
            champs = body.get("champs") or {}
            if not isinstance(champs, dict) or not champs:
                return self._json({"error": "champs requis"}, 400)
            if len(champs) > 30:
                return self._json({"error": "trop de champs"}, 400)
            self._json(enregistrer_fiche(str(body.get("gig", "")).strip(), champs,
                                         creer=bool(body.get("creer"))))
        elif p.path == "/atelier/facettes":
            self._json({"ok": True, "facettes": lister_facettes()})
        elif p.path == "/atelier/facette-save":
            champs = body.get("champs") or {}
            if not isinstance(champs, dict) or not champs:
                return self._json({"error": "champs requis"}, 400)
            self._json(enregistrer_facette(str(body.get("cle", "")).strip(), champs))
        elif p.path == "/atelier/delete":
            self._json(supprimer_fiche(str(body.get("gig", "")).strip()))
        elif p.path == "/atelier/push":
            self._json(atelier_push())
        elif p.path == "/atelier/apply":
            answers = body.get("answers") or []
            if not isinstance(answers, list) or not answers:
                return self._json({"error": "param answers requis"}, 400)
            if len(answers) > 500:
                return self._json({"error": "lot trop grand (500 max)"}, 400)
            self._json(atelier_apply(answers, body.get("message", "")))
        elif p.path == "/deploy-worker":
            # Depannage quand GitHub Actions est indisponible. Le projet tourne
            # en npm : l'ancienne version appelait pnpm, absent de la machine.
            steps = build_steps(clean=False)
            if steps["build"].get("code") != 0:
                return self._json({"ok": False, "steps": steps,
                                   "error": "build en echec — rien n'a ete deploye"})
            steps["deploy"] = run(["npx","wrangler","deploy"], timeout=180)
            out = (steps["deploy"].get("stderr") or "") + (steps["deploy"].get("stdout") or "")
            if "Not logged in" in out or "Failed to fetch auth token" in out:
                return self._json({"ok": False, "steps": steps,
                                   "error": "wrangler non authentifie sur le VPS — definir "
                                            "CLOUDFLARE_API_TOKEN et CLOUDFLARE_ACCOUNT_ID "
                                            "dans l'environnement du service, ou 'wrangler login'"})
            self._json({"ok": steps["deploy"].get("code") == 0, "steps": steps})
        else: self._json({"error":"route inconnue"},404)

if __name__ == "__main__":
    if not TOKEN:
        raise SystemExit("VPS_API_TOKEN non defini — verifier /etc/vps-agent/.env")
    print("vps-agent demarre sur localhost:" + str(PORT))
    HTTPServer(("127.0.0.1", PORT), Agent).serve_forever()
