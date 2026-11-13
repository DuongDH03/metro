// Future London rail projects (status as of 2026-11-14, see research/london.md).
// Stations are approximate (approx: true) unless they are existing stations, which snap to the
// real station by name. Lines are straight between stations (alignments are not published in
// enough detail, or are only safeguarding corridors).
//
// FUTURE_EXTENSIONS: extra segments appended to existing lines (by line id).
// FUTURE_LINES: new lines.

const P = 'planned', PR = 'proposed', C = 'construction';
const s = (name, coord, approx = true, id) => ({ name, coord, ...(approx ? { approx } : {}), ...(id ? { id } : {}) });

export const FUTURE_GROUPS = [
  { id: 'hs2', name: 'High Speed 2', color: '#1c4e80', description: 'HS2 (DfT / HS2 Ltd), London section: Euston – Old Oak Common, then tunnels and the Colne Valley Viaduct towards Birmingham.' },
];

export const FUTURE_SOURCES = [
  { id: 'ianvisits-ble-2026', title: 'ianVisits: Bakerloo line extension gets Budget boost from local tax powers (2026-10-28)', url: 'https://www.ianvisits.co.uk/articles/bakerloo-line-extension-gets-budget-boost-from-local-tax-powers-93641/' },
  { id: 'ldrs-ble-2026', title: 'LDRS / Yahoo News: TfL confirms when public will be consulted on Bakerloo line extension (2026-05-20)', url: 'https://uk.news.yahoo.com/tfl-confirms-public-consulted-bakerloo-153116381.html' },
  { id: 'tfl-dlr-thamesmead', title: 'TfL press release PN-134: strong public backing for DLR extension to Beckton Riverside and Thamesmead as Government greenlights scheme (2025-12-15)', url: 'https://tfl-newsroom.prgloo.com/news/tfl-consultation-shows-strong-public-backing-for-dlr-extension-to-beckton-riverside-and-thamesmead-as-government-greenlights-scheme' },
  { id: 'ianvisits-dlr-2026', title: 'ianVisits: TfL confirms it will apply for DLR extension to Thamesmead in early 2027 (2026-10-08)', url: 'https://www.ianvisits.co.uk/articles/?p=93118' },
  { id: 'timeout-cr2-2025', title: 'Time Out: Crossrail 2 (Euston St. Pancras shaft in the British Library extension; scheme paused since 2020) (2025-08-22)', url: 'https://www.timeout.com/london/news/new-london-train-route-crossrail-2-will-begin-construction-next-year-082225' },
  { id: 'wiki-cr2', title: 'Wikipedia: Crossrail 2 (route, 2015 safeguarding, 2020 pause)', url: 'https://en.wikipedia.org/wiki/Crossrail_2' },
  { id: 'timeout-wlo-2026', title: 'Time Out: West London Orbital map and consultation (2026-09-23)', url: 'https://timeout.com/london/news/west-london-orbital-overground-line-map-consultation-092326' },
  { id: 'wiki-wlo', title: 'Wikipedia: West London Orbital (TfL release 2026-03-05, FOI 2026-10)', url: 'https://en.wikipedia.org/wiki/West_London_Orbital' },
  { id: 'london-now-c2e', title: 'London Now: The Elizabeth line ends at Abbey Wood, not Dartford (TfL FOI, autumn 2026)', url: 'https://www.london-now.co.uk/news/26673908.elizabeth-line-ends-abbey-wood-not-dartford/' },
  { id: 'gov-hs2-reset', title: 'GOV.UK: Transport Secretary ends era of neglect on HS2 with thorough reset (2026-05-19)', url: 'https://www.gov.uk/government/news/transport-secretary-ends-era-of-neglect-on-hs2-with-thorough-reset' },
  { id: 'hs2-update', title: 'HS2 Ltd: HS2 project update', url: 'https://www.hs2.org.uk/hs2-project-update/' },
  { id: 'ce-hs2-euston', title: 'Construction Enquirer: HS2 reset hinges on contractor deals and £8bn Euston plan (2026-06-29)', url: 'https://www.constructionenquirer.com/2026/06/29/hs2-reset-hinges-on-contractor-deals-and-8bn-euston-plan/' },
  { id: 'ianvisits-ooc', title: "ianVisits: Inside Old Oak Common as London's new 14-platform station takes shape (2026-08-18)", url: 'https://ianvisits.co.uk/articles/inside-old-oak-common-as-londons-new-14-platform-station-takes-shape-91856' },
  { id: 'wiki-sutton-link', title: 'Wikipedia: Sutton Link (shelved by TfL, September 2023)', url: 'https://en.wikipedia.org/wiki/Sutton_Link' },
  { id: 'wiki-croxley', title: 'Wikipedia: Metropolitan line extension (Croxley Rail Link), suspended 2018', url: 'https://en.wikipedia.org/wiki/Croxley_Rail_Link' },
  { id: 'timeout-northern-split', title: 'Time Out: Inside the radical plan to split a major London tube line in two (2026-01-16)', url: 'https://www.timeout.com/london/news/inside-the-radical-plan-to-split-a-major-london-tube-line-in-two-011626' },
];

