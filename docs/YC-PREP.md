# YC Prep — Application July 25, 2026

*Assumes the 15-day build (foundation-architecture-blueprint.md §5 + §8 v1 scope) is done by
July 24: wedge stack live (Shopify, Stripe, QuickBooks, support tool, optional 3PL),
~5 deterministic incident detectors working, flagship = SKU/batch-level return-spike
detection, alerts human-reviewed, forensic-scan mode runnable on a connected store.*

*Voice rule for everything below: coffee shop, not conference stage. If a sentence needs a
tech word to work, the sentence is wrong. Inverted triangle: the most important thing is
always the first thing.*

---

## 1. Founder video script (~60 seconds, one take, face to camera)

*(Wear what you actually wear. Sit somewhere normal. Do not read — know the beats, say them
your way. The beats:)*

---

**[0:00–0:08] The hook — lead with the wound.**

"Small businesses don't die from one big mistake. They bleed out from small ones
nobody notices — a bad product batch, a late shipping partner, a broken discount code —
quietly costing money for weeks before anyone spots it."

**[0:08–0:15] Who I am.**

"I'm Sahej. I'm a solo technical founder, and I've spent the last few months obsessed
with one question: why does the owner always find out *last*?"

**[0:15–0:35] What I built.**

"So I built SelfAudit. It plugs into the tools an online brand already runs on — their
store, their payments, their books, their support inbox — and it watches, every single day.
When something starts costing money, the owner gets one message: what broke, why,
and what it's already cost. In plain English. Not a dashboard. Not a chart.
A diagnosis — like: 'Refunds on this product jumped from 6% to 18% in nine days.
Support tickets on it tripled in the same nine days. It started with one fulfillment batch.
You've lost $8,400 so far.'"

**[0:35–0:48] Why it can be trusted (the differentiator, translated).**

"And here's the part I care most about: the AI never decides something is wrong — math does.
Real numbers crossing real lines. The AI only explains it, and it's only allowed to use
reasoning that's backed by the company's own data. No made-up alarms. In this product,
one false alarm and you're deleted — so I built it paranoid."

**[0:48–1:00] Honest status + the close.**

"It works today on Shopify brands. I'm now putting it inside my first stores — the goal
is simple: find real money, get paid for it, repeat. I've been the person watching a
business bleed without knowing where from. I'm building the thing I needed."

---

*Delivery notes: the $8,400 example is the whole video — slow down there. Don't smile
through the hook. Total honesty about zero customers if asked; the phrase is "first stores
going live now," never a fake traction claim.*

---

## 2. Product demo video script (~2.5–3 minutes, screen recording + voiceover)

*(Record on a seeded demo store with realistic data. One continuous story: a real problem
gets caught. No feature tour — YC watches thousands of these; the ones that land show ONE
job done end-to-end.)*

---

**[0:00–0:12] Cold open — start at the punchline, not the login page.**

*Screen: the alert itself, already on screen.*

"This is SelfAudit catching a problem that would've cost this brand about seventeen
thousand dollars. Let me rewind and show you how it got there."

**[0:12–0:40] Setup — show how little work the owner does.**

*Screen: connect screen; click Shopify → connected; Stripe → connected; support tool →
connected. Then the one setup question screen.*

"Setup is: connect your store, your payments, your support inbox. Takes a few minutes.
SelfAudit asks a handful of plain questions — like 'what's a normal refund rate for you?' —
and that's it. No spreadsheets, no analyst, nothing to build. From this moment it checks
the business every day on its own."

**[0:40–1:30] The catch — the heart of the demo.**

*Screen: the alert, full view. Read it almost verbatim — it's the product.*

"Nine days ago, refunds on one hoodie started creeping up. No single day looked scary —
that's exactly why a human misses it. But SelfAudit noticed three small things moving
together: refunds up on one product, support tickets tripling on orders that contain it,
and all of it starting right after one specific fulfillment batch shipped.

So the owner gets this: *Refunds for SKU Atlas-Hoodie-M rose from 6% to 18% over nine
days. Support tickets tied to it tripled in the same window. The increase began with fulfillment
batch B-104. Observed loss so far: $8,420. If nothing changes: another $11,000–17,000
this month.*

What broke. Why. What it costs. What to do — pull the batch, contact the supplier."

**[1:30–2:00] The proof layer — why this isn't AI guessing.**

*Screen: click into the evidence view — the actual numbers, tickets, dates behind the alert.*

