#!/usr/bin/env python3
"""Find coordinates for stations / places / street intersections via OpenStreetMap Nominatim.

Usage:
  python geocode.py --city "Da Nang, Vietnam" "Han Market" "Dragon Bridge" "Nguyen Van Linh & Dien Bien Phu"
  python geocode.py --city "Hanoi" --file places.txt        (one query per line)
  python geocode.py --city "Da Nang" --near 108.21,16.06 --radius 8 "Le Duan & Ong Ich Khiem"
  add --json for machine-readable output

- "A & B" finds the intersection of two streets (best effort, ~30-60 s per new street because it
  queries the Overpass API): all ways of both streets within the search box are fetched and their
  meeting point returned. If they don't meet within 150 m you get null + advice, never a guess.
- --city biases the search to that city: appended to the query, and results are limited to
  --radius km (default 15) around its centre, or around --near lng,lat (e.g. a district).
- Respects Nominatim's policy: max 1 request/second, generic User-Agent, results cached in
  metro-geocode-cache.json in the temp folder. Never sends anything but the place queries.
Output: [lng, lat] (GeoJSON order) or null when nothing was found; check results on a map.
"""
import json
import math
import os
import sys
import tempfile
import time
import urllib.parse
import urllib.request

UA = "metro-map-skill-geocoder/1.0"
CACHE = os.path.join(tempfile.gettempdir(), "metro-geocode-cache.json")
_last = [0.0]


