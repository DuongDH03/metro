---
name: metro-timeline-story
description: Turn a metro network's growth over the years into a story - a narrated video script with timestamps (like the "Hanoi Metro 2021–2045, 50-year plan" animation videos), on-screen captions as an .srt subtitle file, a social-media thread, or a short article - with exact per-year numbers (lines, stations, km) computed from the data, not guessed. Use it whenever someone wants to explain, narrate, animate, present or post about how a metro network grows or will grow, needs a voice-over or subtitles for a map timelapse or screen recording, or asks "tell the story of X's metro" - real plans or fantasy maps alike.
---

# Metro timeline story

The best metro timelapse videos work because every beat lands on a real number at the right moment:
"2030: Line 5 opens to Hoa Lac. The network passes 100 km." This skill computes those numbers from data
and writes narration that is exciting but never invents facts.

## 1. Get the data
Preferred: a metro-vision CityData JSON (`public/data/<city>.json`) or a convention GeoJSON (real plan or
fantasy). Without a file, research the plan first (the metro-city-research skill does that), or, for a
quick story, build a small table of sections with years from reliable sources and cite them.

Run: `python scripts/timeline_stats.py <file>` (add `--json` to post-process, `--from/--to` to
crop). It lists, for each year with changes, what opens (new line or extension, endpoints, km, new
stations, status) and the cumulative totals. Same rules as the metro-vision timeline slider, so a screen
recording of the app's Play button matches the script.

## 2. Find the story
Pick 5–9 beats from the year list: the first line, the first interchange, the year the network
"becomes a network" (first ring or 3+ lines meeting), the big construction wave, milestones like 100/200/500 km,
the airport link, the final horizon. Group quiet years. Distinguish clearly what *exists* (operating) from
what is *under construction* and what is only *planned*: say "is due to open", "is planned for", not "opens".
For fantasy networks, say up front that it's a fan concept.

## 3. Write the deliverable(s) the user asked for (default: video script + SRT)

**Video script** (markdown table): `time | on screen (map state, year counter, highlight) | narration | caption`.
Pace ~2.5 words/second of narration; 4–8 s per year beat, longer for big moments; total 60–180 s
unless asked otherwise. Start with a hook ("In 2021, Hanoi had zero metro lines. By 2045 it plans to
have eighteen."), end with the final-state numbers and a question or call to action.

**SRT captions** (`<city>-timeline.srt`): numbered cues, `HH:MM:SS,mmm --> HH:MM:SS,mmm`, ≤ 42 characters per
line, ≤ 2 lines per cue, timed to the script. Captions carry the year and the key fact.

**Recording tip for the metro-vision app:** open `#<city>`, set the timeline to the first year, press
Play (one year per tick), and record. Align narration beats to the year counter. Mention which years to pause on.

**Thread / article** (on request): one post per beat, each with the year, the change and one number; first
post is the hook, last post the final map with sources.

## 4. Check
Every number in the script must appear in the timeline_stats output (or a cited source). Re-read for tense
(planned ≠ open), and list sources at the end of the script.
