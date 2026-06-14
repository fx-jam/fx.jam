#!/usr/bin/env python3
"""Ingest MEMORY.md / CLAUDE_LOG.md updates into Hermes memory.
Run after git pull to detect new entries from Claude Desktop."""

import subprocess, re, json, os, hashlib, time
from pathlib import Path

PROJECT = Path(os.path.expanduser("~/projects/fx.jam"))
MEMORY_FILE = PROJECT / "MEMORY.md"
CACHE_FILE = Path(os.path.expanduser("~/.hermes/memory_sync_cache.json"))

def git_pull():
    """Pull latest changes from origin main."""
    result = subprocess.run(
        ["git", "pull", "--rebase", "origin", "main"],
        cwd=PROJECT, capture_output=True, text=True, timeout=30
    )
    return result.stdout + result.stderr

def get_file_hash(path: Path) -> str:
    """Get MD5 of file content."""
    if not path.exists():
        return ""
    return hashlib.md5(path.read_text(errors="replace").encode()).hexdigest()

def load_cache():
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    return {"memory_hash": "", "log_hash": "", "last_ingested": 0}

def save_cache(cache):
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, indent=2))

def extract_new_sections(text: str) -> list:
    """Extract journal entries from MEMORY.md."""
    entries = []
    # Find Journal de synchro section
    if "## 🔄 Journal de synchro bilatérale" in text:
        journal_section = text.split("## 🔄 Journal de synchro bilatérale")[1]
        if "## " in journal_section:
            journal_section = journal_section.split("\n## ")[0]
        
        # Find individual entries (lines starting with ### or dates)
        for line in journal_section.split("\n"):
            line = line.strip()
            if line and (line.startswith("###") or re.match(r"^\d{4}-\d{2}-\d{2}", line)):
                entries.append(line)
    
    return entries

def ingest_into_memory(content: str, source: str):
    """
    This function would call the Hermes memory tool.
    Since we can't call tools from within a cron agent script,
    we write to a queue file that the cron agent processes.
    """
    queue_file = Path(os.path.expanduser("~/.hermes/memory_queue.json"))
    queue = []
    if queue_file.exists():
        queue = json.loads(queue_file.read_text())
    
    queue.append({
        "timestamp": time.time(),
        "source": source,
        "content": content.strip()
    })
    
    queue_file.write_text(json.dumps(queue, indent=2))
    print(f"✓ Queued {len(content)} chars from {source}")

def main():
    print("=== Memory Sync: Hermes side ===")
    
    # 1. Git pull
    pull_output = git_pull()
    print(f"Git: {pull_output[:200]}")
    
    # 2. Check MEMORY.md changes
    cache = load_cache()
    current_hash = get_file_hash(MEMORY_FILE)
    
    if current_hash != cache["memory_hash"] and MEMORY_FILE.exists():
        print("📝 MEMORY.md has changed, scanning for new entries...")
        text = MEMORY_FILE.read_text(encoding="utf-8", errors="replace")
        entries = extract_new_sections(text)
        if entries:
            for entry in entries:
                print(f"   Found: {entry[:80]}")
            # Queue for ingestion by next Hermes session
            ingest_into_memory("\n".join(entries), "MEMORY.md")
        cache["memory_hash"] = current_hash
    
    # 3. Check CLAUDE_LOG.md changes
    log_file = PROJECT / "CLAUDE_LOG.md"
    log_hash = get_file_hash(log_file)
    
    if log_hash != cache.get("log_hash", ""):
        print("📝 CLAUDE_LOG.md has changed, scanning for new sessions...")
        if log_file.exists():
            text = log_file.read_text(encoding="utf-8", errors="replace")
            # Extract session headers (## Session)
            sessions = re.findall(r"## Session[^\n]*", text)
            for session in sessions:
                print(f"   New session: {session.strip()}")
            ingest_into_memory("\n".join(sessions), "CLAUDE_LOG.md")
        cache["log_hash"] = log_hash
    
    cache["last_ingested"] = time.time()
    save_cache(cache)
    print("=== Sync complete ===")

if __name__ == "__main__":
    main()