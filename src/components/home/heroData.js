// Data for the hero matrix grid — one column per business pillar, one card
// per node within that pillar. Ported 1:1 from mockups/hero-section.html.
export const HERO_DATA = {
  pillars: {
    str: 'Strategy', mkt: 'Marketing & Sales', prd: 'Product', fin: 'Finance', ops: 'Operations',
    tec: 'Technology & Enterprise Systems', ppl: 'People & Organization', ext: 'Legal & External Environment',
    mi: 'Customer & Market Intelligence', ent: 'Entrepreneurship & Scale',
    dat: 'Data & Measurement (horizontal)', rsk: 'Risk & Control (horizontal)', chg: 'Change & Transformation (horizontal)',
  },
  nodesByPillar: {
    str: [
      { id: 'str.vision-mission', name: 'Vision & Mission', pillar: 'str' },
      { id: 'str.strategic-planning', name: 'Strategic Planning', pillar: 'str' },
      { id: 'str.business-model-design', name: 'Business Model Design', pillar: 'str' },
      { id: 'str.competitive-advantage', name: 'Competitive Advantage', pillar: 'str' },
      { id: 'str.growth-strategy', name: 'Growth Strategy', pillar: 'str' },
      { id: 'str.capital-allocation', name: 'Capital Allocation', pillar: 'str' },
      { id: 'str.strategy-execution', name: 'Strategy Execution', pillar: 'str' },
      { id: 'str.innovation-strategy', name: 'Innovation Strategy', pillar: 'str' },
      { id: 'str.mergers-acquisitions', name: 'Mergers & Acquisitions', pillar: 'str' },
    ],
    mkt: [
      { id: 'mkt.customer-segmentation', name: 'Customer Segmentation', pillar: 'mkt' },
      { id: 'mkt.ideal-customer-profile', name: 'Ideal Customer Profile', pillar: 'mkt' },
      { id: 'mkt.value-proposition', name: 'Value Proposition', pillar: 'mkt' },
      { id: 'mkt.positioning', name: 'Positioning', pillar: 'mkt' },
      { id: 'mkt.demand-generation', name: 'Demand Generation', pillar: 'mkt' },
      { id: 'mkt.funnel-conversion', name: 'Funnel & Conversion', pillar: 'mkt' },
      { id: 'mkt.customer-success', name: 'Customer Success', pillar: 'mkt' },
      { id: 'mkt.retention-churn', name: 'Retention & Churn', pillar: 'mkt' },
      { id: 'mkt.cac-ltv-attribution', name: 'CAC, LTV & Attribution', pillar: 'mkt' },
    ],
    prd: [
      { id: 'prd.product-strategy', name: 'Product Strategy', pillar: 'prd' },
      { id: 'prd.product-market-fit', name: 'Product-Market Fit', pillar: 'prd' },
      { id: 'prd.customer-discovery', name: 'Customer Discovery', pillar: 'prd' },
      { id: 'prd.jobs-to-be-done', name: 'Jobs To Be Done', pillar: 'prd' },
      { id: 'prd.roadmap-prioritization', name: 'Roadmap Prioritization', pillar: 'prd' },
      { id: 'prd.product-analytics', name: 'Product Analytics', pillar: 'prd' },
      { id: 'prd.product-led-growth', name: 'Product-Led Growth', pillar: 'prd' },
      { id: 'prd.product-operations', name: 'Product Operations', pillar: 'prd' },
      { id: 'prd.platform-ecosystem', name: 'Platform & Ecosystem', pillar: 'prd' },
    ],
    fin: [
      { id: 'fin.financial-statements', name: 'Financial Statements', pillar: 'fin' },
      { id: 'fin.revenue', name: 'Revenue', pillar: 'fin' },
      { id: 'fin.cogs', name: 'COGS', pillar: 'fin' },
      { id: 'fin.gross-margin', name: 'Gross Margin', pillar: 'fin' },
      { id: 'fin.operating-expenses', name: 'Operating Expenses', pillar: 'fin' },
      { id: 'fin.cash-flow', name: 'Cash Flow', pillar: 'fin' },
      { id: 'fin.cash-runway', name: 'Cash Runway', pillar: 'fin' },
      { id: 'fin.unit-economics', name: 'Unit Economics', pillar: 'fin' },
      { id: 'fin.financial-forecasting', name: 'Financial Forecasting', pillar: 'fin' },
    ],
    ops: [
      { id: 'ops.operations-strategy', name: 'Operations Strategy', pillar: 'ops' },
      { id: 'ops.process-design', name: 'Process Design', pillar: 'ops' },
      { id: 'ops.theory-of-constraints', name: 'Theory of Constraints', pillar: 'ops' },
      { id: 'ops.capacity-planning', name: 'Capacity Planning', pillar: 'ops' },
      { id: 'ops.service-delivery', name: 'Service Delivery', pillar: 'ops' },
      { id: 'ops.quality-management', name: 'Quality Management', pillar: 'ops' },
      { id: 'ops.operational-kpis', name: 'Operational KPIs', pillar: 'ops' },
      { id: 'ops.sla-management', name: 'SLA Management', pillar: 'ops' },
      { id: 'ops.continuous-improvement', name: 'Continuous Improvement', pillar: 'ops' },
    ],
    tec: [
      { id: 'tec.enterprise-architecture', name: 'Enterprise Architecture', pillar: 'tec' },
      { id: 'tec.business-analysis', name: 'Business Analysis', pillar: 'tec' },
      { id: 'tec.bpm-workflow', name: 'BPM & Workflow', pillar: 'tec' },
      { id: 'tec.apis-integration', name: 'APIs & Integration', pillar: 'tec' },
      { id: 'tec.master-data-management', name: 'Master Data Management', pillar: 'tec' },
      { id: 'tec.ai-llms', name: 'AI & LLMs', pillar: 'tec' },
      { id: 'tec.ai-agents-automation', name: 'AI Agents & Automation', pillar: 'tec' },
      { id: 'tec.digital-transformation', name: 'Digital Transformation', pillar: 'tec' },
      { id: 'tec.technical-debt', name: 'Technical Debt', pillar: 'tec' },
    ],
    ppl: [
      { id: 'ppl.organizational-design', name: 'Organizational Design', pillar: 'ppl' },
      { id: 'ppl.hiring', name: 'Hiring', pillar: 'ppl' },
      { id: 'ppl.performance-management', name: 'Performance Management', pillar: 'ppl' },
      { id: 'ppl.culture', name: 'Culture', pillar: 'ppl' },
      { id: 'ppl.team-effectiveness', name: 'Team Effectiveness', pillar: 'ppl' },
      { id: 'ppl.leadership', name: 'Leadership', pillar: 'ppl' },
      { id: 'ppl.executive-communication', name: 'Executive Communication', pillar: 'ppl' },
      { id: 'ppl.incentive-design', name: 'Incentive Design', pillar: 'ppl' },
      { id: 'ppl.key-person-dependency', name: 'Key-Person Dependency', pillar: 'ppl' },
    ],
    ext: [
      { id: 'ext.legal-fundamentals', name: 'Legal Fundamentals', pillar: 'ext' },
      { id: 'ext.contracts', name: 'Contracts', pillar: 'ext' },
      { id: 'ext.regulation-compliance', name: 'Regulation & Compliance', pillar: 'ext' },
      { id: 'ext.privacy-data-protection', name: 'Privacy & Data Protection', pillar: 'ext' },
      { id: 'ext.corporate-governance', name: 'Corporate Governance', pillar: 'ext' },
      { id: 'ext.macroeconomics', name: 'Macroeconomics', pillar: 'ext' },
      { id: 'ext.geopolitics-policy', name: 'Geopolitics & Policy', pillar: 'ext' },
      { id: 'ext.esg-sustainability', name: 'ESG & Sustainability', pillar: 'ext' },
      { id: 'ext.intellectual-property', name: 'Intellectual Property', pillar: 'ext' },
    ],
    mi: [
      { id: 'mi.market-research-methods', name: 'Market Research Methods', pillar: 'mi' },
      { id: 'mi.customer-interviews', name: 'Customer Interviews', pillar: 'mi' },
      { id: 'mi.voice-of-customer', name: 'Voice of Customer', pillar: 'mi' },
      { id: 'mi.competitive-intelligence', name: 'Competitive Intelligence', pillar: 'mi' },
      { id: 'mi.win-loss-analysis', name: 'Win-Loss Analysis', pillar: 'mi' },
      { id: 'mi.market-sizing', name: 'Market Sizing', pillar: 'mi' },
      { id: 'mi.trend-analysis', name: 'Trend Analysis', pillar: 'mi' },
    ],
    ent: [
      { id: 'ent.zero-to-one', name: 'Zero to One', pillar: 'ent' },
      { id: 'ent.founder-led-sales', name: 'Founder-Led Sales', pillar: 'ent' },
      { id: 'ent.stage-transitions', name: 'Stage Transitions', pillar: 'ent' },
      { id: 'ent.fundraising-strategy', name: 'Fundraising Strategy', pillar: 'ent' },
      { id: 'ent.scaling-pathologies', name: 'Scaling Pathologies', pillar: 'ent' },
      { id: 'ent.founder-psychology', name: 'Founder Psychology', pillar: 'ent' },
      { id: 'ent.exit-paths', name: 'Exit Paths', pillar: 'ent' },
    ],
    dat: [
      { id: 'dat.statistics-fundamentals', name: 'Statistics Fundamentals', pillar: 'dat' },
      { id: 'dat.experimentation', name: 'Experimentation', pillar: 'dat' },
      { id: 'dat.sql', name: 'SQL', pillar: 'dat' },
      { id: 'dat.bi-dashboards', name: 'BI & Dashboards', pillar: 'dat' },
      { id: 'dat.data-modeling-warehousing', name: 'Data Modeling & Warehousing', pillar: 'dat' },
      { id: 'dat.etl-pipelines', name: 'ETL & Pipelines', pillar: 'dat' },
      { id: 'dat.metric-design', name: 'Metric Design', pillar: 'dat' },
      { id: 'dat.forecasting-methods', name: 'Forecasting Methods', pillar: 'dat' },
      { id: 'dat.predictive-analytics', name: 'Predictive Analytics', pillar: 'dat' },
    ],
    rsk: [
      { id: 'rsk.risk-taxonomy', name: 'Risk Taxonomy', pillar: 'rsk' },
      { id: 'rsk.risk-process', name: 'Risk Process', pillar: 'rsk' },
      { id: 'rsk.risk-appetite', name: 'Risk Appetite', pillar: 'rsk' },
      { id: 'rsk.internal-controls', name: 'Internal Controls', pillar: 'rsk' },
      { id: 'rsk.cyber-risk', name: 'Cyber Risk', pillar: 'rsk' },
      { id: 'rsk.vendor-risk', name: 'Vendor Risk', pillar: 'rsk' },
      { id: 'rsk.business-continuity', name: 'Business Continuity', pillar: 'rsk' },
      { id: 'rsk.data-governance', name: 'Data Governance', pillar: 'rsk' },
      { id: 'rsk.concentration-risk', name: 'Concentration Risk', pillar: 'rsk' },
    ],
    chg: [
      { id: 'chg.change-management', name: 'Change Management', pillar: 'chg' },
      { id: 'chg.adoption-design', name: 'Adoption Design', pillar: 'chg' },
      { id: 'chg.resistance-diagnosis', name: 'Resistance Diagnosis', pillar: 'chg' },
      { id: 'chg.transformation-design', name: 'Transformation Design', pillar: 'chg' },
      { id: 'chg.communication-cascades', name: 'Communication Cascades', pillar: 'chg' },
    ],
  },
}

