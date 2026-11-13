#!/usr/bin/env python3
"""Generate fact-checked quiz questions from a metro network (CityData JSON or convention GeoJSON).

Usage: python quiz_bank.py <file> [--n 30] [--seed 7] [--level easy|medium|hard|mixed]

Every answer is computed from the data, so the quiz never invents facts. Prints JSON:
[{"type", "level", "question", "answer", "choices", "explain"}]
"""
import json
import os
import random
import sys
from collections import deque

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from metro_data import load, path_km, station_lines  # noqa: E402


def lname(l):
    return f"{l['code']} {l['name']}" if l.get("code") and l["code"] not in l["name"] else l["name"]


def gen(net, rnd):
    S = net["stations"]
    lines = {l["id"]: l for l in net["lines"]}
    sl = station_lines(net)
    qs = []

    def choices(right, pool, k=4):
        pool = [p for p in dict.fromkeys(pool) if p != right]
        rnd.shuffle(pool)
        c = [right] + pool[: k - 1]
        rnd.shuffle(c)
        return c

    names = [lname(l) for l in lines.values()]
    for sid, ls in sl.items():
        st = S.get(sid)
        if not st:
            continue
        if len(ls) == 1:
            l = lines[ls[0]]
            qs.append({"type": "which-line", "level": "easy",
                       "question": f"Which line serves {st['name']}?", "answer": lname(l),
                       "choices": choices(lname(l), names), "explain": f"{st['name']} is only on {lname(l)}."})
        else:
            qs.append({"type": "interchange-count", "level": "medium",
                       "question": f"How many lines meet at {st['name']}?", "answer": str(len(ls)),
                       "choices": choices(str(len(ls)), [str(n) for n in range(2, 8)]),
                       "explain": f"{st['name']}: " + ", ".join(lname(lines[x]) for x in ls) + "."})
            odd = [l for l in lines.values() if l["id"] not in ls]
            if odd:
                o = rnd.choice(odd)
                opts = [lname(lines[x]) for x in ls[:3]] + [lname(o)]
                rnd.shuffle(opts)
                qs.append({"type": "odd-one-out", "level": "medium",
                           "question": f"Which of these lines does NOT stop at {st['name']}?", "answer": lname(o),
                           "choices": opts, "explain": f"{st['name']} is served by " + ", ".join(lname(lines[x]) for x in ls) + "."})

    for l in lines.values():
        for seg in l["segments"]:
            if seg.get("year") and seg["status"] != "operating" and len(seg["stations"]) >= 2:
                a, b = S[seg["stations"][0]]["name"], S[seg["stations"][-1]]["name"]
                y = seg["year"]
                qs.append({"type": "when", "level": "hard",
                           "question": f"{lname(l)}: {a} to {b} is {seg['status']}. What is its target opening year?",
                           "answer": str(y), "choices": choices(str(y), [str(y + d) for d in (-5, -3, -2, 2, 3, 5)]),
                           "explain": seg.get("label") or f"Target {y} per the plan data."})
            if seg["status"] == "operating" and seg.get("year"):
                qs.append({"type": "history", "level": "medium",
                           "question": f"In what year did this section of {lname(l)} open: {S[seg['stations'][0]]['name']} to {S[seg['stations'][-1]]['name']}?",
                           "answer": str(seg["year"]),
                           "choices": choices(str(seg["year"]), [str(seg["year"] + d) for d in (-6, -4, -2, 2, 4, 6)]),
                           "explain": seg.get("label") or ""})
        stations = [s for seg in l["segments"] for s in seg["stations"]]
        if len(stations) >= 2:
            ends = (S[stations[0]]["name"], S[stations[-1]]["name"])
            km = sum(path_km(s["coords"]) for s in l["segments"] if len(s["coords"]) > 1)
            qs.append({"type": "terminus", "level": "easy",
                       "question": f"{lname(l)} starts at {ends[0]}. Which of these is also on it?",
                       "answer": ends[1],
                       "choices": choices(ends[1], [x["name"] for x in rnd.sample(list(S.values()), min(8, len(S)))
                                                    if x["id"] not in stations]),
                       "explain": f"{lname(l)} is about {km:.0f} km in the data."})
        if l.get("color"):
            qs.append({"type": "color", "level": "easy", "question": f"Which line is drawn in this color: {l['color']}? (show a swatch)",
                       "answer": lname(l), "choices": choices(lname(l), names), "explain": ""})

    # fewest-transfer route puzzles (line graph BFS over station->line)
    ids = [s for s in sl if s in S]
    for _ in range(12):
        if len(ids) < 2:
            break
        a, b = rnd.sample(ids, 2)
        if set(sl[a]) & set(sl[b]):
            continue
        prev = {("L", x): None for x in sl[a]}
        dq = deque(("L", x) for x in sl[a])
        goal = None
        while dq:
            node = dq.popleft()
            if node[1] in sl[b]:
                goal = node
                break
            for seg in lines[node[1]]["segments"]:
                for st in seg["stations"]:
                    for nl in sl.get(st, []):
                        if ("L", nl) not in prev:
                            prev[("L", nl)] = (node, st)
                            dq.append(("L", nl))
        if not goal:
            continue
        path, n = [], goal
        while prev[n]:
            p, via = prev[n]
            path.append((p[1], via, n[1]))
            n = p
        path.reverse()
        transfers = len(path)
        steps = " -> ".join(f"{lname(lines[p])} to {S[v]['name']}, change to {lname(lines[q])}" for p, v, q in path) or "direct"
        qs.append({"type": "route", "level": "hard",
                   "question": f"Fewest changes from {S[a]['name']} to {S[b]['name']} (full future network)?",
                   "answer": str(transfers), "choices": choices(str(transfers), ["0", "1", "2", "3", "4"]),
                   "explain": steps})
    return qs


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    a = sys.argv[1:]
    n = int(a[a.index("--n") + 1]) if "--n" in a else 30
    seed = int(a[a.index("--seed") + 1]) if "--seed" in a else None
    level = a[a.index("--level") + 1] if "--level" in a else "mixed"
    rnd = random.Random(seed)
    qs = gen(load(a[0]), rnd)
    if level != "mixed":
        qs = [q for q in qs if q["level"] == level]
    # spread question types
    by_type = {}
    for q in qs:
        by_type.setdefault(q["type"], []).append(q)
    for v in by_type.values():
        rnd.shuffle(v)
    picked = []
    while len(picked) < n and any(by_type.values()):
        for t in list(by_type):
            if by_type[t] and len(picked) < n:
                picked.append(by_type[t].pop())
    rnd.shuffle(picked)
    print(json.dumps(picked, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
