// National Rail layer: Thameslink and the main suburban routes inside Greater London, one OSM
// route relation (usually the all-stations service) per corridor, clipped to NR_BOX. Lines
// overlap where services share tracks. Years are the first opening of the railway route to
// London (approximate, line level; Thameslink: the 1988 cross-London service), see
// research/london.md. Colours are operator brand colours, approximate.

export const NR_BOX = { minLng: -0.53, minLat: 51.28, maxLng: 0.33, maxLat: 51.71 };

export const NR_GROUPS = [
  { id: 'national-rail', name: 'National Rail', color: '#6d6e71', description: 'Thameslink and the main suburban National Rail routes inside Greater London, imported from OpenStreetMap and clipped to London (lng -0.53 to 0.33, lat 51.28 to 51.71).' },
  { id: 'nr-thameslink', name: 'Thameslink & Great Northern', parent: 'national-rail', color: '#e9438d' },
  { id: 'nr-southern', name: 'Southern', parent: 'national-rail', color: '#7bb342' },
  { id: 'nr-southeastern', name: 'Southeastern', parent: 'national-rail', color: '#1e9bd7' },
  { id: 'nr-swr', name: 'South Western Railway', parent: 'national-rail', color: '#2b3f8c' },
  { id: 'nr-north-east', name: 'Greater Anglia & c2c', parent: 'national-rail', color: '#c4122f' },
  { id: 'nr-west', name: 'Chiltern, GWR, LNR & Heathrow Express', parent: 'national-rail', color: '#0a7d6b' },
];

export const NR_SOURCES = [
  { id: 'osm-nr', title: 'OpenStreetMap contributors: National Rail route relations (Overpass), ODbL', url: 'https://www.openstreetmap.org/copyright' },
  { id: 'nre-map', title: 'National Rail: London Connections map', url: 'https://www.nationalrail.co.uk/stations/london-connections-map/' },
  { id: 'wiki-thameslink', title: 'Wikipedia: Thameslink (route)', url: 'https://en.wikipedia.org/wiki/Thameslink' },
];

const N = (group, color) => (o) => ({ group, color, mode: 'commuter', batch: 'nr', box: NR_BOX, nr: true, sources: ['osm-nr', 'nre-map'], ...o });
const TL = N('nr-thameslink', '#E9438D');
const GN = N('nr-thameslink', '#3A2C80');
const SN = N('nr-southern', '#7BB342');
const SE = N('nr-southeastern', '#1E9BD7');
const SW = N('nr-swr', '#2B3F8C');
const GA = N('nr-north-east', '#C4122F');
const C2C = N('nr-north-east', '#B7007C');
const W = (color) => N('nr-west', color);

const one = (rel, year, label) => [{ rel, year, ...(label ? { label } : {}) }];

