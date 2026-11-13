#!/usr/bin/env python3
"""Year-by-year growth of a metro network (CityData JSON or convention GeoJSON).

Usage: python timeline_stats.py <file> [--json] [--from YEAR] [--to YEAR]

Uses the same rule as the metro-vision timeline slider: a segment exists from its `year`;
operating segments without a year exist from the start; other segments without a year only
appear in a final "beyond" bucket. For each year with changes it prints what opened and the
cumulative lines / stations / km, so narration can quote exact numbers.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from metro_data import load, path_km  # noqa: E402

BEYOND = 9999


def build(net):
    segs = []
    for l in net["lines"]:
        for i, s in enumerate(l["segments"]):
            y = s.get("year")
            if y is None:
                y = -1 if s["status"] == "operating" else BEYOND
            segs.append({"line": l, "i": i, "seg": s, "year": y,
                         "km": path_km(s["coords"]) if len(s["coords"]) > 1 else 0.0})
    years = sorted({s["year"] for s in segs})
    seen_lines, seen_st, km = set(), set(), 0.0
    st_lines = {}
    milestones = [25, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000]
    out = []
    for y in years:
        batch = [s for s in segs if s["year"] == y]
        events = []
        km_before = km
        new_inter = []
        for s in batch:
            for sid in s["seg"]["stations"]:
                ls = st_lines.setdefault(sid, set())
                before = len(ls)
                ls.add(s["line"]["id"])
                if before == 1 and len(ls) == 2:
                    new_inter.append(net["stations"].get(sid, {}).get("name", sid))
        for s in batch:
            l, seg = s["line"], s["seg"]
            new_line = l["id"] not in seen_lines
            new_st = [x for x in seg["stations"] if x not in seen_st]
            seen_lines.add(l["id"])
            seen_st.update(seg["stations"])
            km += s["km"]
            first = net["stations"].get(seg["stations"][0], {}).get("name", "?") if seg["stations"] else "?"
            last = net["stations"].get(seg["stations"][-1], {}).get("name", "?") if seg["stations"] else "?"
            events.append({"line": l["name"], "code": l.get("code"), "color": l.get("color"),
                           "new_line": new_line, "status": seg["status"], "label": seg.get("label"),
                           "from": first, "to": last, "km": round(s["km"], 1), "new_stations": len(new_st)})
        out.append({"year": "start" if y == -1 else ("beyond" if y == BEYOND else y), "events": events,
                    "new_interchanges": new_inter,
                    "km_milestones": [m for m in milestones if km_before < m <= km],
                    "cumulative": {"lines": len(seen_lines), "stations": len(seen_st), "km": round(km, 1),
                                   "interchanges": sum(1 for v in st_lines.values() if len(v) > 1),
                                   "approx_stations": sum(1 for sid in seen_st if net["stations"].get(sid, {}).get("approx"))}})
    return out


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252
    if any(a in ("-h", "--help") for a in sys.argv) or len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    args = sys.argv[1:]
    lo = int(args[args.index("--from") + 1]) if "--from" in args else None
    hi = int(args[args.index("--to") + 1]) if "--to" in args else None
    net = load(args[0])
    rows = [r for r in build(net)
            if not isinstance(r["year"], int) or ((lo is None or r["year"] >= lo) and (hi is None or r["year"] <= hi))]
    if "--json" in args:
        print(json.dumps({"name": net["name"], "years": rows}, ensure_ascii=False, indent=1))
        return
    print(f"# {net['name']}: network growth")
    for r in rows:
        c = r["cumulative"]
        print(f"\n## {r['year']}  ->  {c['lines']} lines, {c['stations']} stations ({c['approx_stations']} approx), "
              f"{c['km']} km, {c['interchanges']} interchanges")
        if r["km_milestones"]:
            print(f"* passes {', '.join(str(m) + ' km' for m in r['km_milestones'])}")
        if r["new_interchanges"]:
            more = len(r["new_interchanges"]) - 6
            print(f"* new interchanges: {', '.join(r['new_interchanges'][:6])}{f' (+{more} more)' if more > 0 else ''}")
        for e in r["events"]:
            tag = "NEW LINE " if e["new_line"] else ""
            print(f"- {tag}{(e['code'] or '') + ' ' if e['code'] else ''}{e['line']}: {e['from']} - {e['to']} "
                  f"({e['km']} km, +{e['new_stations']} stations, {e['status']}){' | ' + e['label'] if e['label'] else ''}")


if __name__ == "__main__":
    main()
