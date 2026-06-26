#!/usr/bin/env python3
"""
Fetch translation progress from Crowdin and Weblate for Belarusian language.
Writes results to public/progress.json.
"""
import json, os, re, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone
from pathlib import Path

TOKEN_CROWDIN = os.environ.get("CROWDIN_TOKEN", "")
TOKEN_PROTON_CROWDIN = os.environ.get("PROTON_CROWDIN_TOKEN", "")
TOKEN_WEBLATE = os.environ.get("WEBLATE_TOKEN", "")

CROWDIN_TOKENS = {
    "be":     TOKEN_CROWDIN,
    "proton": TOKEN_PROTON_CROWDIN,
}
BASE = Path(__file__).parent.parent
LANG = "be"

# ── GitHub .po file repos tracked manually ───────────────────────────────────
GITHUB_PO_FILES = {
    "duckduckgo": {
        "repo":    "duckduckgo/duckduckgo-locales",
        "paths":   ["locales/be_BY/LC_MESSAGES/duckduckgo.po"],
        "trigger": "github.com/duckduckgo/duckduckgo-locales",
    },
}

# ── HTTP helper ───────────────────────────────────────────────────────────────
def get(url, headers={}, retries=3):
    h = {"User-Agent": "gnulinuxbe-progress/1.0", **headers}
    req = urllib.request.Request(url, headers=h)
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 30 * (attempt + 1)
                print(f"    rate-limited, waiting {wait}s ...", file=sys.stderr)
                time.sleep(wait)
                continue
            return {"_error": f"HTTP {e.code}"}
        except Exception as e:
            if attempt < retries:
                time.sleep(3)
                continue
            return {"_error": str(e)}
    return {"_error": "max retries"}

# ── Weblate: aggregate all components for a project+language ──────────────────
def weblate_headers():
    if TOKEN_WEBLATE:
        return {"Authorization": f"Token {TOKEN_WEBLATE}"}
    return {}

def weblate_project_stats(project, base="https://hosted.weblate.org"):
    h = weblate_headers()
    url = f"{base}/api/projects/{project}/components/?format=json&page_size=200"
    d = get(url, h)
    if "_error" in d:
        return {"_error": f"components list: {d['_error']}"}
    components = [c["slug"] for c in d.get("results", [])]
    if not components:
        return {"_error": "no components"}

    total_tr = 0
    total_tot = 0
    found_any = False
    for comp in components:
        time.sleep(0.5)
        t = get(f"{base}/api/translations/{project}/{comp}/{LANG}/", h)
        if "_error" in t:
            # 401/403 means we have no access — no point iterating all components
            err = t["_error"]
            if "401" in err or "403" in err:
                return {"_error": f"no access ({err})"}
            continue
        if "translated_percent" in t:
            total_tr  += t.get("translated", 0)
            total_tot += t.get("total", 0)
            found_any = True

    if not found_any or total_tot == 0:
        return {"_error": f"{LANG} not in project"}
    return {
        "pct":             round(total_tr / total_tot * 100, 1),
        "words_translated": total_tr,
        "words_total":      total_tot,
    }

def weblate_component_stats(project, component, base="https://hosted.weblate.org"):
    h = weblate_headers()
    time.sleep(0.5)
    d = get(f"{base}/api/translations/{project}/{component}/{LANG}/", h)
    if "translated_percent" in d:
        return {
            "pct":             round(d["translated_percent"], 1),
            "words_translated": d.get("translated", 0),
            "words_total":      d.get("total", 0),
        }
    return {"_error": d.get("_error", "no data")}

