#!/usr/bin/env python3
"""
Activity Log Sync Script (Python 3)
Extracts activity logs from README.md and CONTRIBUTING.md according to guidelines
and compiles them into website/data/activity-log.json.
"""

import os
import re
import json
import datetime
from pathlib import Path

DEFAULT_REPO_BASE_URL = "https://github.com/D7017E-LLM-Based-Failure-Detection/D7017E-documentation/blob/main"
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

def format_display_date(date_str: str) -> str:
    if not date_str:
        return ""
    clean = date_str.strip()
    parts = re.split(r"[-/.]", clean)
    if len(parts) == 3:
        try:
            year = parts[0]
            month_idx = int(parts[1]) - 1
            day = int(parts[2])
            if 0 <= month_idx < 12:
                return f"{MONTHS[month_idx]} {day}, {year}"
        except ValueError:
            pass
    return date_str

def resolve_repo_url(href: str, repo_base_url: str = DEFAULT_REPO_BASE_URL) -> str:
    if not href:
        return "#"
    trimmed = href.strip()
    if re.match(r"^(https?:|mailto:|#|//)", trimmed, re.I):
        return trimmed
    clean_path = trimmed.lstrip("./")
    clean_base = (repo_base_url or DEFAULT_REPO_BASE_URL).rstrip("/")
    return f"{clean_base}/{clean_path}"

def extract_markdown_links(text: str, repo_base_url: str = DEFAULT_REPO_BASE_URL):
    if not text:
        return []
    links = []
    link_regex = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
    for match in link_regex.finditer(text):
        title = match.group(1).strip()
        url = match.group(2).strip()
        links.append({
            "text": title,
            "url": url,
            "githubUrl": resolve_repo_url(url, repo_base_url)
        })

    raw_url_match = re.search(r"(?:→|->|=>|&rarr;)\s*(https?://[^\s]+)$", text)
    if raw_url_match:
        raw_url = raw_url_match.group(1).strip()
        if not any(l["url"] == raw_url for l in links):
            links.append({
                "text": raw_url.split("/")[-1] or "Link",
                "url": raw_url,
                "githubUrl": raw_url
            })

    raw_path_match = re.search(r"(?:→|->|=>|&rarr;)\s*([a-zA-Z0-9_\-\./]+\.md\b)$", text)
    if raw_path_match:
        raw_path = raw_path_match.group(1).strip()
        if not any(l["url"] == raw_path for l in links):
            links.append({
                "text": raw_path,
                "url": raw_path,
                "githubUrl": resolve_repo_url(raw_path, repo_base_url)
            })

    return links