"Every claim in that alert is clickable. These are the actual refunds, the actual tickets,
the actual dates. The detection is pure math — real thresholds on real numbers. The AI's
only job was writing the explanation, and it's only allowed to say things this evidence
supports. If it can't explain something, it says so and tells you what to check."

**[2:00–2:25] The question — show chat, scoped honestly.**

*Screen: type into chat: "how much have returns cost me this month?" → plain answer.*

"And the owner can just ask. Plain English in, plain English out — about their alerts,
their numbers, their money. No dashboard anywhere in this product. The whole point is:
you shouldn't have to go looking for what's wrong."

**[2:25–2:45] Close — the report that justifies the price.**

*Screen: the monthly "money found / money protected" summary.*

"Once a month, one page: what SelfAudit caught, what it saved. The product pays for
itself or it doesn't deserve the subscription — that's the deal. This is SelfAudit.
A watchdog for your business. It never sleeps, never guesses, and only speaks
when it's worth your time."

---

## 3. Product brief — how to explain it to a stranger (or a YC partner)

### The one-liner
"SelfAudit watches an online brand's business every day and tells the owner the moment
something starts costing them money — what broke, why, and the dollar amount — before it
gets expensive."

### The 30-second version (memorize this one)
"Online brands run on five or six tools — store, payments, accounting, support, shipping.
Problems fall in the cracks *between* those tools: a bad batch shows up as refunds in one
place, complaints in another, a late supplier in a third. No one tool can see it, and the
owner has no analyst. SelfAudit connects to all of them, watches every day, and when
small signals line up into a real problem, the owner gets one message: what broke, why,
what it's cost, what to do. First customers are Shopify brands doing $5–30M, where one
missed problem costs more than a year of the product."

### The story version (coffee shop, 90 seconds)
"You know how a business owner finds out something's wrong? Usually their accountant,
weeks later. 'Hey, margins were weird in March.' By then the money's gone.

Big companies solve this with analysts staring at dashboards. Small brands can't —
no analyst, and the owner's too busy running the thing. Dashboard tools don't fix this,
because a dashboard only answers questions you already thought to ask, on the day you
remember to look.

SelfAudit is the employee they can't afford: it looks at everything, every day. It knows
how businesses break — we wrote that playbook, pattern by pattern, from published business
research — and it checks *your* numbers against those patterns. When it speaks, it shows
its work: the actual refunds, tickets, dates. And the detecting is done by math, not by AI —
AI just writes the explanation. That's the trust trick. One false alarm kills a product
like this, so the whole design is built around never sending one."

### How it works — four steps, zero jargon
1. **Connect** — store, payments, books, support inbox. Minutes, not days.
2. **Learn** — it figures out what "normal" looks like for this specific business, and asks
   the owner a few plain questions to fill gaps.
3. **Watch** — every day, math checks everything. Small signals across different tools get
   connected into one picture.
4. **Speak** — only when it matters: what broke, why, dollars, next move. Plus a monthly
   "money found / money protected" page.

### Who pays, and how much
Shopify brands, roughly $5–30M in sales, 15–75 people, no data team, real money leaking
through returns, fulfillment mistakes, and inventory problems. Design partners at
$399–499/mo; $999/mo once the monthly report routinely shows $5–10k+ found or protected.
The comparable spend already exists in this segment (Triple Whale $1,100+/mo, Peel
$539–899/mo) — but those sell marketing analytics with dashboards; nobody's selling the
watchdog.

### How we get customers (first 10)
Not ads, not cold-calling brand founders. We go through the accountants — fractional CFOs
and e-commerce bookkeeping firms who each run the books for 10–20 brands. Offer: a free
look-back scan on one client — "we found the $18,000 you missed last quarter" — and the
demo IS that missed incident. They bring the next ten clients; they get recurring revenue
for it.

### Why now
AI can finally read messy business data and explain problems in plain language — that
wasn't possible three years ago. But everyone's building "chat with your data," which still
waits for the owner to ask. The opening is *proactive + trustworthy*: detection by math,
explanation by AI on a leash. And the platform tools (Shopify's assistant, QuickBooks' AI)
are each locked inside their own walls — the expensive problems live *between* the walls.

### The moat (in plain words)
1. The **playbook of failure patterns** — hand-built, source-backed, tested; not something
   a wrapper startup copies in a weekend.