# ── Parse translate links from data.json ─────────────────────────────────────
def collect_sources():
    with open(BASE / "public" / "data.json") as f:
        data = json.load(f)

    crowdin_instances = {}   # {"be": {"slug1", ...}, "proton": {...}, ...}
    weblate_sources = {}
    github_slugs = set()

    for cat in data["categories"]:
        for item in cat["items"]:
            all_plats = list(item.get("platforms", []))
            for app in item.get("apps", []):
                all_plats += app.get("platforms", [])
            for plat in all_plats:
                for link in plat.get("links", []):
                    if link.get("type") != "translate":
                        continue
                    url = link["url"]

                    # ── Crowdin (any instance: be.crowdin.com, proton.crowdin.com, …) ──
                    if "crowdin.com/" in url:
                        # Standard: /project/slug/
                        m = re.search(r"([\w-]+)\.crowdin\.com/project/([^/?\s#]+)", url)
                        if m:
                            instance, slug = m.group(1), m.group(2)
                            crowdin_instances.setdefault(instance, set()).add(slug)
                        else:
                            # Numeric UI URL: /u/projects/129/
                            m2 = re.search(r"([\w-]+)\.crowdin\.com/u/projects/(\d+)/", url)
                            if m2:
                                instance, num_id = m2.group(1), m2.group(2)
                                crowdin_instances.setdefault(instance, set()).add(f"__numid_{num_id}")

                    # ── hosted.weblate.org ───────────────────────────────────
                    elif "hosted.weblate.org/projects/" in url:
                        m = re.search(r"hosted\.weblate\.org/projects/([^/]+)/([^/]+)/", url)
                        if m:
                            proj, comp = m.group(1), m.group(2)
                            if comp == "-":
                                weblate_sources.setdefault(proj, {
                                    "base": "https://hosted.weblate.org",
                                    "project": proj, "component": None,
                                })
                            else:
                                key = f"{proj}/{comp}"
                                weblate_sources.setdefault(key, {
                                    "base": "https://hosted.weblate.org",
                                    "project": proj, "component": comp,
                                })

                    # ── GitHub .po files ────────────────────────────────────
                    elif "github.com/" in url:
                        for slug, info in GITHUB_PO_FILES.items():
                            if info["trigger"] in url:
                                github_slugs.add(slug)

                    # ── translate.element.io ─────────────────────────────────
                    elif "translate.element.io/projects/" in url:
                        m = re.search(r"translate\.element\.io/projects/([^/]+)/([^/]+)/", url)
                        if m:
                            proj, comp = m.group(1), m.group(2)
                            if comp == "-":
                                key = f"element:{proj}"
                                weblate_sources.setdefault(key, {
                                    "base": "https://translate.element.io",
                                    "project": proj, "component": None,
                                })
                            else:
                                key = f"element:{proj}/{comp}"
                                weblate_sources.setdefault(key, {
                                    "base": "https://translate.element.io",
                                    "project": proj, "component": comp,
                                })

    return crowdin_instances, weblate_sources, github_slugs

