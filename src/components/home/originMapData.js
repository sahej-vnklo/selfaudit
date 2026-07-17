// Area cards for the Origin causal-structure diagram.
// title: array of line(s) for the card heading. cls: extra area-card modifier classes.
export const ORIGIN_AREAS = [
  { id: 'customer', icon: '⌕', title: ['Customer & Market', 'Intelligence'], cls: '',
    items: ['Market research', 'Customer interviews', 'Voice of customer', 'Competitive intelligence'] },
  { id: 'strategy', icon: '◎', title: ['Strategy'], cls: '',
    items: ['Vision & mission', 'Competitive advantage', 'Capital allocation', 'Strategy execution'] },
  { id: 'product', icon: '◇', title: ['Product'], cls: '',
    items: ['Product strategy', 'Product-market fit', 'Roadmap prioritization', 'Product development'] },
  { id: 'marketing', icon: '⌁', title: ['Marketing & Sales'], cls: 'wide',
    items: ['Go-to-market', 'Pricing & packaging', 'Pipeline & demand', 'Retention & churn'] },
  { id: 'finance', icon: '$', title: ['Finance'], cls: '',
    items: ['Revenue quality', 'Gross margin', 'Cash runway', 'Financial forecasting'] },
  { id: 'people', icon: '♙', title: ['People &', 'Organization'], cls: 'compact',
    items: ['Organizational design', 'Hiring', 'Culture', 'Team effectiveness'] },
  { id: 'technology', icon: '▤', title: ['Technology & Enterprise', 'Systems'], cls: 'wide',
    items: ['Enterprise architecture', 'CRM / ERP systems', 'Requirements engineering', 'AI & automation'] },
  { id: 'operations', icon: '⚙︎', title: ['Operations'], cls: '',
    items: ['Process design', 'Inventory / fulfillment', 'Capacity planning', 'Service delivery'] },
  { id: 'change', icon: '↻', title: ['Change & Transformation'], cls: 'wide compact',
    items: ['Change management', 'Adoption design', 'Resistance diagnosis', 'Communication cascades'] },
  { id: 'legal', icon: '▧', title: ['Legal & External', 'Environment'], cls: 'compact wide',
    items: ['Contracts', 'Corporate governance', 'Macroeconomics', 'Legal fundamentals'] },
  { id: 'entrepreneurship', icon: '↗', title: ['Entrepreneurship & Scale'], cls: 'wide compact',
    items: ['Zero to one', 'Founder-led sales', 'Stage transitions', 'Fundraising strategy'] },
  { id: 'data', icon: '◫', title: ['Data & Measurement'], cls: 'compact',
    items: ['Data quality', 'BI & dashboards', 'Metric design', 'Experimentation'] },
  { id: 'risk', icon: '⬡', title: ['Risk & Control'], cls: 'compact',
    items: ['Risk process', 'Internal controls', 'Business continuity', 'Data governance'] },
]

export const ORIGIN_CONNECTIONS = [
  { d: 'M285 150 H401', arrow: true },
  { d: 'M621 150 H725', arrow: true },
  { d: 'M952 150 H1055', arrow: true },
  { d: 'M1282 150 H1388', arrow: true },

  { d: 'M170 247 V334', arrow: true },

  { d: 'M170 292 H1165', arrow: false },
  { d: 'M530 292 V335', arrow: true },
  { d: 'M831 247 V528', arrow: true },
  { d: 'M1165 292 V335', arrow: true },

  { d: 'M286 425 H425 V579 H710', arrow: false },
  { d: 'M286 649 H425 V579 H710', arrow: false },
  { d: 'M798 518 V545 H710', arrow: true },

  { d: 'M1302 425 H1495 V579 H980', arrow: false },
  { d: 'M1495 247 V545', arrow: true },

  { d: 'M652 811 H730', arrow: true },
  { d: 'M1038 811 H1090', arrow: true },
  { d: 'M845 811 V691', arrow: true },

  { d: 'M171 893 H1550', arrow: false },
  { d: 'M171 650 V893', arrow: false },
  { d: 'M525 883 V893', arrow: false },
  { d: 'M846 883 V893', arrow: false },
  { d: 'M1185 883 V893', arrow: false },
  { d: 'M1430 893 V247', arrow: true },
  { d: 'M1472 893 V247', arrow: true },
  { d: 'M1514 893 V247', arrow: true },
  { d: 'M1550 893 V247', arrow: true },
]