export const FUTURE_EXTENSIONS = {
  bakerloo: {
    sources: ['ianvisits-ble-2026', 'ldrs-ble-2026'],
    description: ' Extension: Elephant & Castle – Lewisham is planned (route safeguarded 2021, in the Mayor\'s Transport Strategy; no TWAO or funding; consultation Dec 2026 – Feb 2027; TfL target 2040, slipped from 2028/29). A second phase over the Hayes line is only a possibility (proposed).',
    segments: [
      { status: P, year: 2040, label: 'Extension Elephant & Castle – Lewisham (planned, safeguarded; target 2040; station names provisional)',
        stops: [
          s('Elephant & Castle', [-0.1001, 51.4958], false),
          s('Burgess Park', [-0.0785, 51.4872]),
          s('Old Kent Road', [-0.0635, 51.4825]),
          s('New Cross Gate', [-0.0404, 51.4751], false),
          s('Lewisham', [-0.0142, 51.4657], false),
        ] },
      { status: PR, label: 'Possible phase 2: Lewisham – Hayes over the National Rail Hayes line (proposed, not safeguarded)',
        stops: [
          s('Lewisham', [-0.0142, 51.4657], false),
          s('Ladywell', [-0.0191, 51.4562]),
          s('Catford Bridge', [-0.0247, 51.4447]),
          s('Lower Sydenham', [-0.0334, 51.4248]),
          s('New Beckenham', [-0.0352, 51.4168]),
          s('Clock House', [-0.0406, 51.4086]),
          s('Elmers End', [-0.0497, 51.3983], false),
          s('Eden Park', [-0.0264, 51.3901]),
          s('West Wickham', [-0.0141, 51.3814]),
          s('Hayes', [0.0106, 51.3763], true, 'hayes-kent'),
        ] },
      { status: PR, label: 'Possible phase 2 branch: New Beckenham – Beckenham Junction (proposed)',
        stops: [s('New Beckenham', [-0.0352, 51.4168]), s('Beckenham Junction', [-0.0258, 51.4112], false)] },
    ],
  },
  dlr: {
    sources: ['tfl-dlr-thamesmead', 'ianvisits-dlr-2026'],
    description: ' Extension Gallions Reach – Beckton Riverside – Thamesmead is planned: Government backed it in the November 2025 Budget, but there is no funding agreement and the TWAO application is due in early 2027 (construction from 2029, opening "early 2030s", no official year).',
    segments: [
      { status: P, label: 'Thamesmead extension: Gallions Reach – Beckton Riverside – Thamesmead (planned; TWAO due early 2027; opening "early 2030s")',
        stops: [s('Gallions Reach', [0.0716, 51.509], false), s('Beckton Riverside', [0.0835, 51.5125]), s('Thamesmead', [0.116, 51.502])] },
    ],
  },
  elizabeth: {
    sources: ['london-now-c2e'],
    description: ' An extension from Abbey Wood to Dartford / Ebbsfleet (C2E) is proposed: the corridor is safeguarded but DfT has "no plans" for it (2026).',
    segments: [
      { status: PR, label: 'Abbey Wood – Ebbsfleet (C2E, proposed; no DfT plan, no year)',
        stops: [
          s('Abbey Wood', [0.1209, 51.4911], false),
          s('Belvedere', [0.1524, 51.4921]),
          s('Erith', [0.1747, 51.4817]),
          s('Slade Green', [0.1904, 51.4679]),
          s('Dartford', [0.2193, 51.4474]),
          s('Stone Crossing', [0.2639, 51.4514]),
          s('Greenhithe', [0.2801, 51.4504]),
          s('Swanscombe', [0.3096, 51.4491]),
          s('Ebbsfleet International', [0.3209, 51.4429]),
        ] },
    ],
  },
  metropolitan: {
    sources: ['wiki-croxley'],
    description: ' The Croxley Rail Link (Croxley – Watford Junction via Watford Vicarage Road) had a TWAO in 2013 and some enabling works, but was suspended for lack of funding in 2018 (proposed).',
    segments: [
      { status: PR, label: 'Metropolitan line extension Croxley – Watford Junction (suspended 2018, proposed)',
        stops: [
          s('Croxley', [-0.4416, 51.647], false),
          s('Cassiobridge', [-0.427, 51.6465]),
          s('Watford Vicarage Road', [-0.4075, 51.6485]),
          s('Watford High Street', [-0.3919, 51.6527], false),
          s('Watford Junction', [-0.3964, 51.6637], false),
        ] },
    ],
  },
  trams: {
    sources: ['wiki-sutton-link'],
    description: ' The Sutton Link (Colliers Wood – Sutton) was shelved by TfL in September 2023 for lack of funding (proposed).',
    segments: [
      { status: PR, label: 'Sutton Link Colliers Wood – Sutton (shelved 2023, proposed)',
        stops: [
          s('Colliers Wood', [-0.1779, 51.418], false),
          s('Belgrave Walk', [-0.1804, 51.4023], false),
          s('Rose Hill', [-0.193, 51.3875]),
          s('St Helier Hospital', [-0.1975, 51.3805]),
          s('Sutton', [-0.1911, 51.3596]),
        ] },
    ],
  },
  northern: {
    sources: ['timeout-northern-split'],
    description: ' Splitting the line into separate Bank and Charing Cross lines is an unfunded TfL aspiration (proposed, possibly 2040s); it adds no track, so it is not drawn.',
    segments: [],
  },
};