export const NR_LINES = [
  TL({ id: 'thameslink', name: 'Thameslink', opened: 1988, sources: ['osm-nr', 'nre-map', 'wiki-thameslink'],
    description: 'North-south cross-London service through St Pancras, Farringdon, Blackfriars and London Bridge (through running since 1988 via the reopened Snow Hill tunnel; tracks of 1840s-1860s). Branches drawn: Bedford line to Brighton line, Wimbledon and Mitcham Junction loops (Sutton), Catford loop (Orpington / Sevenoaks), Greenwich line (Rainham), Great Northern (Welwyn Garden City).',
    segments: [
      { rel: 6421539, year: 1988, label: 'Bedford – Brighton service (core via St Pancras – Blackfriars – London Bridge – East Croydon)' },
      { rel: 6462676, year: 1988, label: 'Sutton loop via Wimbledon' },
      { rel: 6462677, year: 1988, label: 'Sutton loop via Mitcham Junction' },
      { rel: 16151286, year: 1988, label: 'Catford loop to Orpington' },
      { rel: 15045723, year: 2018, label: 'Greenwich line to Rainham (Thameslink since 2018)' },
      { rel: 6464331, year: 2018, label: 'Great Northern route to Welwyn Garden City (Thameslink via the Canal Tunnels since 2018)' },
    ] }),
  GN({ id: 'gn-northern-city', name: 'Great Northern: Moorgate – Welwyn Garden City / Hertford North', opened: 1904,
    description: 'Northern City Line (Moorgate – Finsbury Park tube tunnels of 1904, part of the Underground until 1975) and the East Coast Main Line / Hertford loop suburban services.',
    segments: [{ rel: 6343225, year: 1904 }, { rel: 9343757, year: 1904, label: 'Hertford loop via Enfield Chase (loop 1910-1918)' }] }),

  SN({ id: 'southern-brighton-main', name: 'Southern: Victoria – East Croydon (Brighton Main Line)', opened: 1860, segments: one(3, 1860, 'Victoria – Clapham Junction – East Croydon (Victoria 1860, Brighton line 1841)') }),
  SN({ id: 'southern-crystal-palace', name: 'Southern: Victoria / London Bridge – Crystal Palace', opened: 1856, segments: one(20961933, 1856) }),
  SN({ id: 'southern-west-croydon', name: 'Southern: Victoria – Crystal Palace – West Croydon', opened: 1856, segments: one(20961984, 1856) }),
  SN({ id: 'southern-tattenham', name: 'Southern: London Bridge – Tattenham Corner', opened: 1856, segments: one(20969030, 1856, 'London Bridge – Purley (1839-1841), Tattenham Corner branch 1897') }),
  SN({ id: 'southern-sutton-tulse-hill', name: 'Southern: London Bridge – Tulse Hill – Sutton', opened: 1868, segments: one(20969178, 1868) }),
  SN({ id: 'southern-epsom', name: 'Southern: Victoria – Epsom', opened: 1847, segments: one(20968904, 1847, 'via Balham, Mitcham Junction and Sutton') }),
  SN({ id: 'southern-epsom-downs', name: 'Southern: Victoria – Epsom Downs', opened: 1865, segments: one(10003043, 1865) }),
  SN({ id: 'southern-caterham', name: 'Southern: London Bridge – Caterham', opened: 1856, segments: one(20969031, 1856) }),
  SN({ id: 'southern-west-london', name: 'Southern: Clapham Junction – Watford Junction', opened: 1863, segments: one(20971126, 1863, 'West London line and West Coast Main Line') }),

  SE({ id: 'se-hayes', name: 'Southeastern: Charing Cross – Hayes', opened: 1857, segments: one(8648175, 1857, 'Mid-Kent line (1857, Hayes 1882)') }),
  SE({ id: 'se-north-kent', name: 'Southeastern: Cannon Street – Dartford via Greenwich / Woolwich', opened: 1849, segments: one(10013395, 1849, 'Greenwich line (London Bridge – Deptford 1836, the first railway in London) and North Kent line (1849)') }),
  SE({ id: 'se-bexleyheath', name: 'Southeastern: Charing Cross – Dartford via Bexleyheath', opened: 1895, segments: one(10013354, 1895) }),
  SE({ id: 'se-sidcup', name: 'Southeastern: Charing Cross – Gravesend via Sidcup', opened: 1866, segments: one(452777, 1866) }),
  SE({ id: 'se-orpington-grove-park', name: 'Southeastern: Cannon Street – Orpington via Grove Park', opened: 1868, segments: one(8649475, 1868) }),
  SE({ id: 'se-orpington-bromley', name: 'Southeastern: Victoria – Orpington via Bromley South', opened: 1860, segments: one(9897352, 1860) }),
  SE({ id: 'se-bromley-north', name: 'Southeastern: Grove Park – Bromley North', opened: 1878, segments: one(19348550, 1878) }),

  SW({ id: 'swr-main', name: 'South Western: Waterloo – Surbiton – Weybridge', opened: 1838, segments: one(8863161, 1838, 'South Western Main Line (Nine Elms 1838, Waterloo 1848)') }),
  SW({ id: 'swr-reading', name: 'South Western: Waterloo – Richmond – Staines (Reading line)', opened: 1846, segments: one(2372136, 1846) }),
  SW({ id: 'swr-windsor', name: 'South Western: Waterloo – Hounslow – Windsor', opened: 1850, segments: one(8862705, 1850) }),
  SW({ id: 'swr-kingston-loop', name: 'South Western: Kingston loop (Waterloo – Twickenham – Kingston – Wimbledon)', opened: 1863, segments: one(8863908, 1863) }),
  SW({ id: 'swr-shepperton', name: 'South Western: Waterloo – Shepperton', opened: 1864, segments: one(8864020, 1864) }),
  SW({ id: 'swr-chessington', name: 'South Western: Waterloo – Chessington South', opened: 1938, segments: one(8646998, 1938, 'Motspur Park – Chessington South (1938-1939)') }),
  SW({ id: 'swr-epsom', name: 'South Western: Waterloo – Epsom – Guildford', opened: 1859, segments: one(8607834, 1859) }),
  SW({ id: 'swr-cobham', name: 'South Western: Waterloo – Cobham – Guildford (New Guildford line)', opened: 1885, batch: 'nr2', segments: one(8618228, 1885) }),

  GA({ id: 'ga-west-anglia', name: 'Greater Anglia: Stratford – Tottenham Hale – Meridian Water', opened: 1840, segments: one(10046699, 1840, 'Lea Valley line (1840); Meridian Water 2019') }),
  GA({ id: 'ga-hertford-east', name: 'Greater Anglia: Liverpool Street – Hertford East', opened: 1840, segments: one(9107254, 1840) }),
  C2C({ id: 'c2c-upminster', name: 'c2c: Fenchurch Street – Upminster – Southend', opened: 1854, segments: one(9950698, 1854, 'London, Tilbury & Southend line (1854; direct line via Upminster 1885-1888)') }),
  C2C({ id: 'c2c-rainham', name: 'c2c: Fenchurch Street – Rainham – Grays', opened: 1854, segments: one(9953359, 1854) }),

  W('#00A9E0')({ id: 'chiltern-high-wycombe', name: 'Chiltern: Marylebone – West Ruislip – High Wycombe', opened: 1906, segments: one(20656530, 1906, 'Marylebone 1899; New North Main Line 1906') }),
  W('#00A9E0')({ id: 'chiltern-amersham', name: 'Chiltern: Marylebone – Harrow-on-the-Hill – Amersham', opened: 1899, segments: one(17887866, 1899, 'Shares Harrow – Amersham with the Metropolitan line') }),
  W('#0A493E')({ id: 'gwr-greenford', name: 'GWR: West Ealing – Greenford', opened: 1904, segments: one(17891199, 1904) }),
  W('#00BF6F')({ id: 'lnr-tring', name: 'London Northwestern: Euston – Watford Junction – Tring', opened: 1837, segments: one(20686446, 1837, 'West Coast Main Line (London & Birmingham Railway, 1837)') }),
  W('#00BF6F')({ id: 'lnr-abbey', name: 'London Northwestern: Watford Junction – St Albans Abbey', opened: 1858, segments: one(11568083, 1858) }),
  W('#532E63')({ id: 'heathrow-express', name: 'Heathrow Express', opened: 1998, segments: one(917523, 1998, 'Paddington – Heathrow non-stop (1998; Terminal 5 2008)') }),
];
