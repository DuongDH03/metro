#!/usr/bin/env python3
"""Sanity-check and summarise a metro network file (CityData JSON or convention GeoJSON).

Usage: python network_stats.py <file> [--json]

Reports per line: status, km, stations, segments; network totals by status; interchanges;
and problems worth fixing before publishing (long gaps, unattached stations, lonely lines,
stations closer than 300 m on the same line, lines with no interchange).
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from metro_data import STATUS_ORDER, haversine_km, load, path_km, station_lines  # noqa: E402


def analyse(net):
    st_lines = station_lines(net)
    lines, problems = [], []
    km_by_status = {s: 0.0 for s in STATUS_ORDER}
    for l in net["lines"]:
        km = 0.0
        ids = []
        for i, seg in enumerate(l["segments"]):
            k = path_km(seg["coords"]) if len(seg["coords"]) > 1 else 0.0
            km += k
            km_by_status[seg["status"]] = km_by_status.get(seg["status"], 0) + k
            ids += [s for s in seg["stations"] if s not in ids]
            if len(seg["stations"]) < 2:
                problems.append(f"{l['name']} segment {i}: fewer than 2 stations attached (draw through station points, or add a 'stations' list)")
            for a, b in zip(seg["stations"], seg["stations"][1:]):
                sa, sb = net["stations"].get(a), net["stations"].get(b)
                if not sa or not sb:
                    continue
                d = haversine_km(sa["coord"], sb["coord"])
                if d > 6:
                    problems.append(f"{l['name']}: {sa['name']} -> {sb['name']} is {d:.1f} km (missing stations? fine for regional rail)")
                elif d < 0.3:
                    problems.append(f"{l['name']}: {sa['name']} -> {sb['name']} only {d * 1000:.0f} m apart (duplicate station?)")
        transfers = sorted({o for s in ids for o in st_lines.get(s, []) if o != l["id"]})
        if not transfers and len(net["lines"]) > 1:
            problems.append(f"{l['name']}: no interchange with any other line")
        lines.append({"id": l["id"], "name": l["name"], "code": l.get("code"), "status": l["status"],
                      "km": round(km, 1), "stations": len(ids), "segments": len(l["segments"]),
                      "years": sorted({s["year"] for s in l["segments"] if s.get("year")}),
                      "connects_to": transfers})
    used = set(st_lines)
    for sid, st in net["stations"].items():
        if sid not in used:
            problems.append(f"station {st['name']}: not attached to any line")
    inter = sorted(((sid, ls) for sid, ls in st_lines.items() if len(ls) > 1), key=lambda x: -len(x[1]))
    return {
        "name": net["name"],
        "totals": {"lines": len(lines), "stations": len(used), "km": round(sum(l["km"] for l in lines), 1),
                   "km_by_status": {k: round(v, 1) for k, v in km_by_status.items() if v},
                   "interchanges": len(inter),
                   "approx_stations": sum(1 for s in net["stations"].values() if s.get("approx"))},
        "lines": lines,
        "top_interchanges": [{"station": net["stations"][sid]["name"], "lines": ls} for sid, ls in inter[:10]],
        "problems": problems,
    }


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    rep = analyse(load(sys.argv[1]))
    if "--json" in sys.argv:
        print(json.dumps(rep, ensure_ascii=False, indent=1))
        return
    t = rep["totals"]
    print(f"# {rep['name']}: {t['lines']} lines, {t['stations']} stations, {t['km']} km, {t['interchanges']} interchanges, {t['approx_stations']} approx")
    print("km by status: " + ", ".join(f"{k} {v}" for k, v in t["km_by_status"].items()))
    print()
    print("| line | status | km | stations | years | connects to |")
    print("|---|---|---|---|---|---|")
    for l in rep["lines"]:
        print(f"| {l['code'] or ''} {l['name']} | {l['status']} | {l['km']} | {l['stations']} | {', '.join(map(str, l['years']))} | {', '.join(l['connects_to'])} |")
    print()
    print("Top interchanges: " + "; ".join(f"{i['station']} ({len(i['lines'])})" for i in rep["top_interchanges"]))
    print()
    print(f"Problems ({len(rep['problems'])}):")
    for p in rep["problems"][:60]:
        print(" - " + p)
    if len(rep["problems"]) > 60:
        print(f" ... {len(rep['problems']) - 60} more")


if __name__ == "__main__":
    main()
