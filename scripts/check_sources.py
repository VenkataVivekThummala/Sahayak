"""Automated Source Freshness & Dead Link Verification Script.
Fetches every source URL in schemes.json, checks for dead links,
computes content hashes to detect upstream website changes,
and writes docs/SOURCE_CHECK.md for human verification.
Never alters scheme rules automatically.
"""
import hashlib
import time
from pathlib import Path
from typing import Dict, Any, List
import httpx
from backend.app.knowledge import load_schemes

CACHE_FILE = Path(__file__).resolve().parent.parent / "docs" / ".source_hashes.json"
REPORT_FILE = Path(__file__).resolve().parent.parent / "docs" / "SOURCE_CHECK.md"

def load_cached_hashes() -> Dict[str, str]:
    if CACHE_FILE.exists():
        try:
            import json
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_cached_hashes(hashes: Dict[str, str]):
    import json
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(hashes, f, indent=2)

def check_all_sources():
    schemes = load_schemes()
    cached = load_cached_hashes()
    new_hashes = {}

    results = []
    print(f"Checking sources across {len(schemes)} schemes...")

    # Headers simulating standard browser verification
    headers = {
        "User-Agent": "GovernmentSahayak-SourceAuditor/1.0 (+https://github.com/sahayak/audit)"
    }

    with httpx.Client(timeout=12.0, verify=False, follow_redirects=True, headers=headers) as client:
        for s in schemes:
            sid = s["scheme_id"]
            sname = s["name_en"]
            for src in s.get("sources", []):
                title = src["title"]
                url = src["url"]
                src_type = src["type"]

                status_code = None
                status_label = "OK"
                content_changed = False
                error_msg = None

                try:
                    resp = client.get(url)
                    status_code = resp.status_code
                    if resp.status_code >= 400:
                        status_label = f"DEAD LINK ({resp.status_code})"
                    else:
                        # Compute content hash
                        body_hash = hashlib.sha256(resp.content).hexdigest()[:16]
                        new_hashes[url] = body_hash

                        if url in cached and cached[url] != body_hash:
                            content_changed = True
                            status_label = "PAGE MODIFIED"
                except Exception as e:
                    status_label = "UNREACHABLE / TIMEOUT"
                    error_msg = str(e)[:120]

                results.append({
                    "scheme_id": sid,
                    "scheme_name": sname,
                    "title": title,
                    "url": url,
                    "type": src_type,
                    "status_code": status_code,
                    "status_label": status_label,
                    "content_changed": content_changed,
                    "error": error_msg
                })

    save_cached_hashes(new_hashes)

    # Generate Markdown Report
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    lines = [
        "# Official Source Freshness & Verification Audit",
        f"**Audit Timestamp:** {timestamp}",
        "",
        "> [!NOTE]",
        "> This automated report flags dead links and modified official portal pages. In accordance with Section 27.7 of the platform protocol, this tool notifies human maintainers and never modifies scheme rules automatically.",
        "",
        "| Scheme ID | Scheme Name | Source Title | Type | Status | Upstream Changed? | Source URL |",
        "|---|---|---|---|---|---|---|"
    ]

    for r in results:
        changed_mark = "⚠️ Yes (Review)" if r["content_changed"] else "No"
        status_disp = f"**{r['status_label']}**" if "DEAD" in r["status_label"] or "UNREACHABLE" in r["status_label"] else r["status_label"]
        lines.append(
            f"| `{r['scheme_id']}` | {r['scheme_name']} | {r['title']} | `{r['type']}` | {status_disp} | {changed_mark} | [{r['url']}]({r['url']}) |"
        )

    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"Source freshness report generated at {REPORT_FILE}")

if __name__ == "__main__":
    check_all_sources()
