const ZONES = {
  EU_PRIORITY: {
    id: 'EU_PRIORITY',
    label: 'EU Priority',
    region: 'European Union',
    eta: '2–3 business days',
    etaShort: '2–3 days',
    summary: 'Dispatched from our EU fulfilment hub. Most parcels arrive within two to three working days.',
  },
  EU_STANDARD: {
    id: 'EU_STANDARD',
    label: 'EU Standard',
    region: 'European Union',
    eta: '3–5 business days',
    etaShort: '3–5 days',
    summary: 'Dispatched from our EU fulfilment hub. Tracked end-to-end on a single carrier handover.',
  },
  EU_NORDIC: {
    id: 'EU_NORDIC',
    label: 'EU & Nordics',
    region: 'European Union & Nordics',
    eta: '4–7 business days',
    etaShort: '4–7 days',
    summary: 'Dispatched from our EU hub. Slightly longer transit to peripheral EU and Nordic destinations.',
  },
  UK_CH_NO: {
    id: 'UK_CH_NO',
    label: 'UK / Switzerland / Norway',
    region: 'Near-Europe (non-EU)',
    eta: '4–7 business days',
    etaShort: '4–7 days',
    summary: 'Dispatched from our EU hub with full customs paperwork prepared. Tracked end-to-end.',
  },
  INTL: {
    id: 'INTL',
    label: 'International',
    region: 'Worldwide',
    eta: '7–14 business days',
    etaShort: '7–14 days',
    summary: 'International tracked dispatch. Customs declared accurately; import duties (if any) are the recipient’s responsibility.',
  },
};

const COUNTRIES = [
  ['DE', 'Germany',         'EU_PRIORITY'],
  ['AT', 'Austria',          'EU_PRIORITY'],
  ['NL', 'Netherlands',      'EU_PRIORITY'],
  ['BE', 'Belgium',          'EU_PRIORITY'],
  ['LU', 'Luxembourg',       'EU_PRIORITY'],
  ['CZ', 'Czech Republic',   'EU_PRIORITY'],
  ['DK', 'Denmark',          'EU_PRIORITY'],
  ['FR', 'France',           'EU_STANDARD'],
  ['IT', 'Italy',            'EU_STANDARD'],
  ['ES', 'Spain',            'EU_STANDARD'],
  ['PT', 'Portugal',         'EU_STANDARD'],
  ['PL', 'Poland',           'EU_STANDARD'],
  ['HU', 'Hungary',          'EU_STANDARD'],
  ['SK', 'Slovakia',         'EU_STANDARD'],
  ['SI', 'Slovenia',         'EU_STANDARD'],
  ['HR', 'Croatia',          'EU_STANDARD'],
  ['IE', 'Ireland',          'EU_STANDARD'],
  ['SE', 'Sweden',           'EU_NORDIC'],
  ['FI', 'Finland',          'EU_NORDIC'],
  ['EE', 'Estonia',          'EU_NORDIC'],
  ['LV', 'Latvia',           'EU_NORDIC'],
  ['LT', 'Lithuania',        'EU_NORDIC'],
  ['RO', 'Romania',          'EU_NORDIC'],
  ['BG', 'Bulgaria',         'EU_NORDIC'],
  ['GR', 'Greece',           'EU_NORDIC'],
  ['MT', 'Malta',            'EU_NORDIC'],
  ['CY', 'Cyprus',           'EU_NORDIC'],
  ['GB', 'United Kingdom',   'UK_CH_NO'],
  ['CH', 'Switzerland',      'UK_CH_NO'],
  ['NO', 'Norway',           'UK_CH_NO'],
  ['IS', 'Iceland',          'UK_CH_NO'],
  ['LI', 'Liechtenstein',    'UK_CH_NO'],
  ['US', 'United States',    'INTL'],
  ['CA', 'Canada',           'INTL'],
  ['AU', 'Australia',        'INTL'],
  ['NZ', 'New Zealand',      'INTL'],
  ['JP', 'Japan',            'INTL'],
  ['KR', 'South Korea',      'INTL'],
  ['SG', 'Singapore',        'INTL'],
  ['HK', 'Hong Kong',        'INTL'],
  ['MX', 'Mexico',           'INTL'],
  ['BR', 'Brazil',           'INTL'],
  ['AR', 'Argentina',        'INTL'],
  ['CL', 'Chile',            'INTL'],
  ['IL', 'Israel',           'INTL'],
  ['AE', 'United Arab Emirates', 'INTL'],
  ['SA', 'Saudi Arabia',     'INTL'],
  ['ZA', 'South Africa',     'INTL'],
  ['TR', 'Turkey',           'INTL'],
  ['UA', 'Ukraine',          'INTL'],
  ['RS', 'Serbia',           'INTL'],
];

