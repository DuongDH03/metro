// Curated metadata for the London dataset. This is the ONLY hand-curated input:
// everything geometric for operating lines (track paths, station positions, stop order) comes
// from OpenStreetMap route relations fetched by build.mjs. Future projects (./future.mjs) are
// curated with approximate stations (approx: true).
//
// Segment spec (OSM-backed):
//   rel       OSM route relation id (one direction)
//   from/to   optional station names cutting a sub-range of the relation's stops
//   fromNth   use the n-th occurrence of `from` (loops that pass a station twice)
//   reverse   reverse the relation's stop order and geometry
//   year      opening year of the section for THIS line's service (see below)
//   status    default 'operating'
// Segment spec (curated): { stops: [{ name, coord, approx, id? }], path?, status, year?, label }
//
// Opening years ("service years"): the year this line's trains, or its direct predecessor in
// today's Underground / TfL network (Metropolitan Railway, District Railway, City & South London
// Railway, TfL Rail...), first carried passengers over that section. Sections that were older
// main-line railways carry the year the Underground / TfL service began; the track's own opening
// year is given in the segment label. Details and sources: research/london.md.
import { FUTURE_LINES, FUTURE_EXTENSIONS, FUTURE_SOURCES, FUTURE_GROUPS } from './future.mjs';
import { NR_LINES, NR_GROUPS, NR_SOURCES } from './national-rail.mjs';

export const ACCESSED = '2026-11-14';
export const BBOX = { minLng: -1.05, minLat: 51.25, maxLng: 0.42, maxLat: 51.76 };

export const GROUPS = [
  { id: 'underground', name: 'London Underground', color: '#dc241f', description: 'The Tube: 11 lines operated by Transport for London.' },
  { id: 'elizabeth', name: 'Elizabeth line', color: '#6950a1', description: 'Crossrail: Reading / Heathrow – central tunnel – Shenfield / Abbey Wood (TfL).' },
  { id: 'dlr', name: 'Docklands Light Railway', color: '#00a4a7', description: 'Automated light metro in Docklands and east London (TfL).' },
  { id: 'overground', name: 'London Overground', color: '#ee7c0e', description: 'TfL suburban rail; six named lines since November 2024.' },
  { id: 'trams', name: 'London Trams', color: '#84b817', description: 'Tramlink in Croydon, Wimbledon, Beckenham and New Addington (TfL).' },
  { id: 'cable-car', name: 'London Cable Car', color: '#e21836', description: 'Cable car across the Thames between Royal Docks and Greenwich Peninsula (TfL).' },
  ...FUTURE_GROUPS,
  ...NR_GROUPS,
];

export const SOURCES = [
  { id: 'osm', title: 'OpenStreetMap contributors (route relations, stations), ODbL', url: 'https://www.openstreetmap.org/copyright' },
  { id: 'tfl-tube-map', title: 'TfL: Tube map and London rail & tube services map', url: 'https://tfl.gov.uk/maps/track' },
  { id: 'tfl-overground-names', title: 'TfL: The new London Overground lines (line names and colours, 2024)', url: 'https://content.tfl.gov.uk/the-new-london-overground-lines.pdf' },
  { id: 'wiki-underground-history', title: 'Wikipedia: History of the London Underground (and the individual line articles)', url: 'https://en.wikipedia.org/wiki/History_of_the_London_Underground' },
  { id: 'wiki-elizabeth', title: 'Wikipedia: Elizabeth line', url: 'https://en.wikipedia.org/wiki/Elizabeth_line' },
  { id: 'wiki-dlr', title: 'Wikipedia: Docklands Light Railway', url: 'https://en.wikipedia.org/wiki/Docklands_Light_Railway' },
  { id: 'wiki-overground', title: 'Wikipedia: London Overground', url: 'https://en.wikipedia.org/wiki/London_Overground' },
  { id: 'wiki-tramlink', title: 'Wikipedia: Tramlink', url: 'https://en.wikipedia.org/wiki/Tramlink' },
  { id: 'wiki-cable-car', title: 'Wikipedia: London cable car', url: 'https://en.wikipedia.org/wiki/London_cable_car' },
  { id: 'timeout-cable-car', title: "Time Out: London's cable car is getting a classic rebrand (2026-04-30)", url: 'https://www.timeout.com/london/news/londons-cable-car-is-getting-a-classic-rebrand-043026' },
  ...FUTURE_SOURCES,
  ...NR_SOURCES,
];

