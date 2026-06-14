import React from 'react'
import './UseCases.css'
import './Capabilities.css'

const CAPABILITIES = [
  {
    idx: '01',
    name: 'Monitor every area',
    body: 'SelfAudit watches every area of your business continuously — Sales, Finance, Customer Service, Operations, whatever you\'ve mapped. It doesn\'t wait for you to open a dashboard. It doesn\'t run on a schedule. It\'s always reading, always current, and surfaces what matters before you think to check.',
    quote: '"Response times in Customer Service have been climbing for 6 days. You haven\'t opened the dashboard once this week. You\'re seeing this now because SelfAudit flagged it — not because you asked."',
  },
  {
    idx: '02',
    name: 'Detect revenue leakage',
    body: 'Missed renewals. Unbilled work. Deals slipping with no follow-up. Pricing inconsistencies you never noticed. SelfAudit finds the money you are already losing — before it\'s gone. This is the first thing it pays for itself on.',
    quote: '"Your Starter plan has 3× the support load of your highest tier. You\'re subsidising 40% of your customer base and calling it growth."',
  },
  {
    idx: '03',
    name: 'Diagnose root causes',
    body: 'Not what\'s wrong. Why it\'s wrong — and where it started. SelfAudit traces the chain of cause across departments, timelines, and decisions. A support spike that traces back to a bad-fit deal closed last month. A margin gap that traces to a pricing call made two quarters ago. The chain, not just the symptom.',
    quote: '"You don\'t have a sales problem. Your last 4 churned accounts all flagged the same onboarding gap — months before they left."',
  },
  {
    idx: '04',
    name: 'Reason across departments',
    body: 'Every other tool reasons inside one area. SelfAudit reasons across all of them simultaneously. A support spike in Customer Service, a velocity drop in Sales, a shift in Finance — not three separate alerts. One compound root cause spanning all three. A pipeline slowdown today is a cash flow problem in 90 days. SelfAudit connects those dots before you knew to look.',
    quote: '"Pipeline velocity dropped 22% in Sales three weeks ago. Support tickets tagged \'billing confusion\' spiked the same week. Cash flow is now 11 days shorter than your model assumed. Three signals. One root cause."',
  },
  {
    idx: '05',
    name: 'Simulate decisions',
    body: 'Before you act, model the outcome. Raise prices — what happens to churn? Hire someone — where does it hit the runway? Cut a budget — which areas feel it first and when? SelfAudit runs the scenario against your live business model and shows you the second-order effects before a dollar moves.',
    quote: '"Raising your entry price 30% is projected to reduce new signups by 18% but increase gross margin by 14 points — net positive within 60 days. Churn risk is concentrated in your Starter tier, not your growth accounts."',
  },
  {
    idx: '06',
    name: 'Execute with approval',
    body: 'Every finding comes staged for action. The retention email is drafted. The SOP is written. The task is assigned. You review it, you approve it, it runs — across your tools, with a full audit trail. You stay the decision-maker. It becomes the operator.',
    quote: '"Retention email drafted for the March cohort. SOP written for the onboarding step where drop-off is occurring. Task created and assigned to your CS lead. Approve to run."',
  },
  {
    idx: '07',
    name: 'Call your business',
    body: 'Between meetings. On the way somewhere. At 11pm. You call. SelfAudit picks up. It knows your business, knows what\'s happening right now, and tells you what to do next. Four minutes. No dashboard. No analyst. A direct line to the business itself.',
    quote: '"What\'s the biggest risk right now?" / "Churn in the March cohort is up 34%. Root cause: onboarding drop-off at step 3. If unaddressed — ~$18k MRR lost by end of month. Want me to stage a fix?"',
    number: '+1 (855) SELFAUDIT',
  },
]

const BackArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

export default function Capabilities({ onBack }) {
  return (
    <div className="sa-uc">

      <nav className="uc-nav">
        <button className="uc-back" onClick={onBack}><BackArrow /> SelfAudit</button>
        <div className="uc-nav-center">Capabilities</div>
      </nav>

      <section className="cap-hero">
        <div className="uc-area-tag">What it does</div>
        <h1 className="uc-h1">Not reports.<br />Not dashboards.<br /><em>Capabilities.</em></h1>
        <p className="uc-intro">
          Things that change how you run the business — not just how you look at it.
        </p>
      </section>

      <div className="uc-rule" />

      <section className="cap-list">
        <div className="cap-list-inner">
          {CAPABILITIES.map(c => (
            <div className="cap-item" key={c.idx}>
              <div className="cap-idx">{c.idx}</div>
              <div className="cap-content">
                <h2 className="cap-name">{c.name}</h2>
                <p className="cap-body">{c.body}</p>
                {c.quote && <div className="cap-quote">{c.quote}</div>}
                {c.number && <div className="cap-number">{c.number}</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