2. The **plumbing done right** — verified field meanings, identities matched across tools,
   alerts you can audit. Boring, hard, and exactly what everyone else skips.
3. **Compounding personal knowledge** — every month it runs, it knows this business better:
   confirmed patterns, answered questions, verified incidents. A competitor syncing the same
   APIs starts from zero.
4. An **incident library** that grows with every catch — the real-world proof no one can
   fake.

### Honest status (never inflate; YC smells it)
Built solo over ~4 months. The engine works end-to-end on the Shopify stack today.
First stores connecting now; zero paying customers as of the application. The plan is not
"raise then find users" — it's: forensic scans through CFO partners → verified catches →
first paid pilots → apply the same playbook ten more times.

### The 12-month picture
10 paying brands, 20+ verified catches with documented dollar impact, alert precision
above 80%, a reputation for one specific problem ("the return-spike people"), then widen:
more incident types, more verticals, and eventually direct-database connections — the same
engine pointed at bigger companies' own systems.

---

## 4. Rapid-fire — the questions they'll actually ask (10-second answers)

**"You built for months with zero users. Why?"**
"Fair. I over-built before selling — I know it. That's exactly why the next milestone is
three paying stores, not more features. The build phase is over."

**"Why won't Shopify's AI kill you?"**
"Sidekick ends at Shopify's wall. The expensive problems connect the store to the shipper
to the support inbox to the books. Platforms don't cross each other's walls — we live in
the cracks between them."

**"Triple Whale? Polar?"**
"They sell marketing dashboards to media buyers — 'is my ad spend working.' We sell loss
prevention to owners — 'what's quietly costing me money.' Different buyer, different
question, and they're structurally committed to dashboards. We're committed to not having
one."

**"What if the AI is wrong?"**
"The AI can't fire an alert — only math can. The AI writes the explanation, restricted to
evidence you can click and check. If we can't explain something, we say 'unexplained,
here's what to check.' And we track our precision like it's revenue, because it is."

**"Solo founder?"**
"Yes, and I know the stats. What I'd show you: speed. This went from idea to working
system solo in months, and the buildout plan for the next 90 days is written and public.
If the right co-founder appears, great — I'm not waiting for one."

**"How is this not consulting in disguise?"**
"Onboarding is minutes and the daily loop is fully automatic. The only human step in v1
is me reviewing alerts before they go out — that's a quality gate I remove as precision
proves out, not a service I'm hiding."

**"Why will anyone pay $999?"**
"They won't — until the monthly page shows we found more than we cost. Design partners
start at $399. The price follows the proof, and in this segment one caught incident pays
for the year."

**"What if a business runs on homegrown software you can't connect to?"**
"We don't need the full picture to be useful — we need the parts we watch to be
trustworthy. The product shows the owner exactly which areas have signal and which don't,
and it never diagnoses what it can't see. Homegrown tools sit on ordinary databases, and
our read-only database connector is the next connector class — same engine, one more pipe.
Today, a business that's 100% homegrown isn't our first customer, and that's fine."

**"What if you only see partial data — won't the monitoring be wrong?"**
"Partial coverage honestly labeled beats full coverage falsely claimed. Every connected
tool declares what it's verified for, every area shows whether it has live signal, and an
alert only fires from real numbers with the evidence attached. When we can't see
something, we say so — and ask — instead of guessing."

**"Aren't your thresholds arbitrary? 5% churn is fine for one business, fatal for another."**
"Exactly — that's why owners define their own. We ship sensible defaults so day one isn't
homework, but every threshold is theirs to set or disable. The system learns what 'normal'
means for this specific business; it never imposes someone else's."

**"What do you want from YC?"**
"Distribution discipline and pressure. The engine exists; the company doesn't yet. YC is
the difference between a good machine and a business with ten paying customers by demo day."

---

## 5. Between now and July 24 (the prep checklist)

- [ ] 15-day build per blueprint §8 (v1 scope only — resist everything else)
- [ ] Seeded demo store with realistic incident data (the hoodie story)
- [ ] Run one real forensic scan (own store or a friendly brand) — even one verified catch
      transforms the application from "idea" to "it caught this"
- [ ] Record demo video (script §2) — screen only, one take feel, under 3 min
- [ ] Record founder video (script §1) — one minute, no cuts if possible
- [ ] Application answers drafted from §3 (the brief maps 1:1 to YC's questions)
- [ ] Rapid-fire drill (§4) out loud, daily, last 5 days