def parse_log_line(raw_line: str, repo_base_url: str = DEFAULT_REPO_BASE_URL, index: int = 0):
    if not raw_line:
        return None
    line = raw_line.strip()
    line = re.sub(r"^[-*+]\s+", "", line)
    line = re.sub(r"^\d+\.\s+", "", line).strip()
    # Entry anchor: <a id="2026-09-24-delivery-repo"></a> (lets personal logs link here)
    anchor_match = re.search(r'<a\s+(?:id|name)="([^"]+)"\s*>\s*</a>', line, re.I)
    anchor = anchor_match.group(1).strip() if anchor_match else None
    line = re.sub(r'<a\s+(?:id|name)="([^"]+)"\s*>\s*</a>', "", line, flags=re.I).strip()
    line = re.sub(r"^\*{1,2}", "", line)
    line = re.sub(r"\*{1,2}$", "", line).strip()
    if not line:
        return None

    date_match = re.match(r"^(\d{4})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b", line)
    if not date_match:
        return None

    y = date_match.group(1)
    m = date_match.group(2).zfill(2)
    d = date_match.group(3).zfill(2)
    date_str = f"{y}-{m}-{d}"

    remainder = line[date_match.end():].strip()
    remainder = re.sub(r"^[\*\s—–:-]+", "", remainder).strip()

    sep_match = re.search(r"[\s]+[—–-]+[\s]+|[\s]*:[ \t]+", remainder)
    if sep_match:
        group_part = remainder[:sep_match.start()].strip()
        content_part = remainder[sep_match.end():].strip()
    else:
        alt_match = re.search(r"[—–]", remainder)
        if alt_match:
            group_part = remainder[:alt_match.start()].strip()
            content_part = remainder[alt_match.end():].strip()
        else:
            known_match = re.match(r"^(\[?\s*(?:ALL|G1|G2|G3|GROUP[\s-_]*[123]|GENERAL|TEAM)\]?)", remainder, re.I)
            if known_match:
                group_part = known_match.group(1)
                content_part = re.sub(r"^[\s—–:-]+", "", remainder[known_match.end():]).strip()
            else:
                group_part = "ALL"
                content_part = remainder

    group = "ALL"
    if re.search(r"\[?\s*(?:G1|GROUP[\s_\-]*1)\b", group_part, re.I):
        group = "G1"
    elif re.search(r"\[?\s*(?:G2|GROUP[\s_\-]*2)\b", group_part, re.I):
        group = "G2"
    elif re.search(r"\[?\s*(?:G3|GROUP[\s_\-]*3)\b", group_part, re.I):
        group = "G3"
    elif re.search(r"\[?\s*(?:ALL|GENERAL|TEAM)\b", group_part, re.I):
        group = "ALL"
    else:
        clean_g = re.sub(r"[\[\]()]", "", group_part).strip().split()[0] if group_part else "ALL"
        group = clean_g.upper()

    author = None
    paren_match = re.search(r"\(([^)]+)\)", group_part)
    if paren_match:
        author = paren_match.group(1).strip()
    else:
        after_token = re.sub(r"^\[?\s*(?:G1|G2|G3|GROUP[\s_\-]*[123]|ALL|GENERAL|TEAM)\]?", "", group_part, flags=re.I)
        after_token = re.sub(r"^[—–:,\s-]+", "", after_token)
        after_token = re.sub(r"[\[\]]", "", after_token).strip()
        if after_token:
            author = after_token

    if author and re.match(r"^(who|name|names|author)$", author.strip(), re.I):
        author = None

    # Personal log link to a group log entry: ⇡ [id](../README.md#id)
    group_ref = None
    ref_match = re.search(r"\s*⇡\s*\[([^\]]+)\]\(([^)]*#([^)\s]+))\)", content_part)
    if ref_match:
        group_ref = {"id": ref_match.group(3).strip(), "text": ref_match.group(1).strip(), "url": ref_match.group(2).strip()}
        content_part = (content_part[:ref_match.start()] + content_part[ref_match.end():]).strip()

    links = extract_markdown_links(content_part, repo_base_url)

    clean_summary = re.sub(r"(?:→|->|=>|&rarr;)\s*(?:(?:\[[^\]]+\]\([^)]+\)|https?://[^\s]+|[a-zA-Z0-9_\-\./]+\.md\b)(?:\s*[,;&and]+\s*)?)+$", "", content_part)
    clean_summary = re.sub(r"(?:→|->|=>|&rarr;)\s*$", "", clean_summary)
    clean_summary = re.sub(r"^[:\s—–-]+", "", clean_summary)
    clean_summary = re.sub(r"[:\s—–-]+$", "", clean_summary).strip()
    if not clean_summary and content_part:
        clean_summary = content_part.strip()

    entry_id = f"log-{date_str}-{group.lower()}-{index + 1}"
    return {
        "id": entry_id,
        "date": date_str,
        "displayDate": format_display_date(date_str),
        "group": group,
        "author": author,
        "summary": clean_summary,
        "rawContent": content_part,
        "links": links,
        "anchor": anchor,
        "groupRef": group_ref,
        "raw": raw_line.strip()
    }

