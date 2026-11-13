#!/usr/bin/env python3
"""Sanity-check and summarise a metro network file (CityData JSON or convention GeoJSON).

Usage: python network_stats.py <file> [--json]

Reports per line: status, km, stations, segments; network totals by status; interchanges;
and problems worth fixing before publishing (long gaps, unattached stations, lonely lines,
stations closer than 300 m on the same line, lines with no interchange).
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from metro_data import STATUS_ORDER, haversine_km, load, path_km, station_lines  # noqa: E402


def _xy(p, lat0):
    return (p[0] * 111.32 * math.cos(math.radians(lat0)), p[1] * 110.57)


def _seg_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    l2 = dx * dx + dy * dy
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) if l2 else 0.0
    return math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1])


def _intersect(a, b, c, d):
    def cross(o, p, q):
        return (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0])
    d1, d2, d3, d4 = cross(c, d, a), cross(c, d, b), cross(a, b, c), cross(a, b, d)
    if (d1 > 0) != (d2 > 0) and (d3 > 0) != (d4 > 0):
        t = d1 / (d1 - d2)
        return (a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]))
    return None


def geometry_checks(net, cell_km=1.0):
    """Crossings without a shared station, and long parallel runs, for lines that aren't all operating.

    Real networks legitimately share corridors, so only pairs where at least one line has
    non-operating segments are reported (that's where a designer can still change things).
    """
    if not net["lines"]:
        return []
    lat0 = next(iter(net["stations"].values()))["coord"][1] if net["stations"] else 0
    edges = []  # (line_id, a_xy, b_xy)
    for l in net["lines"]:
        for s in l["segments"]:
            pts = [_xy(c, lat0) for c in s["coords"]]
            edges += [(l["id"], pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    grid = {}
    for i, (_, a, b) in enumerate(edges):
        for gx in range(int(min(a[0], b[0]) // cell_km), int(max(a[0], b[0]) // cell_km) + 1):
            for gy in range(int(min(a[1], b[1]) // cell_km), int(max(a[1], b[1]) // cell_km) + 1):
                grid.setdefault((gx, gy), []).append(i)
    lines = {l["id"]: l for l in net["lines"]}
    editable = {lid for lid, l in lines.items() if any(s["status"] != "operating" for s in l["segments"])}
    st_xy = {sid: _xy(s["coord"], lat0) for sid, s in net["stations"].items()}
    line_st = {l["id"]: {sid for s in l["segments"] for sid in s["stations"]} for l in net["lines"]}
    out = []

    # 1. crossings with no shared station within 400 m
    seen = set()
    for idxs in grid.values():
        for i in idxs:
            for j in idxs:
                li, lj = edges[i][0], edges[j][0]
                if i >= j or li == lj or not ({li, lj} & editable) or (min(li, lj), max(li, lj)) in seen:
                    continue
                x = _intersect(edges[i][1], edges[i][2], edges[j][1], edges[j][2])
                if not x:
                    continue
                shared = line_st[li] & line_st[lj]
                if any(math.hypot(st_xy[s][0] - x[0], st_xy[s][1] - x[1]) <= 0.4 for s in shared if s in st_xy):
                    continue
                seen.add((min(li, lj), max(li, lj)))
                lng = x[0] / (111.32 * math.cos(math.radians(lat0)))
                out.append(f"{lines[li]['name']} crosses {lines[lj]['name']} near [{lng:.4f}, {x[1] / 110.57:.4f}] "
                           f"with no shared station (add an interchange there?)")

    # 2. parallel runs: sample every 250 m; count samples within 600 m of another line
    near_km = {}
    for l in net["lines"]:
        for s in l["segments"]:
            pts = [_xy(c, lat0) for c in s["coords"]]
            for a, b in zip(pts, pts[1:]):
                n = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) / 0.25))
                for k in range(n):
                    p = (a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n)
                    hit = set()
                    for e in grid.get((int(p[0] // cell_km), int(p[1] // cell_km)), []):
                        oid = edges[e][0]
                        if oid != l["id"] and oid not in hit and _seg_dist(p, edges[e][1], edges[e][2]) <= 0.6:
                            hit.add(oid)
                    for oid in hit:
                        near_km[(l["id"], oid)] = near_km.get((l["id"], oid), 0) + 0.25
    for (a, b), km in sorted(near_km.items(), key=lambda kv: -kv[1]):
        if a < b and km >= 3 and ({a, b} & editable):
            out.append(f"{lines[a]['name']} runs within 600 m of {lines[b]['name']} for ~{km:.0f} km "
                       f"(intentional shared corridor, or merge/move one?)")
    return out


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
    problems += geometry_checks(net)
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
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252
    if any(a in ("-h", "--help") for a in sys.argv) or len(sys.argv) < 2:
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
