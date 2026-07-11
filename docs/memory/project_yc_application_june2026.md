---
name: project-yc-application-june2026
description: "YC S26 application sprint — bible, video script, positioning, refactor handover, build pathway (as of June 10, 2026)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 51728c17-503d-4abf-89b8-653db4f5d3f9
---

YC S26 application sprint. Deadline: ~June 13, 2026 (3 days from June 10). Also has Antler Canada tab open as parallel option.

**Positioning (locked):**
- Street answer: "It's an operating system for your business — watches everything running underneath, tells you what's about to break"
- "Unit" not "area" (user-facing). Slogan: "They teach in school that business is a separate entity. I say — why not make it a living one."
- Never say AI/chatbot/BI tool. Key lines: "SelfAudit isn't a downloader, it's a distiller — tools keep their data, we keep the meaning"; "nobody built it a mouth"
- ICP: $2M–$10M ARR, 15–50 employees, non-technical Founder Mode operator. $999/month, ~95% gross margin (~$38–50 COGS/user)
- Fundraise guidance given: ask $500–750K pre-seed, not $2M; YC $500K beats random VC $1M

**Key artifacts:**
- [[reference-sa-bible]] `docs/sa-bible.md` — complete YC prep kit: positioning, 3 analogies (amusement park, smart car, family doctor), Section 2B technical deep-dive (hybrid sync, multi-agent, RBAC, temporal knowledge graph, Perplexity/Aravind Srinivas validation), unit economics, FAQ + YC double-standards counters, interview strategy, rapid-fire glossary (Section 6), final video script (Section 7)
- `docs/schema-engine-refactor-handover.md` — complete spec for schema-driven engine refactor, ready to hand to a fresh session ("read it and execute"). Deliberately renamed ontology→blueprint (user doesn't want to appear to copy Palantir); folder `api/lib/blueprint/`
- Video script final (in bible Section 7): silos pain → OS + "designed around hybrid architecture" → phone call → built solo → slogan. Rule: demo what exists, narrate what's coming — hybrid arch does NOT exist yet, say "designed around" not "built on"

**Current product state (verified via screenshots of tryselfaudit.com):**
- Live: governance monitoring (4 hardcoded areas), Agent X diagnostic / Agent Y solution engines, Cockpit with AI Chief of Staff + severity-ranked issues + department briefings
- Not built: hybrid local-first (daemon, cloud bridge, ~/.selfaudit/), voice layer, agentic execution, schema auto-generation

**Build pathway (agreed order):**
1. YC application (3 days — nothing else)
2. Schema-driven refactor via handover doc (right after submitting; = "velocity between application and interview")
3. Schema auto-generation onboarding (6 questions → Claude generates schema)
4. Hybrid local-first (needs engineer hire)
5. Voice layer (post-YC vision)

**Honesty constraints:** zero users, waitlist only, solo founder, working prototype. Pitch deck "10 pilots active" claim still needs fixing. Bible has known ICP inconsistency (10–200 ppl vs $2M–10M/15–50) — user said fine, it's just for him.
