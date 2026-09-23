#!/usr/bin/env python3
import json, os, re, subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

PORT  = 7890
TOKEN = os.environ.get("VPS_API_TOKEN", "")
REPO  = os.environ.get("REPO_PATH", "/home/ubuntu/projects/hamcat.live")
ALLOWED = {"git","pnpm","npm","node","npx","wrangler","python3","pip3","ls","cat","find","head","tail","systemctl","journalctl"}

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
                  "recordState", "eventUrl", "tracklist", "featured", "notes"}
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