const U = (o) => ({ group: 'underground', mode: 'metro', batch: 'tube', sources: ['osm', 'tfl-tube-map', 'wiki-underground-history'], ...o });
const OG = (o) => ({ group: 'overground', mode: 'commuter', batch: 'other', sources: ['osm', 'tfl-overground-names', 'wiki-overground'], ...o });

const CORE_LINES = [
  // ---------------- London Underground ----------------
  U({ id: 'bakerloo', name: 'Bakerloo line', color: '#B36305', opened: 1906,
    description: "Opened 1906 as the Baker Street & Waterloo Railway. North of Queen's Park it shares the Watford DC line with the Lioness line; Bakerloo trains ran on to Watford Junction 1917-1982.",
    segments: [
      { rel: 7666697, from: 'Elephant & Castle', to: 'Baker Street', year: 1906 },
      { rel: 7666697, from: 'Baker Street', to: 'Edgware Road', year: 1907 },
      { rel: 7666697, from: 'Edgware Road', to: 'Paddington', year: 1913 },
      { rel: 7666697, from: 'Paddington', to: "Queen's Park", year: 1915 },
      { rel: 7666697, from: "Queen's Park", to: 'Willesden Junction', year: 1915 },
      { rel: 7666697, from: 'Willesden Junction', to: 'Harrow & Wealdstone', year: 1917, label: 'Willesden Junction – Harrow & Wealdstone (Watford DC line of 1912-1917)' },
    ] }),
  U({ id: 'central', name: 'Central line', color: '#E32017', opened: 1900,
    description: "Opened 1900 as the Central London Railway (Shepherd's Bush – Bank). The eastern branches (Epping, Hainault loop) and the West Ruislip branch were added in 1946-1949 under the New Works Programme, mostly over former main-line railways.",
    segments: [
      { rel: 102768, from: 'Epping', to: 'Loughton', year: 1949, label: 'Loughton – Epping (Central line from 1949; railway 1865)' },
      { rel: 102768, from: 'Loughton', to: 'Woodford', year: 1948, label: 'Woodford – Loughton (Central line from 1948; railway 1856)' },
      { rel: 102768, from: 'Woodford', to: 'Leytonstone', year: 1947, label: 'Leytonstone – Woodford (Central line from 1947; railway 1856)' },
      { rel: 102768, from: 'Leytonstone', to: 'Stratford', year: 1947, label: 'Stratford – Leytonstone (Central line from 1947; railway 1856)' },
      { rel: 102768, from: 'Stratford', to: 'Liverpool Street', year: 1946 },
      { rel: 102768, from: 'Liverpool Street', to: 'Bank', year: 1912 },
      { rel: 102768, from: 'Bank', to: "Shepherd's Bush", year: 1900, label: 'Central London Railway (1900)' },
      { rel: 102768, from: "Shepherd's Bush", to: 'White City', year: 1908 },
      { rel: 102768, from: 'White City', to: 'North Acton', year: 1920 },
      { rel: 102768, from: 'North Acton', to: 'Greenford', year: 1947 },
      { rel: 102768, from: 'Greenford', to: 'West Ruislip', year: 1948 },
      { rel: 7667069, from: 'Ealing Broadway', to: 'North Acton', year: 1920, label: 'Ealing Broadway branch' },
      { rel: 7667069, from: 'Leytonstone', to: 'Newbury Park', year: 1947, label: 'Hainault loop: Leytonstone – Newbury Park (new tube tunnels)' },
      { rel: 7667069, from: 'Newbury Park', to: 'Hainault', year: 1948, label: 'Hainault loop: Newbury Park – Hainault (railway 1903)' },
      { rel: 7667066, from: 'Woodford', to: 'Hainault', year: 1948, label: 'Hainault loop: Woodford – Hainault (railway 1903)' },
    ] }),
  U({ id: 'circle', name: 'Circle line', color: '#FFD300', textColor: '#000000', opened: 1884,
    description: 'The Inner Circle service of the Metropolitan and District railways began when the loop was completed in 1884; shown as a separate line from 1949. Since December 2009 it runs as a "tea cup": Hammersmith – Edgware Road, then once round the loop back to Edgware Road. It shares all of its track with the Metropolitan, District and Hammersmith & City lines (sections 1863-1884).',
    segments: [
      { rel: 7671006, from: 'Edgware Road', to: 'Edgware Road', year: 1884, label: 'Inner Circle loop (completed 1884)' },
      { rel: 7671006, from: 'Edgware Road', fromNth: 2, to: 'Hammersmith', year: 2009, label: 'Edgware Road – Hammersmith (Circle trains since 2009 on H&C tracks of 1864)' },
    ] }),
  U({ id: 'district', name: 'District line', color: '#00782A', opened: 1868,
    description: 'Opened 1868 as the Metropolitan District Railway (South Kensington – Westminster) and extended west to Hammersmith, Richmond, Ealing and Wimbledon by 1889 and east over the London, Tilbury & Southend line to Upminster.',
    segments: [
      { rel: 102770, from: 'Upminster', to: 'Barking', year: 1902, label: 'Barking – Upminster (District trains 1902-1905, electric District service from 1932; railway 1885)' },
      { rel: 102770, from: 'Barking', to: 'Whitechapel', year: 1902, label: 'Whitechapel – Barking (Whitechapel & Bow Railway 1902, then LT&SR tracks)' },
      { rel: 102770, from: 'Whitechapel', to: 'Mansion House', year: 1884 },
      { rel: 102770, from: 'Mansion House', to: 'Blackfriars', year: 1871 },
      { rel: 102770, from: 'Blackfriars', to: 'Westminster', year: 1870 },
      { rel: 102770, from: 'Westminster', to: 'Gloucester Road', year: 1868, label: 'Metropolitan District Railway (1868)' },
      { rel: 102770, from: 'Gloucester Road', to: "Earl's Court", year: 1869, label: "Gloucester Road – West Brompton shuttle 1869; Earl's Court station 1871" },
      { rel: 102770, from: "Earl's Court", to: 'Hammersmith', year: 1874 },
      { rel: 102770, from: 'Hammersmith', to: 'Turnham Green', year: 1877 },
      { rel: 102770, from: 'Turnham Green', to: 'Ealing Broadway', year: 1879 },
      { rel: 7677290, from: 'Richmond', to: 'Turnham Green', year: 1877, label: 'Richmond branch (District trains since 1877; railway 1869)' },
      { rel: 7677093, from: 'Wimbledon', to: 'Putney Bridge', year: 1889, label: 'Wimbledon branch: Putney Bridge – Wimbledon' },
      { rel: 7677093, from: 'Putney Bridge', to: "Earl's Court", year: 1880, label: "Wimbledon branch: Earl's Court – Putney Bridge (West Brompton 1869)" },
      { rel: 7677093, from: "Earl's Court", to: 'Edgware Road', year: 1871, label: 'Edgware Road branch via High Street Kensington (District trains on the Inner Circle tracks since 1871; dedicated Edgware Road service since 1925)' },
      { rel: 7677092, from: "Earl's Court", to: 'Kensington (Olympia)', year: 1872, label: "Kensington (Olympia) branch (District trains since 1872; today's limited shuttle since 1946)" },
    ] }),
  U({ id: 'hammersmith-city', name: 'Hammersmith & City line', color: '#F3A9BB', textColor: '#000000', opened: 1863,
    description: "Paddington – Farringdon is the original Metropolitan Railway of 10 January 1863, the world's first underground railway. The Hammersmith & City Railway opened in 1864; shown as a separate line since 1990.",
    segments: [
      { rel: 102787, from: 'Hammersmith', to: 'Paddington', year: 1864 },
      { rel: 102787, from: 'Paddington', to: 'Farringdon', year: 1863, label: "Metropolitan Railway, the world's first underground railway (10 January 1863)" },
      { rel: 102787, from: 'Farringdon', to: 'Moorgate', year: 1865 },
      { rel: 102787, from: 'Moorgate', to: 'Liverpool Street', year: 1875 },
      { rel: 102787, from: 'Liverpool Street', to: 'Whitechapel', year: 1884 },
      { rel: 102787, from: 'Whitechapel', to: 'Barking', year: 1936, label: 'Whitechapel – Barking (Metropolitan / H&C trains since 1936 on District tracks)' },
    ] }),
  U({ id: 'jubilee', name: 'Jubilee line', color: '#A0A5A9', opened: 1979,
    description: 'Opened 1979 (Stanmore – Charing Cross), taking over the Bakerloo Stanmore branch (built by the Metropolitan in 1932, Bakerloo from 1939). The Jubilee Line Extension Green Park – Stratford opened in 1999 and the Charing Cross stub closed.',
    segments: [
      { rel: 7673325, from: 'Stanmore', to: 'Wembley Park', year: 1932, label: 'Stanmore branch (Metropolitan 1932, Bakerloo 1939, Jubilee 1979)' },
      { rel: 7673325, from: 'Wembley Park', to: 'Finchley Road', year: 1939, label: 'Wembley Park – Finchley Road (Bakerloo 1939, Jubilee 1979; Metropolitan tracks of 1879-1880)' },
      { rel: 7673325, from: 'Finchley Road', to: 'Baker Street', year: 1939, label: 'Finchley Road – Baker Street tube (Bakerloo 1939, Jubilee 1979)' },
      { rel: 7673325, from: 'Baker Street', to: 'Green Park', year: 1979 },
      { rel: 7673325, from: 'Green Park', to: 'Stratford', year: 1999, label: 'Jubilee Line Extension (1999)' },
    ] }),
  U({ id: 'metropolitan', name: 'Metropolitan line', color: '#9B0056', opened: 1863,
    description: "The Metropolitan Railway opened Paddington – Farringdon on 10 January 1863, the world's first underground railway, and later built out into \"Metro-land\" towards Buckinghamshire.",
    segments: [
      { rel: 102783, from: 'Aldgate', to: 'Liverpool Street', year: 1876 },
      { rel: 102783, from: 'Liverpool Street', to: 'Moorgate', year: 1875 },
      { rel: 102783, from: 'Moorgate', to: 'Farringdon', year: 1865 },
      { rel: 102783, from: 'Farringdon', to: 'Baker Street', year: 1863, label: 'Metropolitan Railway (10 January 1863)' },
      { rel: 102783, from: 'Baker Street', to: 'Finchley Road', year: 1879, label: 'Baker Street – Finchley Road (Swiss Cottage 1868, Finchley Road 1879)' },
      { rel: 102783, from: 'Finchley Road', to: 'Harrow-on-the-Hill', year: 1880 },
      { rel: 102783, from: 'Harrow-on-the-Hill', to: 'Pinner', year: 1885 },
      { rel: 102783, from: 'Pinner', to: 'Rickmansworth', year: 1887 },
      { rel: 102783, from: 'Rickmansworth', to: 'Chalfont & Latimer', year: 1889 },
      { rel: 102783, from: 'Chalfont & Latimer', to: 'Amersham', year: 1892 },
      { rel: 7673614, from: 'Chalfont & Latimer', to: 'Chesham', year: 1889, label: 'Chesham branch' },
      { rel: 7673617, from: 'Harrow-on-the-Hill', to: 'Uxbridge', year: 1904, label: 'Uxbridge branch' },
      { rel: 7673619, from: 'Moor Park', to: 'Watford', year: 1925, label: 'Watford branch' },
    ] }),
  U({ id: 'northern', name: 'Northern line', color: '#5A5A5A', opened: 1890,
    description: "Stockwell – Borough is the City & South London Railway (1890), the world's first deep-level electric tube. The Charing Cross branch began as the Hampstead tube (1907); the two were joined in 1924-1926 and named the Northern line in 1937. High Barnet and Mill Hill East are former main-line branches taken over in 1940-1941. Battersea extension opened in 2021. The official TfL colour is black (#000000); it is drawn dark grey here so that it shows on the dark basemap.",
    segments: [
      { rel: 7702941, from: 'Morden', to: 'Clapham Common', year: 1926 },
      { rel: 7702941, from: 'Clapham Common', to: 'Stockwell', year: 1900 },
      { rel: 7702941, from: 'Stockwell', to: 'Borough', year: 1890, label: "City & South London Railway, the world's first deep-level electric tube (1890)" },
      { rel: 7702941, from: 'Borough', to: 'Moorgate', year: 1900, label: 'Bank branch: Borough – Moorgate' },
      { rel: 7702941, from: 'Moorgate', to: 'Angel', year: 1901, label: 'Bank branch: Moorgate – Angel' },
      { rel: 7702941, from: 'Angel', to: 'Euston', year: 1907, label: 'Bank branch: Angel – Euston' },
      { rel: 7702941, from: 'Euston', to: 'Camden Town', year: 1924, label: 'Bank branch: Euston – Camden Town link (1924)' },
      { rel: 15345228, from: 'Kennington', to: 'Embankment', year: 1926, label: 'Charing Cross branch: Embankment – Kennington' },
      { rel: 15345228, from: 'Embankment', to: 'Charing Cross', year: 1914, label: 'Charing Cross branch' },
      { rel: 15345228, from: 'Charing Cross', to: 'Camden Town', year: 1907, label: 'Charing Cross branch (Hampstead tube, 1907)' },
      { rel: 102767, from: 'Kennington', to: 'Battersea Power Station', year: 2021, label: 'Battersea extension (2021)' },
      { rel: 7702941, from: 'Camden Town', to: 'Golders Green', year: 1907 },
      { rel: 7702941, from: 'Golders Green', to: 'Hendon Central', year: 1923 },
      { rel: 7702941, from: 'Hendon Central', to: 'Edgware', year: 1924 },
      { rel: 7702971, from: 'Camden Town', to: 'Archway', year: 1907, label: 'High Barnet branch: Camden Town – Archway' },
      { rel: 7702971, from: 'Archway', to: 'East Finchley', year: 1939, label: 'High Barnet branch: Archway – East Finchley' },
      { rel: 7702971, from: 'East Finchley', to: 'High Barnet', year: 1940, label: 'High Barnet branch (Northern line from 1940; railway 1872)' },
      { rel: 7702939, year: 1941, label: 'Mill Hill East branch (Northern line from 1941; railway 1867)' },
    ] }),
  U({ id: 'piccadilly', name: 'Piccadilly line', color: '#003688', opened: 1906,
    description: 'Opened 1906 as the Great Northern, Piccadilly & Brompton Railway (Finsbury Park – Hammersmith). Extended in 1932-1933 to Cockfosters and over District tracks to Hounslow and Uxbridge; Heathrow reached in 1977.',
    segments: [
      { rel: 102788, from: 'Cockfosters', to: 'Arnos Grove', year: 1933 },
      { rel: 102788, from: 'Arnos Grove', to: 'Finsbury Park', year: 1932 },
      { rel: 102788, from: 'Finsbury Park', to: 'Hammersmith', year: 1906 },
      { rel: 102788, from: 'Hammersmith', to: 'Acton Town', year: 1932 },
      { rel: 102788, from: 'Acton Town', to: 'Hounslow West', year: 1933, label: 'Heathrow branch: Acton Town – Hounslow West (Piccadilly from 1933; District tracks of 1883-1886)' },
      { rel: 102788, from: 'Hounslow West', to: 'Hatton Cross', year: 1975 },
      { rel: 102788, from: 'Hatton Cross', to: 'Heathrow Terminals 2 & 3', year: 1977 },
      { rel: 102788, from: 'Heathrow Terminals 2 & 3', to: 'Heathrow Terminal 5', year: 2008 },
      { rel: 7703381, from: 'Hatton Cross', to: 'Heathrow Terminal 4', year: 1986, label: 'Terminal 4 loop (one-way: Hatton Cross – T4 – T2&3)' },
      { year: 1986, label: 'Terminal 4 loop: Terminal 4 – Terminals 2 & 3 (one-way; drawn straight)',
        stops: [{ name: 'Heathrow Terminal 4', coord: [-0.4462, 51.4583] }, { name: 'Heathrow Terminals 2 & 3', coord: [-0.4525, 51.4713] }] },
      { rel: 7703384, from: 'Acton Town', to: 'South Harrow', year: 1932, label: 'Uxbridge branch: Acton Town – South Harrow (Piccadilly from 1932; District tracks of 1903)' },
      { rel: 7703384, from: 'South Harrow', to: 'Uxbridge', year: 1933, label: 'Uxbridge branch: South Harrow – Uxbridge (Piccadilly from 1933; District 1910, Metropolitan tracks of 1904)' },
    ] }),
  U({ id: 'victoria', name: 'Victoria line', color: '#0098D4', opened: 1968,
    description: 'The first new tube line across central London since 1907, with automatic train operation from the start.',
    segments: [
      { rel: 6354921, from: 'Walthamstow Central', to: 'Warren Street', year: 1968 },
      { rel: 6354921, from: 'Warren Street', to: 'Victoria', year: 1969 },
      { rel: 6354921, from: 'Victoria', to: 'Brixton', year: 1971 },
    ] }),
  U({ id: 'waterloo-city', name: 'Waterloo & City line', color: '#95CDBA', textColor: '#000000', opened: 1898,
    description: 'Built by the London & South Western Railway (1898) to bring commuters from Waterloo to the City; part of the Underground since 1994.',
    segments: [{ rel: 102762, year: 1898 }] }),

  // ---------------- Elizabeth line ----------------
  { id: 'elizabeth', name: 'Elizabeth line', group: 'elizabeth', mode: 'commuter', color: '#6950A1', opened: 2015, batch: 'other',
    sources: ['osm', 'tfl-tube-map', 'wiki-elizabeth', 'ianvisits-ooc'],
    description: 'Crossrail. TfL Rail took over the Shenfield (2015), Heathrow (2018) and Reading (2019) services; the central tunnel Paddington – Abbey Wood opened on 24 May 2022 and through services began in November 2022. The outer sections run on Great Western (1838-1840) and Great Eastern (1839-1843) main lines. New Elizabeth line platforms at Old Oak Common (between Paddington and Acton Main Line) are under construction with HS2; no separate opening date.',
    segments: [
      { rel: 14773912, from: 'Reading', to: 'Hayes & Harlington', year: 2019, label: 'Reading – Hayes & Harlington (TfL Rail from December 2019; railway 1838-1840)' },
      { rel: 14773906, from: 'Hayes & Harlington', to: 'Paddington', year: 2018, label: 'Hayes & Harlington – Paddington (TfL Rail from May 2018; railway 1838)' },
      { rel: 14773906, from: 'Hayes & Harlington', to: 'Heathrow Terminals 2 & 3', year: 2018, label: 'Heathrow branch (TfL Rail from 2018 on the Heathrow Express tunnels of 1998)' },
      { rel: 14773906, from: 'Heathrow Terminals 2 & 3', to: 'Heathrow Terminal 4', year: 2018 },
      { rel: 14773905, from: 'Heathrow Terminals 2 & 3', to: 'Heathrow Terminal 5', year: 2022, label: 'Terminal 5 branch (Elizabeth line from 2022; sources differ, some say TfL Rail from 2020; Heathrow Express tunnel of 2008)' },
      { rel: 14773912, from: 'Paddington', to: 'Whitechapel', reverse: true, year: 2022, label: 'Central tunnel (opened 24 May 2022)' },
      { rel: 14773912, from: 'Whitechapel', to: 'Abbey Wood', reverse: true, year: 2022, label: 'Abbey Wood branch (2022)' },
      { rel: 14773905, from: 'Whitechapel', to: 'Stratford', year: 2022, label: 'Whitechapel – Stratford tunnel (through trains from November 2022)' },
      { rel: 14773905, from: 'Stratford', to: 'Shenfield', year: 2015, label: 'Stratford – Shenfield (TfL Rail from May 2015; railway 1839-1843)' },
      { rel: 5642190, from: 'Liverpool Street', to: 'Stratford', year: 2015, label: 'Liverpool Street (main line) – Stratford: all TfL Rail trains 2015-2022, now a few peak trains' },
    ] },

  // ---------------- DLR ----------------
  { id: 'dlr', name: 'Docklands Light Railway', code: 'DLR', group: 'dlr', mode: 'lrt', color: '#00A4A7', opened: 1987, batch: 'other',
    sources: ['osm', 'tfl-tube-map', 'wiki-dlr'],
    description: 'Driverless light metro, opened on 31 August 1987 (Tower Gateway / Stratford – Island Gardens) and extended to Bank (1991), Beckton (1994), Lewisham (1999), King George V (2005), Woolwich Arsenal (2009) and Stratford International (2011).',
    segments: [
      { rel: 7772560, from: 'Tower Gateway', to: 'Shadwell', year: 1987 },
      { rel: 7772556, from: 'Bank', to: 'Shadwell', year: 1991, label: 'Bank extension (1991)' },
      { rel: 7772556, from: 'Shadwell', to: 'Westferry', year: 1987 },
      { rel: 7772556, from: 'Westferry', to: 'Island Gardens', year: 1987 },
      { rel: 7772556, from: 'Island Gardens', to: 'Lewisham', year: 1999, label: 'Lewisham extension (1999)' },
      { rel: 7772554, from: 'Stratford', to: 'West India Quay', year: 1987 },
      { rel: 7772558, from: 'Westferry', to: 'Poplar', year: 1987 },
      { rel: 7772560, from: 'Poplar', to: 'Beckton', year: 1994, label: 'Beckton extension (1994)' },
      { rel: 7772558, from: 'Canning Town', to: 'King George V', year: 2005, label: 'London City Airport extension (2005)' },
      { rel: 7772558, from: 'King George V', to: 'Woolwich Arsenal', year: 2009, label: 'Woolwich Arsenal extension (2009)' },
      { rel: 7772551, from: 'Canning Town', to: 'Stratford International', year: 2011, label: 'Stratford International extension (2011, on the former North London line)' },
    ] },

  // ---------------- London Overground ----------------
  OG({ id: 'liberty', name: 'Liberty line', color: '#5D6061', opened: 2015,
    description: 'Romford – Upminster shuttle (railway 1893), London Overground since 2015. Named Liberty in 2024 after the historic freedoms of Havering.',
    segments: [{ rel: 141910, year: 2015 }] }),
  OG({ id: 'lioness', name: 'Lioness line', color: '#FAA61A', textColor: '#000000', opened: 2007,
    description: "Watford DC line Euston – Watford Junction (built 1912-1922), London Overground since November 2007. Shares Queen's Park – Harrow & Wealdstone with the Bakerloo line. Named in 2024 after England's women footballers.",
    segments: [{ rel: 1242272, year: 2007 }] }),
  OG({ id: 'mildmay', name: 'Mildmay line', color: '#0077AD', opened: 2007,
    description: 'North London line Stratford – Richmond and West London line Willesden Junction – Clapham Junction (railways of 1850-1869), London Overground since November 2007. Named in 2024 after the Mildmay Mission Hospital.',
    segments: [
      { rel: 6413186, from: 'Stratford', to: 'Willesden Junction', year: 2007 },
      { rel: 6413186, from: 'Willesden Junction', to: 'Richmond', year: 2007 },
      { rel: 9674326, from: 'Willesden Junction', to: 'Clapham Junction', year: 2007, label: 'West London line' },
    ] }),
  OG({ id: 'suffragette', name: 'Suffragette line', color: '#5BBD72', opened: 2007,
    description: 'Gospel Oak – Barking ("GOBLIN", railways of 1868-1894), London Overground since 2007; extended to Barking Riverside on 18 July 2022. Named in 2024 after the suffragette movement.',
    segments: [
      { rel: 419512, from: 'Gospel Oak', to: 'Barking', year: 2007 },
      { rel: 419512, from: 'Barking', to: 'Barking Riverside', year: 2022, label: 'Barking Riverside extension (2022)' },
    ] }),
  OG({ id: 'weaver', name: 'Weaver line', color: '#823A62', opened: 2015,
    description: "Lea Valley lines from Liverpool Street to Enfield Town, Cheshunt and Chingford (railways of 1840-1891), London Overground since May 2015. Named in 2024 after the area's textile trade.",
    segments: [
      { rel: 9105028, from: 'Liverpool Street', to: 'Hackney Downs', year: 2015 },
      { rel: 9105028, from: 'Hackney Downs', to: 'Edmonton Green', year: 2015 },
      { rel: 9105028, from: 'Edmonton Green', to: 'Enfield Town', year: 2015 },
      { rel: 9105027, from: 'Edmonton Green', to: 'Cheshunt', year: 2015 },
      { rel: 9683729, from: 'Hackney Downs', to: 'Chingford', year: 2015 },
    ] }),
  OG({ id: 'windrush', name: 'Windrush line', color: '#ED1B00', opened: 2010,
    description: 'East London line. The core through the Thames Tunnel (East London Railway, 1869-1876) was part of the Underground from 1884 (Metropolitan East London line) until 2007; it reopened as London Overground in 2010 with new extensions north to Dalston (Highbury & Islington 2011) and south to Crystal Palace and West Croydon, and the link to Clapham Junction in 2012. Named in 2024 after the Windrush generation.',
    segments: [
      { rel: 10107561, from: 'Highbury & Islington', to: 'Dalston Junction', year: 2011 },
      { rel: 10107561, from: 'Dalston Junction', to: 'Whitechapel', year: 2010 },
      { rel: 10107561, from: 'Whitechapel', to: 'Shadwell', year: 1913, label: 'Whitechapel – Shadwell: East London Railway (1876), Metropolitan electric trains 1913-2007, Overground since 2010' },
      { rel: 10107561, from: 'Shadwell', to: 'Surrey Quays', year: 1884, label: 'Shadwell – Surrey Quays through the Thames Tunnel: East London Railway (1869), Underground (Metropolitan / District) 1884-2007, Overground since 2010' },
      { rel: 660463, from: 'Surrey Quays', to: 'New Cross', year: 1884, label: 'New Cross branch (Underground 1884-2007, Overground since 2010)' },
      { rel: 959677, from: 'Surrey Quays', to: 'New Cross Gate', year: 1884, label: 'New Cross Gate branch (Underground 1884-2007, Overground since 2010)' },
      { rel: 959677, from: 'New Cross Gate', to: 'Sydenham', year: 2010 },
      { rel: 959677, from: 'Sydenham', to: 'Crystal Palace', year: 2010 },
      { rel: 10114893, from: 'Sydenham', to: 'West Croydon', year: 2010 },
      { rel: 10107561, from: 'Surrey Quays', to: 'Clapham Junction', year: 2012, label: 'Link to Clapham Junction via Peckham Rye (2012)' },
    ] }),

  // ---------------- Trams ----------------
  { id: 'trams', name: 'London Trams', group: 'trams', mode: 'tram', color: '#84B817', textColor: '#000000', opened: 2000, batch: 'other',
    sources: ['osm', 'tfl-tube-map', 'wiki-tramlink'],
    description: 'Tramlink opened in May 2000, partly on former railway alignments (Wimbledon – West Croydon, the Elmers End and Beckenham Junction branches). Central Croydon is a one-way loop.',
    segments: [
      { rel: 7560898, from: 'Wimbledon', to: 'Centrale', year: 2000 },
      { rel: 142794, from: 'East Croydon', to: 'East Croydon', year: 2000, label: 'Croydon town-centre loop (one-way)' },
      { rel: 7560898, from: 'East Croydon', to: 'Arena', year: 2000 },
      { rel: 7560898, from: 'Arena', to: 'Elmers End', year: 2000 },
      { rel: 8057977, from: 'Arena', to: 'Beckenham Road', year: 2000 },
      { year: 2000, label: 'Beckenham Road – Beckenham Junction (terminal stop missing from the OSM route)',
        stops: [{ name: 'Beckenham Road', coord: [-0.04316, 51.40964] }, { name: 'Beckenham Junction', coord: [-0.0258, 51.4112], approx: true }] },
      { rel: 142794, from: 'New Addington', to: 'Sandilands', year: 2000 },
    ] },

  // ---------------- Cable car ----------------
  { id: 'cable-car', name: 'London Cable Car', group: 'cable-car', color: '#E21836', opened: 2012, batch: 'other',
    sources: ['osm', 'tfl-tube-map', 'wiki-cable-car', 'timeout-cable-car'],
    description: 'Aerial cable car (1 km) across the Thames between Greenwich Peninsula and Royal Docks, opened in June 2012 as the Emirates Air Line, IFS Cloud Cable Car 2022-2026, London Cable Car since the sponsorship ended in March 2026. Included because TfL runs it and draws it on its rail maps; it is not a railway (the data format has no cable-car mode, so none is set).',
    segments: [{ rel: 3018433, year: 2012 }] },
];

