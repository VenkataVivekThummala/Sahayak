"""Knowledge base loader for schemes, fields, and evaluation datasets."""
import json
import hashlib
from functools import lru_cache
from typing import Dict, List, Any, Optional
from .config import DATA_DIR

@lru_cache(maxsize=1)
def load_schemes() -> List[Dict[str, Any]]:
    """Load the full list of schemes from schemes.json."""
    path = DATA_DIR / "schemes.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@lru_cache(maxsize=1)
def load_schemes_by_id() -> Dict[str, Dict[str, Any]]:
    """Return dictionary of schemes indexed by scheme_id."""
    schemes = load_schemes()
    return {s["scheme_id"]: s for s in schemes}

@lru_cache(maxsize=1)
def load_fields() -> Dict[str, Dict[str, Any]]:
    """Load eligibility question fields specification."""
    path = DATA_DIR / "fields.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@lru_cache(maxsize=1)
def load_eval_set() -> Dict[str, Any]:
    """Load evaluation test suite."""
    path = DATA_DIR / "eval_set.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_dataset_version() -> str:
    """Compute deterministic SHA-256 hash representing the current dataset version."""
    hasher = hashlib.sha256()
    for filename in sorted(["schemes.json", "fields.json", "eval_set.json"]):
        p = DATA_DIR / filename
        if p.exists():
            with open(p, "rb") as f:
                hasher.update(f.read())
    return hasher.hexdigest()[:12]

def get_primary_source(sources: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
    """Return primary source, preferring official > government-portal > secondary."""
    priority = {"official": 1, "government-portal": 2, "secondary": 3}
    if not sources:
        return None
    sorted_sources = sorted(sources, key=lambda s: priority.get(s.get("type", "secondary"), 4))
    return sorted_sources[0]
