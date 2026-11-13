"""Load metro network data into one simple in-memory shape.

Accepts either:
  * a metro-vision CityData JSON (has "lines" and "stations"), or
  * a GeoJSON FeatureCollection following the metro-vision drawing conventions
    (LineString = line/segment with props line/name/status/year/stations...; Point = station).

Returns a dict:
  {
    "name": str,
    "stations": {id: {"id", "name", "nameLocal", "coord": [lng, lat], "approx": bool, "codes": [...]}},
    "lines": [{"id", "name", "code", "color", "group", "status", "opened",
               "segments": [{"stations": [ids], "status", "year", "label", "coords": [[lng, lat], ...]}]}],
  }
Standard library only.
"""
import json
import math
import re
import unicodedata

STATUS_ORDER = ["operating", "construction", "approved", "planned", "proposed"]

_ALIASES = {
    "operating": ["operating", "open", "opened", "existing", "in service", "dang khai thac", "khai thac", "営業中"],
    "construction": ["construction", "under construction", "building", "dang xay dung", "xay dung", "工事中", "建設中"],
    "approved": ["approved", "funded", "phe duyet", "da phe duyet"],
    "planned": ["planned", "plan", "quy hoach", "計画"],
    "proposed": ["proposed", "concept", "idea", "fantasy", "vision", "study", "de xuat", "構想"],
}


def fold(s):
    """Lowercase, strip diacritics (incl. Vietnamese đ), collapse spaces."""
    s = unicodedata.normalize("NFD", str(s or "")).replace("đ", "d").replace("Đ", "d")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s.lower()).strip()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", fold(s)).strip("-")


def norm_status(s):
    f = fold(s)
    for status, words in _ALIASES.items():
        if f in [fold(w) for w in words]:
            return status
    return None


def norm_year(y):
    if y is None or y == "":
        return None
    if isinstance(y, (int, float)):
        return int(y)
    m = re.search(r"(\d{4})", str(y))
    return int(m.group(1)) if m else None


def haversine_km(a, b):
    r = math.pi / 180
    dlat = (b[1] - a[1]) * r
    dlng = (b[0] - a[0]) * r
    h = math.sin(dlat / 2) ** 2 + math.cos(a[1] * r) * math.cos(b[1] * r) * math.sin(dlng / 2) ** 2
    return 12742 * math.asin(min(1, math.sqrt(h)))


def path_km(coords):
    return sum(haversine_km(coords[i - 1], coords[i]) for i in range(1, len(coords)))


def best_status(statuses):
    for s in STATUS_ORDER:
        if s in statuses:
            return s
    return "proposed"


def _project(path, p):
    """(distance_km from p to path, along_km of the closest point)."""
    best = (float("inf"), 0.0)
    acc = 0.0
    kx = 111.32 * math.cos(p[1] * math.pi / 180)
    ky = 110.57
    for i in range(len(path) - 1):
        a, b = path[i], path[i + 1]
        ax, ay = (a[0] - p[0]) * kx, (a[1] - p[1]) * ky
        bx, by = (b[0] - p[0]) * kx, (b[1] - p[1]) * ky
        dx, dy = bx - ax, by - ay
        l2 = dx * dx + dy * dy
        t = max(0.0, min(1.0, -(ax * dx + ay * dy) / l2)) if l2 else 0.0
        x, y = ax + t * dx, ay + t * dy
        d = math.hypot(x, y)
        seg = math.sqrt(l2)
        if d < best[0]:
            best = (d, acc + t * seg)
        acc += seg
    return best


def _from_citydata(data):
    stations = {}
    for s in data.get("stations", []):
        stations[s["id"]] = {
            "id": s["id"], "name": s.get("name", s["id"]), "nameLocal": s.get("nameLocal"),
            "coord": s["coord"], "approx": bool(s.get("approx")), "codes": s.get("codes", []),
        }
    lines = []
    for l in data.get("lines", []):
        segs = []
        for g in l.get("segments", []):
            coords = g.get("path") or [stations[i]["coord"] for i in g["stations"] if i in stations]
            segs.append({"stations": list(g["stations"]), "status": g.get("status", "proposed"),
                         "year": g.get("year"), "label": g.get("label"), "coords": coords})
        lines.append({"id": l["id"], "name": l.get("name", l["id"]), "code": l.get("code"),
                      "color": l.get("color"), "group": l.get("group"), "opened": l.get("opened"),
                      "status": l.get("status") or best_status({g["status"] for g in segs}),
                      "segments": segs})
    return {"name": data.get("name", "city"), "timeline": data.get("timeline"), "stations": stations, "lines": lines}