def extract_activity_section(markdown_text: str) -> str:
    cleaned = re.sub(r"<!--[\s\S]*?-->", "", markdown_text or "")
    match = re.search(r"(?:^|\n)#{1,3}\s+(?:Project\s+|Recent\s+)?(?:Activity(?:\s+logs?)?|Changelog|Work\s+Log)\b.*$", cleaned, re.I | re.M)
    if not match:
        has_log_pattern = re.search(r"(?:^|\n)\s*[-*+]?\s*\d{4}[-/.]\d{1,2}[-/.]\d{1,2}", cleaned)
        return cleaned if has_log_pattern else ""
    start_idx = match.end()
    remaining = cleaned[start_idx:]
    next_match = re.search(r"\n#{1,2}\s+[^\n]+", remaining)
    if next_match:
        return remaining[:next_match.start()]
    return remaining


def parse_activity_logs(markdown_text: str, repo_base_url: str = DEFAULT_REPO_BASE_URL):
    section_text = extract_activity_section(markdown_text)
    lines = section_text.splitlines()
    entries = []
    current_entry = None

    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue
        if re.match(r"^#+\s+", line_str) or re.match(r"^format:\s*", line_str, re.I) or re.match(r"^newest first", line_str, re.I) or re.match(r"^<!--", line_str):
            continue

        # Skip empty bullet markers
        if re.match(r"^(?:[-*+]|\d+\.)\s*$", line_str):
            continue

        parsed = parse_log_line(line_str, repo_base_url, len(entries))
        if parsed:
            if current_entry:
                entries.append(current_entry)
            current_entry = parsed
        elif current_entry:
            add_links = extract_markdown_links(line_str, repo_base_url)
            if add_links:
                current_entry["links"].extend(add_links)
            cleaned_sub = re.sub(r"^[-*+]\s*", "", line_str)
            cleaned_sub = re.sub(r"(?:→|->|=>|&rarr;)\s*\[[^\]]+\]\([^)]+\)\s*$", "", cleaned_sub).strip()
            if cleaned_sub:
                current_entry["summary"] += " " + cleaned_sub

    if current_entry:
        entries.append(current_entry)

    entries.sort(key=lambda x: x["date"], reverse=True)
    for idx, e in enumerate(entries):
        e["id"] = f"log-{e['date']}-{e['group'].lower()}-{idx + 1}"
    return entries

def merge_log_entries(entries_a, entries_b):
    seen = set()
    merged = []
    for e in (entries_a or []) + (entries_b or []):
        if not e or not e.get("date"):
            continue
        key = f"{e['date']}|{e['group']}|{e.get('summary', '').strip().lower()}"
        if key not in seen:
            seen.add(key)
            merged.append(e)
    merged.sort(key=lambda x: x["date"], reverse=True)
    for idx, e in enumerate(merged):
        e["id"] = f"log-{e['date']}-{e['group'].lower()}-{idx + 1}"
    return merged

def parse_people_index(markdown_text: str):
    """Parse the people table in people/README.md (Name | GitHub | Current group | Personal log)."""
    rows = [
        [c.strip() for c in re.sub(r"^\||\|$", "", line.strip()).split("|")]
        for line in (markdown_text or "").splitlines()
        if line.strip().startswith("|")
    ]
    if len(rows) < 2:
        return []

    header = [h.lower() for h in rows[0]]

    def col(pattern):
        return next((i for i, h in enumerate(header) if re.search(pattern, h)), -1)

    name_col, github_col, group_col, log_col = col("name"), col("github"), col("group"), col("log")
    if name_col < 0 or log_col < 0:
        return []

    people = []
    for r in rows[1:]:
        if all(re.match(r"^:?-+:?$", c) for c in r):
            continue
        log_cell = r[log_col] if log_col < len(r) else ""
        file_match = re.search(r"\(([^)]+\.md)\)", log_cell) or re.search(r"([\w.-]+\.md)", log_cell)
        if not file_match:
            continue
        file = re.sub(r"^\.?/", "", file_match.group(1))
        github_match = re.search(r"@([\w-]+)", r[github_col] if 0 <= github_col < len(r) else "")
        group_label = r[group_col] if 0 <= group_col < len(r) else ""
        group_match = re.search(r"\bG([123])\b", group_label, re.I)
        people.append({
            "name": r[name_col],
            "slug": re.sub(r"\.md$", "", file).split("/")[-1],
            "github": github_match.group(1) if github_match else None,
            "groupLabel": group_label,
            "group": f"G{group_match.group(1)}" if group_match else "ALL",
            "file": file,
        })
    return people