# ── GitHub .po files ─────────────────────────────────────────────────────────
def get_raw(url):
    req = urllib.request.Request(url, headers={"User-Agent": "gnulinuxbe-progress/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return None

def parse_po(text):
    total = 0
    translated = 0
    current_msgid = None
    current_msgstr_parts = []
    in_msgstr = False

    for line in text.splitlines():
        line = line.strip()
        if line.startswith("msgid "):
            if current_msgid is not None and current_msgid != "":
                total += 1
                val = "".join(current_msgstr_parts)
                if val:
                    translated += 1
            raw = line[6:].strip().strip('"')
            current_msgid = raw
            current_msgstr_parts = []
            in_msgstr = False
        elif line.startswith("msgstr "):
            in_msgstr = True
            current_msgstr_parts = [line[7:].strip().strip('"')]
        elif line.startswith('"') and in_msgstr:
            current_msgstr_parts.append(line.strip('"'))
        elif not line:
            in_msgstr = False

    if current_msgid is not None and current_msgid != "":
        total += 1
        val = "".join(current_msgstr_parts)
        if val:
            translated += 1

    return translated, total

def fetch_github(slugs):
    results = {}
    for slug in slugs:
        info = GITHUB_PO_FILES.get(slug)
        if not info:
            results[slug] = {"_error": "unknown repo"}
            continue

        repo = info["repo"]
        paths = info["paths"]
        total_tr = 0
        total_tot = 0
        found = False

        for po_path in paths:
            for branch in ["master", "main"]:
                url = f"https://raw.githubusercontent.com/{repo}/{branch}/{po_path}"
                text = get_raw(url)
                if text and "msgid" in text:
                    tr, tot = parse_po(text)
                    total_tr  += tr
                    total_tot += tot
                    found = True
                    break

        if not found or total_tot == 0:
            results[slug] = {"_error": "po file not found"}
        else:
            results[slug] = {
                "pct":             round(total_tr / total_tot * 100, 1),
                "words_translated": total_tr,
                "words_total":      total_tot,
            }
        pct = results[slug].get("pct", results[slug].get("_error"))
        print(f"  [github] {slug}: {pct}", file=sys.stderr)
    return results

# ── Crowdin ───────────────────────────────────────────────────────────────────
def fetch_crowdin(slugs, base_url, token, instance):
    if not token:
        print(f"  [crowdin/{instance}] No token — skipping", file=sys.stderr)
        return {s: {"_error": "no token"} for s in slugs}

    headers = {"Authorization": f"Bearer {token}"}
    results = {}

    # Fetch all project IDs (paginated)
    id_map = {}
    offset = 0
    while True:
        d = get(f"{base_url}/api/v2/projects?limit=100&offset={offset}", headers)
        items = d.get("data", [])
        for item in items:
            p = item["data"]
            id_map[p["identifier"]] = p["id"]
        if len(items) < 100:
            break
        offset += 100
        time.sleep(0.3)

    print(f"  [crowdin/{instance}] Found {len(id_map)} projects", file=sys.stderr)

    for slug in slugs:
        # Numeric UI URL fallback: resolve __numid_129 → identifier + pid
        if slug.startswith("__numid_"):
            num_id = slug[len("__numid_"):]
            proj = get(f"{base_url}/api/v2/projects/{num_id}", headers)
            if "_error" in proj:
                results[slug] = {"_error": f"project {num_id} not accessible"}
                continue
            identifier = proj["data"]["identifier"]
            pid = proj["data"]["id"]
        else:
            identifier = slug
            pid = id_map.get(slug)
            if not pid:
                print(f"  [crowdin/{instance}] {slug}: not found", file=sys.stderr)
                results[slug] = {"_error": f"project not found on {instance}.crowdin.com"}
                continue

        d = get(f"{base_url}/api/v2/projects/{pid}/languages/progress?limit=100", headers)
        found = False
        for item in d.get("data", []):
            p = item["data"]
            if p["languageId"] == LANG:
                entry = {
                    "pct":              p["translationProgress"],
                    "pct_approved":     p["approvalProgress"],
                    "words_translated": p["words"]["translated"],
                    "words_total":      p["words"]["total"],
                }
                results[identifier] = entry
                # Also store under numeric ID so /u/projects/123/ URLs resolve correctly
                if slug.startswith("__numid_"):
                    results[num_id] = entry
                found = True
                break
        if not found:
            results[identifier] = {"_error": f"{LANG} not in project"}
            if slug.startswith("__numid_"):
                results[num_id] = {"_error": f"{LANG} not in project"}
        time.sleep(0.3)

    return results

# ── Weblate ───────────────────────────────────────────────────────────────────
def fetch_weblate(sources):
    results = {}
    for key, info in sources.items():
        base    = info["base"]
        project = info["project"]
        comp    = info["component"]

        if comp is None:
            # whole project — aggregate all components
            s = weblate_project_stats(project, base)
        else:
            s = weblate_component_stats(project, comp, base)

        results[key] = s
        pct = s.get("pct", s.get("_error", "?"))
        print(f"  [weblate] {key}: {pct}%", file=sys.stderr)

    return results

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("Collecting links from data.json ...", file=sys.stderr)
    crowdin_instances, weblate_sources, github_slugs = collect_sources()
    total_crowdin = sum(len(s) for s in crowdin_instances.values())
    print(f"  Crowdin : {total_crowdin} projects across {list(crowdin_instances.keys())}", file=sys.stderr)
    print(f"  Weblate : {len(weblate_sources)} sources", file=sys.stderr)
    print(f"  GitHub  : {len(github_slugs)} repos", file=sys.stderr)

    print("\nFetching Crowdin ...", file=sys.stderr)
    crowdin = {}
    for instance, slugs in crowdin_instances.items():
        token = CROWDIN_TOKENS.get(instance, "")
        base_url = f"https://{instance}.crowdin.com"
        crowdin.update(fetch_crowdin(slugs, base_url, token, instance))

    print("\nFetching Weblate ...", file=sys.stderr)
    weblate = fetch_weblate(weblate_sources)

    print("\nFetching GitHub .po files ...", file=sys.stderr)
    github = fetch_github(github_slugs)

    progress = {
        "updated":  datetime.now(timezone.utc).isoformat(),
        "language": LANG,
        "crowdin":  crowdin,
        "weblate":  weblate,
        "github":   github,
    }

    out = BASE / "public" / "progress.json"
    with open(out, "w") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)
    print(f"\nWritten → {out}", file=sys.stderr)

    # ── Summary ──────────────────────────────────────────────────────────────
    rows = []
    for slug, s in crowdin.items():
        pct = s.get("pct")
        rows.append((pct if pct is not None else -1, slug, pct, "crowdin", s.get("_error", "")))
    for key, s in weblate.items():
        pct = s.get("pct")
        rows.append((pct if pct is not None else -1, key, pct, "weblate", s.get("_error", "")))
    for slug, s in github.items():
        pct = s.get("pct")
        rows.append((pct if pct is not None else -1, slug, pct, "github", s.get("_error", "")))

    rows.sort(key=lambda x: (-x[0], x[1]))
    print(f"\n{'Project':<32} {'%':>6}  Platform")
    print("─" * 55)
    for _, name, pct, platform, err in rows:
        if pct is not None:
            print(f"{name:<32} {pct:>5.1f}%  {platform}")
        else:
            print(f"{name:<32}   err   {platform}  ({err})")

if __name__ == "__main__":
    main()