for (const [id, ext] of Object.entries(FUTURE_EXTENSIONS)) {
  const line = CORE_LINES.find((l) => l.id === id);
  if (!line) throw new Error(`future extension for unknown line ${id}`);
  line.segments.push(...ext.segments);
  line.sources = [...line.sources, ...ext.sources];
  line.description += ext.description;
}

export const LINES = [...CORE_LINES, ...FUTURE_LINES, ...NR_LINES];

// OSM stop names -> station name used on the map (applied before matching/merging).
export const NAME_ALIASES = {
  'London Euston': 'Euston',
  'London Liverpool Street': 'Liverpool Street',
  'London Paddington': 'Paddington',
  'London Waterloo': 'Waterloo',
  'London Waterloo East': 'Waterloo East',
  'London Victoria': 'Victoria',
  'London Charing Cross': 'Charing Cross',
  'London Cannon Street': 'Cannon Street',
  'London Blackfriars': 'Blackfriars',
  'London Marylebone': 'Marylebone',
  'London Fenchurch Street': 'Fenchurch Street',
  "London King's Cross": "King's Cross St. Pancras",
  'London St Pancras International': "King's Cross St. Pancras",
  'London St. Pancras International': "King's Cross St. Pancras",
  'St Pancras International': "King's Cross St. Pancras",
  'London St Pancras': "King's Cross St. Pancras",
  'West Hampstead Thameslink': 'West Hampstead',
  "King's Cross St Pancras": "King's Cross St. Pancras",
  'Custom House for Excel': 'Custom House',
  'Custom House for ExCeL': 'Custom House',
  'Bromley-By-Bow': 'Bromley-by-Bow',
  'Emerson Park Platform 1': 'Emerson Park',
};

// Display names keyed by normalised name (fixes capitalisation etc.).
export const NAME_OVERRIDES = {};

export const NOTES =
  'Geometry and station positions © OpenStreetMap contributors, ODbL (route relations fetched via Overpass, simplified ~15 m). ' +
  "Opening years are per section: the year this line (or its predecessor company in today's Underground / TfL network) first carried passengers there. Older main-line tracks that were taken over later carry the takeover year, with the track's own year in the segment label (Central line Epping branch 1949, Elizabeth line Shenfield 2015, Overground 2007-2015). The timeline starts with the Metropolitan Railway (1863). " +
  "Interchanges are merged when stations share a name within ~450 m, so Paddington, Edgware Road and Hammersmith (two TfL stations each) are one station here, and King's Cross and St Pancras are one. Differently named out-of-station interchanges stay separate: Bank / Monument, Canary Wharf / Heron Quays, Euston / Euston Square, Shepherd's Bush / Shepherd's Bush Market, Woolwich / Woolwich Arsenal, Stratford / Stratford International. " +
  'Overground line colours follow the 2024 line names (TfL print swatches). Future projects are drawn with approximate stations (approx) and straight lines; see research/london.md for statuses and sources.';