def sync_people_logs(root_dir: Path, output_dir: Path):
    """Compile people/README.md + people/<slug>.md into data/people-log.json and .js."""
    people_dir = root_dir / "people"
    index_path = people_dir / "README.md"
    people = []
    if index_path.exists():
        for person in parse_people_index(index_path.read_text(encoding="utf-8")):
            log_path = people_dir / person["file"]
            text = log_path.read_text(encoding="utf-8") if log_path.exists() else ""
            person["entries"] = parse_activity_logs(text, f"{DEFAULT_REPO_BASE_URL}/people")
            people.append(person)

    payload = {
        "syncedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "people": people
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    with open(output_dir / "people-log.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    with open(output_dir / "people-log.js", "w", encoding="utf-8") as f:
        f.write(f"window.PEOPLE_LOG_DATA = {json.dumps(payload, indent=2, ensure_ascii=False)};\n")

    total = sum(len(p["entries"]) for p in people)
    print(f"[sync-activity-logs.py] Synced {len(people)} people, {total} personal entries to {output_dir / 'people-log.json'}")


def main():
    root_dir = Path(__file__).resolve().parent.parent.parent
    readme_path = Path(os.environ.get("README_PATH", root_dir / "README.md"))
    contributing_path = Path(os.environ.get("CONTRIBUTING_PATH", root_dir / "CONTRIBUTING.md"))
    output_dir = Path(__file__).resolve().parent.parent / "data"
    output_path = output_dir / "activity-log.json"

    print("[sync-activity-logs.py] Reading activity logs...")
    entries = []
    source_files = []

    if readme_path.exists():
        readme_entries = parse_activity_logs(readme_path.read_text(encoding="utf-8"))
        entries = merge_log_entries(entries, readme_entries)
        source_files.append("README.md")
        print(f"[sync-activity-logs.py] Found {len(readme_entries)} entries in {readme_path}")

    if contributing_path.exists():
        contrib_entries = parse_activity_logs(contributing_path.read_text(encoding="utf-8"))
        if contrib_entries:
            entries = merge_log_entries(entries, contrib_entries)
            source_files.append("CONTRIBUTING.md")
            print(f"[sync-activity-logs.py] Found {len(contrib_entries)} additional entries in {contributing_path}")

    stats_groups = {"ALL": 0, "G1": 0, "G2": 0, "G3": 0, "OTHER": 0}
    contributors = set()
    latest_date = None
    earliest_date = None

    for e in entries:
        grp = e["group"] if e["group"] in stats_groups else "OTHER"
        stats_groups[grp] += 1
        d = e["date"]
        if not latest_date or d > latest_date:
            latest_date = d
        if not earliest_date or d < earliest_date:
            earliest_date = d
        if e.get("author"):
            for name in re.split(r"[,/&]+", e["author"]):
                name = name.strip()
                if name:
                    contributors.add(name)

    payload = {
        "syncedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "sourceFiles": source_files if source_files else ["README.md"],
        "sourceFile": " + ".join(source_files) if source_files else "README.md",
        "stats": {
            "total": len(entries),
            "byGroup": stats_groups,
            "latestDate": latest_date,
            "earliestDate": earliest_date,
            "contributorCount": len(contributors),
            "contributors": sorted(list(contributors))
        },
        "entries": entries
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    js_path = output_dir / "activity-log.js"
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(f"window.ACTIVITY_LOG_DATA = {json.dumps(payload, indent=2, ensure_ascii=False)};\n")

    if readme_path.exists():
        try:
            import shutil
            shutil.copyfile(readme_path, output_dir / "README.md")
        except Exception:
            pass

    print(f"[sync-activity-logs.py] Synced {len(entries)} entries to {output_path}")

    sync_people_logs(root_dir, output_dir)

if __name__ == "__main__":
    main()
