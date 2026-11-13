#!/usr/bin/env python3
"""Sync shared helpers into each skill and package them as .skill files (zip) in skills/dist/.

Usage: python skills/build_skills.py
Shared sources live in skills/_shared/; edit them there, never in the per-skill copies.
"""
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SHARED = ROOT / "_shared"
DIST = ROOT / "dist"

# skill -> files from _shared to bundle (scripts/ or references/)
BUNDLES = {
    "metro-city-research": ["references/conventions.md", "scripts/metro_data.py", "scripts/network_stats.py"],
    "fantasy-metro-designer": ["references/conventions.md", "scripts/metro_data.py", "scripts/network_stats.py",
                               "scripts/geojson_to_kml.py"],
    "metro-plan-update": ["references/conventions.md"],
    "metro-timeline-story": ["scripts/metro_data.py", "scripts/timeline_stats.py"],
    "metro-quiz": ["scripts/metro_data.py", "scripts/quiz_bank.py"],
}


def main():
    DIST.mkdir(exist_ok=True)
    for skill, files in BUNDLES.items():
        sdir = ROOT / skill
        for sub in ("scripts", "references"):
            shutil.rmtree(sdir / sub, ignore_errors=True)
        for rel in files:
            dst = sdir / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(SHARED / Path(rel).name, dst)
        out = DIST / f"{skill}.skill"
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
            for f in sorted(sdir.rglob("*")):
                if f.is_file() and "__pycache__" not in f.parts and f.suffix != ".pyc":
                    z.write(f, f.relative_to(ROOT))
        print(f"{out.name}: {len(z.namelist())} files")


if __name__ == "__main__":
    main()