def _from_geojson(fc, snap_m=150):
    feats = fc.get("features", []) if fc.get("type") == "FeatureCollection" else [fc]
    stations, by_name = {}, {}
    for f in feats:
        g, p = f.get("geometry") or {}, f.get("properties") or {}
        if g.get("type") != "Point" or not p.get("name"):
            continue
        sid = p.get("id") or slug(p["name"]) or f"st-{len(stations)}"
        codes = p.get("codes") or []
        if isinstance(codes, str):
            codes = [c.strip() for c in codes.split(",") if c.strip()]
        st = {"id": sid, "name": p["name"], "nameLocal": p.get("nameLocal"), "coord": g["coordinates"][:2],
              "approx": str(p.get("approx")).lower() in ("true", "yes", "1"), "codes": codes,
              "only": [x.strip() for x in str(p.get("line") or "").split(",") if x.strip()]}
        stations[sid] = st
        by_name[fold(st["name"])] = sid
    lines = {}
    for f in feats:
        g, p = f.get("geometry") or {}, f.get("properties") or {}
        if g.get("type") == "LineString":
            parts = [g["coordinates"]]
        elif g.get("type") == "MultiLineString":
            parts = g["coordinates"]
        else:
            continue
        key = str(p.get("line") or p.get("name") or f"line-{len(lines) + 1}")
        nm = p.get("name") or key
        code = p.get("code")
        # Same id rule as the metro-vision importer: explicit `id`, else from code, else from name.
        auto_id = slug(f"line-{code}" if code and not re.match(r"(?i)^line", nm) else nm)
        line = lines.setdefault(key, {"id": p.get("id") or auto_id, "name": nm,
                                      "code": p.get("code"), "color": p.get("color") or p.get("stroke"),
                                      "group": p.get("group"), "opened": norm_year(p.get("opened")),
                                      "segments": []})
        explicit = p.get("stations")
        if isinstance(explicit, str):
            explicit = [x.strip() for x in explicit.split(",") if x.strip()]
        for part in parts:
            coords = [c[:2] for c in part]
            if explicit:
                ids = [x if x in stations else by_name.get(fold(x)) for x in explicit]
                ids = [i for i in ids if i]
            else:
                hits = []
                for st in stations.values():
                    if st["only"] and key not in st["only"]:
                        continue
                    d, along = _project(coords, st["coord"])
                    if d * 1000 <= (1000 if st["only"] else snap_m):
                        hits.append((along, st["id"]))
                ids = [i for _, i in sorted(hits)]
                # Like the metro-vision importer: bare ends get an approximate auto station.
                total = path_km(coords)
                for end, at in (("start", 0.0), ("end", total)):
                    near = any(abs(along - at) * 1000 <= snap_m for along, _ in hits)
                    if not near and len(coords) > 1:
                        name = p.get("from" if end == "start" else "to") or f"{line['name']} ({end})"
                        sid = slug(name) or f"auto-{len(stations)}"
                        stations.setdefault(sid, {"id": sid, "name": name, "nameLocal": None,
                                                  "coord": coords[0] if end == "start" else coords[-1],
                                                  "approx": True, "codes": [], "only": []})
                        ids = [sid] + ids if end == "start" else ids + [sid]
            line["segments"].append({"stations": ids, "status": norm_status(p.get("status")) or "proposed",
                                     "year": norm_year(p.get("year")), "label": p.get("label"), "coords": coords})
    out = []
    for l in lines.values():
        l["status"] = best_status({s["status"] for s in l["segments"]})
        out.append(l)
    for st in stations.values():
        st.pop("only", None)
    return {"name": fc.get("name", "drawn network"), "timeline": None, "stations": stations, "lines": out}


def load(path, snap_m=150):
    with open(path, encoding="utf-8-sig") as fh:
        data = json.load(fh)
    if isinstance(data, dict) and "lines" in data and "stations" in data:
        return _from_citydata(data)
    if isinstance(data, dict) and data.get("type") in ("FeatureCollection", "Feature"):
        return _from_geojson(data, snap_m)
    raise ValueError(f"{path}: not a metro-vision CityData JSON or GeoJSON FeatureCollection")


def station_lines(net):
    """station id -> ordered list of line ids through it."""
    out = {}
    for l in net["lines"]:
        for s in l["segments"]:
            for sid in s["stations"]:
                lst = out.setdefault(sid, [])
                if l["id"] not in lst:
                    lst.append(l["id"])
    return out
