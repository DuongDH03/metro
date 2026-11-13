#!/usr/bin/env python3
"""Convert a convention GeoJSON (metro-vision drawing format) into KML for Google My Maps / Google Earth.

Usage: python geojson_to_kml.py <in.geojson> <out.kml> [--folder-by group|status|year|none]

- One Folder per value of --folder-by (default: group), so the map opens with toggleable layers.
- Line colours become KML LineStyles (KML colour order is aabbggrr); width 5.
- All properties go into ExtendedData AND a "key: value" description, which the metro-vision
  importer reads back, so the KML round-trips into the importer.
Standard library only.
"""
import json
import sys
from xml.sax.saxutils import escape

KEYS = ["line", "id", "name", "nameLocal", "code", "color", "group", "mode", "status", "year", "label",
        "opened", "lengthKm", "sources", "stations", "description", "codes", "approx"]


def kml_color(hex_color, alpha="ff"):
    h = (hex_color or "#888888").lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"{alpha}{b}{g}{r}".lower()


def coords_str(cs):
    return " ".join(f"{c[0]:.6f},{c[1]:.6f},0" for c in cs)


def placemark(f, style_id):
    p = f.get("properties") or {}
    g = f["geometry"]
    desc = "\n".join(f"{k}: {p[k]}" for k in KEYS if k in p and p[k] not in (None, "") and k != "name")
    ext = "".join(f'<Data name="{escape(k)}"><value>{escape(str(v))}</value></Data>'
                  for k, v in p.items() if v not in (None, "") and not isinstance(v, (dict, list)))
    if g["type"] == "Point":
        geom = f"<Point><coordinates>{coords_str([g['coordinates']])}</coordinates></Point>"
    elif g["type"] == "LineString":
        geom = f"<LineString><tessellate>1</tessellate><coordinates>{coords_str(g['coordinates'])}</coordinates></LineString>"
    elif g["type"] == "MultiLineString":
        geom = "<MultiGeometry>" + "".join(
            f"<LineString><tessellate>1</tessellate><coordinates>{coords_str(part)}</coordinates></LineString>"
            for part in g["coordinates"]) + "</MultiGeometry>"
    else:
        return ""
    style = f"<styleUrl>#{style_id}</styleUrl>" if style_id else ""
    return (f"<Placemark><name>{escape(str(p.get('name', '')))}</name>"
            f"<description>{escape(desc)}</description>{style}"
            f"<ExtendedData>{ext}</ExtendedData>{geom}</Placemark>")


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    src, dst = sys.argv[1], sys.argv[2]
    by = sys.argv[sys.argv.index("--folder-by") + 1] if "--folder-by" in sys.argv else "group"
    with open(src, encoding="utf-8-sig") as fh:
        fc = json.load(fh)
    feats = fc["features"]
    styles, folders = {}, {}
    for f in feats:
        p = f.get("properties") or {}
        sid = None
        if f["geometry"]["type"] != "Point":
            col = p.get("color") or p.get("stroke") or "#888888"
            sid = "s" + col.lstrip("#").lower()
            styles[sid] = (f'<Style id="{sid}"><LineStyle><color>{kml_color(col)}</color><width>5</width></LineStyle></Style>')
            key = str(p.get(by) or "Other") if by != "none" else "Lines"
        else:
            key = "Stations"
        folders.setdefault(key, []).append(placemark(f, sid))
    name = escape(fc.get("name", src))
    body = "".join(f"<Folder><name>{escape(k)}</name>{''.join(v)}</Folder>" for k, v in folders.items())
    kml = (f'<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
           f"<name>{name}</name>{''.join(styles.values())}{body}</Document></kml>\n")
    with open(dst, "w", encoding="utf-8") as fh:
        fh.write(kml)
    print(f"wrote {dst}: {sum(len(v) for v in folders.values())} placemarks in {len(folders)} folders")


if __name__ == "__main__":
    main()