def _load_cache():
    try:
        with open(CACHE, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


def _save_cache(cache):
    try:
        with open(CACHE, "w", encoding="utf-8") as fh:
            json.dump(cache, fh)
    except OSError:
        pass  # read-only or sandboxed: caching is optional


def _get(params):
    key = json.dumps(params, sort_keys=True)
    cache = _load_cache()
    if key in cache:
        return cache[key]
    wait = 1.1 - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({**params, "format": "jsonv2"})
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        print(f"warning: OpenStreetMap lookup failed ({e}); is the network blocked?", file=sys.stderr)
        return []
    _last[0] = time.time()
    cache[key] = data
    _save_cache(cache)
    return data


def _city_box(city, radius_km=15.0, near=None):
    """Search box (w,n,e,s) of radius_km around the city centre (or `near` = [lng, lat]).

    Deliberately not the administrative bounding box: merged cities/provinces can be 200 km wide,
    which makes street searches slow and ambiguous.
    """
    if near is None:
        res = _get({"q": city, "limit": 1})
        if not res:
            return None
        near = [float(res[0]["lon"]), float(res[0]["lat"])]
    dlat = radius_km / 110.57
    dlng = radius_km / (111.32 * math.cos(math.radians(near[1])))
    return f"{near[0] - dlng},{near[1] + dlat},{near[0] + dlng},{near[1] - dlat}"


def _points(geo):
    t, c = geo.get("type"), geo.get("coordinates")
    if t == "Point":
        return [c]
    if t == "LineString":
        return c
    if t in ("MultiLineString", "Polygon"):
        return [p for part in c for p in part]
    if t == "MultiPolygon":
        return [p for poly in c for part in poly for p in part]
    return []


def _dist_m(a, b):
    k = math.cos(math.radians((a[1] + b[1]) / 2))
    return math.hypot((a[0] - b[0]) * 111320 * k, (a[1] - b[1]) * 110570)


_VARIANTS = {
    "a": "aàáạảãâầấậẩẫăằắặẳẵ", "e": "eèéẹẻẽêềếệểễ", "i": "iìíịỉĩ", "o": "oòóọỏõôồốộổỗơờớợởỡ",
    "u": "uùúụủũưừứựửữ", "y": "yỳýỵỷỹ", "d": "dđ",
}


def _fold_regex(name):
    """'Xuan Thuy' -> regex matching 'Xuân Thủy', 'Đường Xuân Thủy', 'Xuan Thuy Road'... (accent-insensitive)."""
    import unicodedata
    base = "".join(c for c in unicodedata.normalize("NFD", name.replace("đ", "d").replace("Đ", "D"))
                   if unicodedata.category(c) != "Mn").lower()
    out = []
    for ch in base:
        v = _VARIANTS.get(ch)
        out.append(f"[{v}{v.upper()}]" if v else ("[ -]" if ch == " " else (ch if ch.isalnum() else ".")))
    return "".join(out)


def _overpass_ways(name, box):
    """All road geometries whose name contains `name` (accent-insensitive) inside box (w,n,e,s).

    Keep the box small (the --radius default of 15 km): regex queries over a whole province time out.
    """
    w, n, e, s = map(float, box.split(","))
    bb = f"{min(s, n):.5f},{min(w, e):.5f},{max(s, n):.5f},{max(w, e):.5f}"
    key = json.dumps({"overpass": name, "bbox": bb})
    cache = _load_cache()
    if key in cache:
        return cache[key]
    q = f'[out:json][timeout:60];way[highway][name~"{_fold_regex(name)}",i]({bb});out geom;'
    data = None
    for url in ("https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"):
        try:
            req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": q}).encode(),
                                         headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                data = json.loads(r.read().decode("utf-8"))
            break
        except Exception:  # noqa: BLE001 - try the next mirror
            time.sleep(2)
    ways = [[[pt["lon"], pt["lat"]] for pt in el.get("geometry", [])] for el in (data or {}).get("elements", [])]
    if data is not None:
        cache[key] = ways
        _save_cache(cache)
    return ways


def _closest_pair(pa, pb, cell=0.005):
    """Closest points between two point sets via a ~500 m grid (fast for city-sized street lists)."""
    if not pa or not pb:
        return None
    grid = {}
    for y in pb:
        grid.setdefault((int(y[0] // cell), int(y[1] // cell)), []).append(y)
    best = None
    for x in pa:
        cx, cy = int(x[0] // cell), int(x[1] // cell)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for y in grid.get((cx + dx, cy + dy), ()):
                    d = _dist_m(x, y)
                    if best is None or d < best[0]:
                        best = (d, [(x[0] + y[0]) / 2, (x[1] + y[1]) / 2])
    if best:
        return best
    # Nothing within ~500 m: coarse search on a subsample just to report the gap.
    sa, sb = pa[:: max(1, len(pa) // 400)], pb[:: max(1, len(pb) // 400)]
    return min(((_dist_m(x, y), [(x[0] + y[0]) / 2, (x[1] + y[1]) / 2]) for x in sa for y in sb),
               key=lambda t: t[0])


def geocode(q, city=None, box=None):
    base = {"limit": 5}
    if box:
        base.update({"viewbox": box, "bounded": 1})
    if "&" in q:
        a, b = [x.strip() for x in q.split("&", 1)]
        # Streets are split into many OSM ways: fetch plenty of candidates for each, and keep only
        # road geometries (free text often matches a neighbourhood or village of the same name).
        def street(name):
            res = []
            if city:
                res = _get({"limit": 40, "polygon_geojson": 1, "street": name, "city": city.split(",")[0]})
            if not res:
                res = _get({**base, "limit": 40, "polygon_geojson": 1, "q": f"{name}, {city}" if city else name})
            roads = [r for r in res if r.get("category") == "highway" or
                     (r.get("geojson") or {}).get("type") in ("LineString", "MultiLineString")]
            return roads or res
        if box:  # Overpass returns *all* ways of a street; Nominatim only a few
            pa = [p for way in _overpass_ways(a, box) for p in way]
            pb = [p for way in _overpass_ways(b, box) for p in way]
        else:
            pa = pb = []
        if not pa or not pb:
            ra, rb = street(a), street(b)
            pa = pa or [p for r in ra for p in _points(r.get("geojson", {}))]
            pb = pb or [p for r in rb for p in _points(r.get("geojson", {}))]
        best = _closest_pair(pa, pb)
        if best:
            d = best[0]
            if d < 150:
                return {"query": q, "coord": [round(best[1][0], 6), round(best[1][1], 6)],
                        "note": f"streets meet (within {d:.0f} m)"}
            return {"query": q, "coord": None,
                    "note": f"no crossing found (closest {d / 1000:.1f} km apart): streets may not meet, the name "
                            "may differ in OSM, or OpenStreetMap timed out. Try another cross street, a landmark, "
                            "or estimate and mark approx"}
        return {"query": q, "coord": None, "note": "street(s) not found"}
    res = _get({**base, "q": f"{q}, {city}" if city else q})
    if not res and box:
        res = _get({"limit": 5, "q": f"{q}, {city}" if city else q})
    if not res:
        return {"query": q, "coord": None, "note": "not found"}
    r = res[0]
    return {"query": q, "coord": [round(float(r["lon"]), 6), round(float(r["lat"]), 6)],
            "note": f"{r.get('category', '')}/{r.get('type', '')}: {r.get('display_name', '')[:80]}"}


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252
    a = sys.argv[1:]
    if not a or any(x in ("-h", "--help") for x in a):
        print(__doc__)
        sys.exit(2)
    city = a[a.index("--city") + 1] if "--city" in a else None
    queries = []
    skip = set()
    for i, x in enumerate(a):
        if x in ("--city", "--file", "--radius", "--near"):
            skip.add(i + 1)
    for i, x in enumerate(a):
        if i in skip or x.startswith("--"):
            continue
        queries.append(x)
    if "--file" in a:
        with open(a[a.index("--file") + 1], encoding="utf-8") as fh:
            queries += [ln.strip() for ln in fh if ln.strip()]
    radius = float(a[a.index("--radius") + 1]) if "--radius" in a else 15.0
    near = [float(x) for x in a[a.index("--near") + 1].split(",")] if "--near" in a else None
    box = _city_box(city, radius, near) if (city or near) else None
    out = [geocode(q, city, box) for q in queries]
    if "--json" in a:
        print(json.dumps(out, ensure_ascii=False, indent=1))
    else:
        for r in out:
            print(f"{r['query']}\t{r['coord']}\t{r['note']}")


if __name__ == "__main__":
    main()