export const FUTURE_LINES = [
  { id: 'crossrail-2', name: 'Crossrail 2', group: 'elizabeth', mode: 'commuter', color: '#8a8d8f', status: PR,
    sources: ['wiki-cr2', 'timeout-cr2-2025'],
    description: 'Wimbledon – central London – Dalston, branching to Tottenham Hale (for Broxbourne) and New Southgate, with regional branches beyond Wimbledon (not drawn). Paused since November 2020 as a condition of TfL emergency funding; the route is still safeguarded (2015 directions). Only passive provision is being built (a shaft in the British Library extension, ~2026-2032). Proposed, no year. No official colour (grey chosen for the map). Core stations from the 2015 safeguarding; positions approximate.',
    segments: [
      { status: PR, label: 'Core: Wimbledon – Seven Sisters (paused 2020, safeguarded)',
        stops: [
          s('Wimbledon', [-0.2064, 51.4214], false),
          s('Tooting Broadway', [-0.168, 51.4275], false),
          s('Clapham Junction', [-0.1703, 51.4643], false),
          s("King's Road Chelsea", [-0.172, 51.486]),
          s('Victoria', [-0.1439, 51.4965], false),
          s('Tottenham Court Road', [-0.1309, 51.5165], false),
          s('Euston St. Pancras', [-0.129, 51.529]),
          s('Angel', [-0.1058, 51.5322], false),
          s('Dalston Junction', [-0.0753, 51.546], false),
          s('Seven Sisters', [-0.0752, 51.5823], false),
        ] },
      { status: PR, label: 'North-east branch: Seven Sisters – Tottenham Hale (on to Broxbourne)',
        stops: [s('Seven Sisters', [-0.0752, 51.5823], false), s('Tottenham Hale', [-0.0597, 51.5883], false)] },
      { status: PR, label: 'New Southgate branch: Seven Sisters – Turnpike Lane – Alexandra Palace – New Southgate',
        stops: [
          s('Seven Sisters', [-0.0752, 51.5823], false),
          s('Turnpike Lane', [-0.1031, 51.5904], false),
          s('Alexandra Palace', [-0.1207, 51.5983]),
          s('New Southgate', [-0.1428, 51.6141]),
        ] },
    ] },
  { id: 'west-london-orbital', name: 'West London Orbital', group: 'overground', mode: 'commuter', color: '#ee7c0e', status: P,
    sources: ['timeout-wlo-2026', 'wiki-wlo'],
    description: 'New London Overground service Hendon – Brent Cross West – Old Oak – Brentford – Hounslow (about 18.5 km) over the Dudding Hill freight line, the North London line and the Hounslow loop. In the London Plan and the Mayor\'s Transport Strategy; boroughs and TfL funded design to 2028, first consultation open until 18 November 2026; not approved or funded for construction. No official year ("mid-2030s" in the press). The West Hampstead branch has been dropped. Colour: Overground orange (no line colour yet). New stations (Neasden, Harlesden, Old Oak Common Lane, Lionel Road) are approximate.',
    segments: [
      { status: P, label: 'Hendon – Hounslow (planned; consultation 2026; no official year)',
        stops: [
          s('Hendon', [-0.2383, 51.5802]),
          s('Brent Cross West', [-0.2235, 51.5686]),
          s('Neasden', [-0.251, 51.554]),
          s('Harlesden', [-0.2545, 51.539]),
          s('Old Oak Common Lane', [-0.2458, 51.526]),
          s('Acton Central', [-0.2629, 51.5088], false),
          s('South Acton', [-0.27, 51.4997], false),
          s('Lionel Road', [-0.29, 51.4915]),
          s('Brentford', [-0.3096, 51.4876]),
          s('Syon Lane', [-0.3247, 51.4817]),
          s('Isleworth', [-0.3368, 51.4749]),
          s('Hounslow', [-0.3621, 51.462]),
        ] },
    ] },
  { id: 'hs2', name: 'High Speed 2', code: 'HS2', group: 'hs2', color: '#1c4e80', status: C,
    sources: ['gov-hs2-reset', 'hs2-update', 'ce-hs2-euston', 'ianvisits-ooc'],
    description: 'High-speed line London Euston – Old Oak Common – Birmingham. Under construction: Old Oak Common station (HS2 platforms built, fit-out under way, with new Elizabeth line / GWR platforms), the Euston – Old Oak Common tunnels (boring since January 2026) and the route west via the Northolt tunnels and the Colne Valley Viaduct (complete 2025). Euston station has enabling works only and is not fully funded. 19 May 2026 reset: first services Old Oak Common – Birmingham between May 2036 and October 2039, Euston between May 2040 and December 2043 (the map uses the end of each window). Only the London stations are drawn; the line continues beyond the map. No official map colour (chosen).',
    segments: [
      { status: C, year: 2043, label: 'Euston – Old Oak Common (tunnels under construction; Euston opening window 2040-2043)',
        stops: [s('Euston', [-0.1345, 51.5285], false), s('Old Oak Common', [-0.248, 51.5252])],
        path: [[-0.1345, 51.5285], [-0.1495, 51.5335], [-0.1745, 51.5345], [-0.2005, 51.5325], [-0.2255, 51.5295], [-0.248, 51.5252]] },
    ] },
];