export const HERO_COLORS = {
  str: '#4f8fce', mkt: '#d76a4b', prd: '#40a583', fin: '#7aa94b', ops: '#c88831', tec: '#d15b82',
  ppl: '#d85b57', ext: '#898a89', mi: '#7166ca', ent: '#2d8b72', dat: '#3678b5', rsk: '#a84d35', chg: '#a84b74',
}

export const HERO_SHORT_LABELS = {
  str: 'Strategy', mkt: 'Marketing + Sales', prd: 'Product', fin: 'Finance', ops: 'Operations', tec: 'Technology',
  ppl: 'People', ext: 'Legal + External', mi: 'Market Intelligence', ent: 'Scale', dat: 'Data', rsk: 'Risk + Control', chg: 'Transformation',
}

// causal cascade: an SLA breach in Operations compounds into churn, margin, and cash runway
export const HERO_CHAIN_ORDER = ['ops.sla-management', 'mkt.retention-churn', 'fin.gross-margin', 'fin.cash-runway']

export const HERO_SPECIAL = {
  'ops.sla-management': ['signal', 'SLA breach · 6.2h'],
  'mkt.retention-churn': ['signal', 'Churn chain · +18%'],
  'fin.gross-margin': ['signal', 'Margin leak · -3.2%'],
  'fin.cash-runway': ['signal', 'Runway · -1.7 mo'],
  'tec.ai-agents-automation': ['good', 'AI impact · $276K'],
  'dat.predictive-analytics': ['good', 'Forecast · high confidence'],
}

// col order: str,mkt,prd, fin,ops,tec, ppl,ext,mi, ent,dat,rsk, chg
// finance/ops/tech and scale/data/risk-control share one drop tier (same timing)
export const HERO_TIER_BY_COL = [0, 0, 0, 1, 1, 1, 2, 2, 2, 1, 1, 1, 3]