const OPTIONS = {
  EU_PRIORITY: [
    { id: 'standard', label: 'EU Standard',  eta: '2–3 business days', etaShort: '2–3 days', price: 2.99, blurb: 'Tracked · cold-chain insulated · plain unmarked outer' },
    { id: 'express',  label: 'EU Express',   eta: '1–2 business days', etaShort: '1–2 days', price: 4.99, blurb: 'Same-day dispatch (orders before 14:00 CET) · priority routing' },
  ],
  EU_STANDARD: [
    { id: 'standard', label: 'EU Standard',  eta: '3–5 business days', etaShort: '3–5 days', price: 2.99, blurb: 'Tracked · cold-chain insulated · plain unmarked outer' },
    { id: 'express',  label: 'EU Express',   eta: '2–3 business days', etaShort: '2–3 days', price: 4.99, blurb: 'Priority routing from our EU hub · same-day dispatch' },
  ],
  EU_NORDIC: [
    { id: 'standard', label: 'EU Tracked',   eta: '4–7 business days', etaShort: '4–7 days', price: 3.99, blurb: 'Tracked · cold-chain insulated · plain unmarked outer' },
    { id: 'express',  label: 'EU Express',   eta: '3–5 business days', etaShort: '3–5 days', price: 4.99, blurb: 'Priority routing · faster carrier handover' },
  ],
  UK_CH_NO: [
    { id: 'standard', label: 'Tracked',           eta: '4–7 business days', etaShort: '4–7 days', price: 3.99, blurb: 'Customs paperwork included · plain unmarked outer' },
    { id: 'express',  label: 'Express Tracked',   eta: '3–5 business days', etaShort: '3–5 days', price: 4.99, blurb: 'Priority customs handling · faster transit' },
  ],
  INTL: [
    { id: 'standard', label: 'International Tracked', eta: '7–14 business days', etaShort: '7–14 days', price: 4.99, blurb: 'Tracked · plain unmarked outer · customs declared accurately' },
    { id: 'express',  label: 'International Express', eta: '5–8 business days',  etaShort: '5–8 days',  price: 4.99, blurb: 'Premium courier · priority customs · door-to-door tracking' },
  ],
};

const FREE_SHIPPING_THRESHOLD_USD = 250;

function getZoneForCountry(code) {
  if (!code) return null;
  const row = COUNTRIES.find((c) => c[0] === code);
  if (!row) return ZONES.INTL;
  return ZONES[row[2]];
}

function getOptionsForCountry(code) {
  const zone = getZoneForCountry(code) || ZONES.INTL;
  return OPTIONS[zone.id] || OPTIONS.INTL;
}

function resolveShipping(country, methodId, subtotalUsd) {
  const opts = getOptionsForCountry(country);
  const opt = opts.find((o) => o.id === methodId) || opts[0];
  const free = subtotalUsd != null && subtotalUsd >= FREE_SHIPPING_THRESHOLD_USD && opt.id === 'standard';
  const price = free ? 0 : opt.price;
  return { ...opt, price, freeShipping: free, zone: getZoneForCountry(country) };
}

function listCountries() {
  return COUNTRIES.map(([code, name, zoneId]) => ({ code, name, zoneId }));
}

module.exports = {
  ZONES,
  OPTIONS,
  COUNTRIES,
  FREE_SHIPPING_THRESHOLD_USD,
  getZoneForCountry,
  getOptionsForCountry,
  resolveShipping,
  listCountries,
};
