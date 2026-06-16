# Phase 4 Implementation — Action Execution Backbone

## Context

SelfAudit already has a full artifact generation system (`src/components/ExecutionPanel.jsx` + `api/generate-artifact.js`). It generates 8 artifact types from audit findings and saves them to the `artifacts` table.

Phase 4 adds the ability to **push approved artifacts into real tools** (Gmail, Slack, Notion) via Composio — with a mandatory approval step. Nothing executes automatically. Every action must be staged first, then approved by the user.

**Four-layer separation — never blur these:**
1. Findings → from health check
2. Artifacts → Claude-written outputs (already built)
3. Action Candidates → what the system wants to DO with an artifact (Phase 4 adds this)
4. Executions → what actually happened (Phase 4 adds this)

---

## Verified Composio Slugs (exact, confirmed via API)

```
GMAIL_CREATE_EMAIL_DRAFT
  params: recipient_email, subject, body, is_html, cc, bcc, thread_id, attachment, extra_recipients

SLACK_SEND_MESSAGE
  params: channel, markdown_text, fallback_text, blocks, thread_ts, unfurl_links, unfurl_media, reply_broadcast

NOTION_CREATE_NOTION_PAGE
  params: parent_id, title, markdown, icon, cover
```

The execution primitive already exists in `api/lib/connectors/composio.js`:
```js
executeTool(userId, toolSlug, args = {})
// POSTs to Composio on behalf of the user. Throws on error.
```

---

## Files to Create

### 1. `api/lib/actions/registry.js` (NEW)

Pure JS config. No DB. Same pattern as `api/lib/connectors/tool-registry.js`.

```js
// Maps artifact types to their Composio action config.
// Only 3 artifact types have actions in v1.
// Add new action types here only — never elsewhere.

export const ACTION_REGISTRY = {
  EMAIL: {
    label: 'Send Email Draft',
    description: 'Creates a Gmail draft from this Email artifact.',
    tool: 'GMAIL_CREATE_EMAIL_DRAFT',
    connector: 'gmail',
    requiresInput: [
      { key: 'recipient_email', label: 'Recipient email address', placeholder: 'name@example.com' },
    ],
    buildArgs(artifact, userInput = {}) {
      const subjectSection = artifact.sections?.find(s => s.label === 'Subject Line')
      const bodySection = artifact.sections?.find(s => s.label === 'Body')
      return {
        recipient_email: userInput.recipient_email || '',
        subject: subjectSection?.content || artifact.title || '',
        body: bodySection?.content || '',
        is_html: false,
      }
    },
  },

  TEAM_BRIEF: {
    label: 'Post to Slack',
    description: 'Sends this Team Brief to a Slack channel.',
    tool: 'SLACK_SEND_MESSAGE',
    connector: 'slack',
    requiresInput: [
      { key: 'channel', label: 'Slack channel', placeholder: '#general or channel ID' },
    ],
    buildArgs(artifact, userInput = {}) {
      const sections = artifact.sections || []
      const markdown = sections.map(s => `*${s.label}*\n${s.content}`).join('\n\n')
      return {
        channel: userInput.channel || '',
        markdown_text: `*${artifact.title}*\n\n${markdown}`,
      }
    },
  },

  ACTION_PLAN: {
    label: 'Push to Notion',
    description: 'Creates a Notion page from this Action Plan.',
    tool: 'NOTION_CREATE_NOTION_PAGE',
    connector: 'notion',
    requiresInput: [
      { key: 'parent_id', label: 'Notion page or database ID', placeholder: 'Paste Notion page ID' },
    ],
    buildArgs(artifact, userInput = {}) {
      const sections = artifact.sections || []
      const markdown = sections.map(s => `## ${s.label}\n\n${s.content}`).join('\n\n')
      return {
        parent_id: userInput.parent_id || '',
        title: artifact.title || 'Action Plan',
        markdown,
      }
    },
  },
}

// Returns the registry entry for an artifact type, or null if no action exists.
export function getActionForArtifact(artifactType) {
  return ACTION_REGISTRY[artifactType] ?? null
}
```

---

### 2. Supabase SQL Migration (run this in Supabase dashboard SQL editor)

```sql
-- pending_actions: one row per staged action waiting for user approval
CREATE TABLE IF NOT EXISTS pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES artifacts(id),
  action_type TEXT NOT NULL,
  tool_slug TEXT NOT NULL,
  connector TEXT NOT NULL,
  title TEXT,
  staged_args JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pending_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pending actions"
  ON pending_actions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS pending_actions_user_status ON pending_actions(user_id, status);

-- execution_log: permanent record of every approve/dismiss decision
CREATE TABLE IF NOT EXISTS execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pending_action_id UUID REFERENCES pending_actions(id),
  action_type TEXT NOT NULL,
  tool_slug TEXT NOT NULL,
  connector TEXT NOT NULL,
  final_args JSONB NOT NULL DEFAULT '{}',
  outcome TEXT NOT NULL,
  composio_result JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE execution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own execution log"
  ON execution_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS execution_log_user_executed ON execution_log(user_id, executed_at DESC);
```

---

### 3. `api/actions/feed.js` (NEW)

GET `/api/actions/feed?userId=xxx` — returns pending actions and execution history for dashboard.

```js
import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from '../lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const userId = req.query.userId
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const authError = await validateUserToken(req, res, userId)
  if (authError) return

  const [pendingRes, historyRes] = await Promise.all([
    supabase
      .from('pending_actions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('execution_log')
      .select('*')
      .eq('user_id', userId)
      .order('executed_at', { ascending: false })
      .limit(20),
  ])

  return res.status(200).json({
    pending: pendingRes.data || [],
    history: historyRes.data || [],
  })
}
```

---

### 4. `api/actions/stage.js` (NEW)

POST `/api/actions/stage` — stage an action candidate from an artifact. Called from ExecutionPanel push button.

```js
import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from '../lib/auth.js'
import { getActionForArtifact } from '../lib/actions/registry.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, artifactId, artifactType, artifact } = req.body
  if (!userId || !artifactType || !artifact) {
    return res.status(400).json({ error: 'userId, artifactType, artifact required' })
  }

  const authError = await validateUserToken(req, res, userId)
  if (authError) return

  const action = getActionForArtifact(artifactType)
  if (!action) {
    return res.status(400).json({ error: `No action registered for artifact type: ${artifactType}` })
  }

  // Build staged args without user input — user provides finalArgs at approval time
  const stagedArgs = action.buildArgs(artifact, {})

  const { data, error } = await supabase.from('pending_actions').insert({
    user_id: userId,
    artifact_id: artifactId || null,
    action_type: artifactType,
    tool_slug: action.tool,
    connector: action.connector,
    title: artifact.title || action.label,
    staged_args: stagedArgs,
    status: 'pending',
  }).select().single()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ action: data })
}
```

---

### 5. `api/actions/execute.js` (NEW)

POST `/api/actions/execute` — approve (execute via Composio) or dismiss a pending action.

```js
import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from '../lib/auth.js'
import { executeTool } from '../lib/connectors/composio.js'
import { getActionForArtifact } from '../lib/actions/registry.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, pendingActionId, decision, finalArgs } = req.body
  // decision: 'approve' | 'dismiss'
  if (!userId || !pendingActionId || !decision) {
    return res.status(400).json({ error: 'userId, pendingActionId, decision required' })
  }
  if (!['approve', 'dismiss'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approve or dismiss' })
  }

  const authError = await validateUserToken(req, res, userId)
  if (authError) return

  // Load the pending action — verify ownership
  const { data: pendingAction, error: loadError } = await supabase
    .from('pending_actions')
    .select('*')
    .eq('id', pendingActionId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single()

  if (loadError || !pendingAction) {
    return res.status(404).json({ error: 'Pending action not found or already resolved' })
  }

  if (decision === 'dismiss') {
    await supabase.from('pending_actions').update({ status: 'dismissed', updated_at: new Date().toISOString() }).eq('id', pendingActionId)
    await supabase.from('execution_log').insert({
      user_id: userId,
      pending_action_id: pendingActionId,
      action_type: pendingAction.action_type,
      tool_slug: pendingAction.tool_slug,
      connector: pendingAction.connector,
      final_args: {},
      outcome: 'dismissed',
    })
    return res.status(200).json({ outcome: 'dismissed' })
  }

  // decision === 'approve'
  const action = getActionForArtifact(pendingAction.action_type)
  if (!action) return res.status(500).json({ error: 'Action type not found in registry' })

  // Merge staged args with finalArgs from user (finalArgs override — user-provided inputs like recipient_email)
  const mergedArgs = { ...pendingAction.staged_args, ...(finalArgs || {}) }

  // Validate required user inputs are present
  const missingInputs = (action.requiresInput || []).filter(field => !mergedArgs[field.key])
  if (missingInputs.length > 0) {
    return res.status(400).json({
      error: `Missing required inputs: ${missingInputs.map(f => f.label).join(', ')}`,
      missingInputs,
    })
  }

  let composioResult = null
  let outcome = 'success'
  let errorMessage = null

  try {
    composioResult = await executeTool(userId, pendingAction.tool_slug, mergedArgs)
    await supabase.from('pending_actions').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', pendingActionId)
  } catch (err) {
    outcome = 'failed'
    errorMessage = err.message || 'Execution failed'
    await supabase.from('pending_actions').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', pendingActionId)
  }

  await supabase.from('execution_log').insert({
    user_id: userId,
    pending_action_id: pendingActionId,
    action_type: pendingAction.action_type,
    tool_slug: pendingAction.tool_slug,
    connector: pendingAction.connector,
    final_args: mergedArgs,
    outcome,
    composio_result: composioResult || null,
    error_message: errorMessage,
  })

  if (outcome === 'failed') {
    return res.status(500).json({ error: errorMessage, outcome: 'failed' })
  }

  return res.status(200).json({ outcome: 'success', result: composioResult })
}
```

---

### 6. `src/components/ExecutionPanel.jsx` (EXTEND — do not rewrite)

Three targeted additions. Read the file fully before touching it.

**Addition A — imports at top of file (after existing imports):**
```js
import { ACTION_REGISTRY } from '../lib/actions/registry.js'
```

Wait — registry is in `api/lib/`, which is backend. Do NOT import it on the frontend. The frontend does not know the registry. Instead, hardcode which artifact types have a push action in the frontend config object.

**Addition A (correct) — add near the top of ExecutionPanel.jsx after the existing ARTIFACT_LABELS / ARTIFACT_ICONS objects:**
```js
// Artifact types that have a push action in v1
const PUSH_ACTIONS = {
  EMAIL:      { label: 'Send Email Draft', connector: 'gmail',  inputKey: 'recipient_email', inputLabel: 'Recipient email', inputPlaceholder: 'name@example.com' },
  TEAM_BRIEF: { label: 'Post to Slack',    connector: 'slack',  inputKey: 'channel',         inputLabel: 'Slack channel',   inputPlaceholder: '#channel or ID' },
  ACTION_PLAN: { label: 'Push to Notion',  connector: 'notion', inputKey: 'parent_id',       inputLabel: 'Notion page ID',  inputPlaceholder: 'Paste Notion page ID' },
}
```

**Addition B — state at the top of the ExecutionPanel component (near other useState hooks):**
```js
const [stagingAction, setStagingAction] = useState(false)
const [stagedAction, setStagedAction] = useState(null)   // { id, actionType, label } after staging
const [stageError, setStageError] = useState(null)
```

**Addition C — the push button UI, inside the `{artifact && (` block, right after the PDF button (after line ~804).**

Add this button in the same `div` that holds "Copy all" and "PDF", and a staging status line below the buttons:

```jsx
{/* Push to app button — only for artifact types with a registered action */}
{PUSH_ACTIONS[selectedType] && (
  <button
    type="button"
    style={{ ...ep.copyAllBtn, background: 'var(--ember)', color: '#fff', border: 'none' }}
    disabled={stagingAction || !!stagedAction}
    onClick={async () => {
      setStagingAction(true)
      setStageError(null)
      try {
        const token = artifactToken   // already in scope
        const res = await fetch('/api/actions/stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            userId: scopedUserInfo?.userId ?? null,
            artifactId: pastArtifacts[0]?.id ?? null,
            artifactType: selectedType,
            artifact,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Stage failed')
        setStagedAction({ id: data.action.id, actionType: selectedType, label: PUSH_ACTIONS[selectedType].label })
      } catch (e) {
        setStageError(e.message)
      } finally {
        setStagingAction(false)
      }
    }}
  >
    {stagingAction ? '...' : stagedAction ? 'Queued ✓' : PUSH_ACTIONS[selectedType]?.label}
  </button>
)}
```

And below the button group div, show staging feedback:
```jsx
{stageError && <p style={{ fontSize: 12, color: 'var(--red, #e55)', marginTop: 6 }}>{stageError}</p>}
{stagedAction && (
  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
    Added to your action queue — approve it from the dashboard home.
  </p>
)}
```

Also reset `stagedAction` and `stageError` when `artifact` changes (new artifact generated):
```js
// Add this in the generateArtifact function, right before setArtifact(data.artifact):
setStagedAction(null)
setStageError(null)
```

---

### 7. Dashboard home — Pending Actions Block and Execution History Block

Read `src/components/Dashboard.jsx` before touching it. Find where the home section renders and add these two blocks at the bottom of the home section content, after any existing cards.

Add state in Dashboard:
```js
const [actionFeed, setActionFeed] = useState({ pending: [], history: [] })
const [feedLoaded, setFeedLoaded] = useState(false)
```

Fetch on load (alongside the existing schema fetch, similar pattern):
```js
// After the schema fetch block, add:
const fetchActionFeed = async () => {
  if (!user?.id) return
  try {
    const session = await sb.auth.getSession()
    const token = session?.data?.session?.access_token
    const res = await fetch(`/api/actions/feed?userId=${user.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (res.ok) {
      const data = await res.json()
      setActionFeed(data)
    }
  } catch (_) {}
  finally { setFeedLoaded(true) }
}
fetchActionFeed()
```

**Pending Actions block UI (in the home section render):**

Only show if `feedLoaded && actionFeed.pending.length > 0`.

```jsx
{feedLoaded && actionFeed.pending.length > 0 && (
  <div style={{ /* same card wrapper style as other dashboard cards */ }}>
    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted)', marginBottom: 12 }}>
      Action Queue
    </div>
    {actionFeed.pending.map((action) => (
      <PendingActionCard
        key={action.id}
        action={action}
        userId={user.id}
        onResolved={(id, outcome) => {
          setActionFeed(prev => ({
            ...prev,
            pending: prev.pending.filter(a => a.id !== id),
            history: outcome !== 'dismissed'
              ? [{ pending_action_id: id, action_type: action.action_type, outcome, executed_at: new Date().toISOString() }, ...prev.history]
              : prev.history,
          }))
        }}
      />
    ))}
  </div>
)}
```

**Execution History block UI:**

Only show if `feedLoaded && actionFeed.history.length > 0`.

```jsx
{feedLoaded && actionFeed.history.length > 0 && (
  <div style={{ /* same card wrapper style */ marginTop: 16 }}>
    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted)', marginBottom: 12 }}>
      Execution History
    </div>
    {actionFeed.history.slice(0, 5).map((log) => (
      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{log.action_type?.replace('_', ' ')}</span>
        <span style={{ fontSize: 12, color: log.outcome === 'success' ? 'var(--ember)' : 'var(--muted)' }}>
          {log.outcome} · {log.executed_at ? new Date(log.executed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
        </span>
      </div>
    ))}
  </div>
)}
```

**`PendingActionCard` component — add at the bottom of Dashboard.jsx (or in a new file if Dashboard is already too large):**

This is an inline component that handles the approval input + API calls:

```jsx
function PendingActionCard({ action, userId, onResolved }) {
  const PUSH_ACTIONS = {
    EMAIL:      { inputKey: 'recipient_email', inputLabel: 'Recipient email', inputPlaceholder: 'name@example.com' },
    TEAM_BRIEF: { inputKey: 'channel',         inputLabel: 'Slack channel',   inputPlaceholder: '#channel or ID' },
    ACTION_PLAN: { inputKey: 'parent_id',      inputLabel: 'Notion page ID',  inputPlaceholder: 'Paste Notion page ID' },
  }
  const actionMeta = PUSH_ACTIONS[action.action_type]
  const [inputVal, setInputVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const resolve = async (decision) => {
    setLoading(true)
    setError(null)
    try {
      const sb = initSupabase()
      const session = await sb.auth.getSession()
      const token = session?.data?.session?.access_token
      const finalArgs = decision === 'approve' && actionMeta ? { [actionMeta.inputKey]: inputVal } : {}
      const res = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId, pendingActionId: action.id, decision, finalArgs }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      onResolved(action.id, data.outcome)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{action.title}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{action.action_type?.replace('_', ' ')} via {action.connector}</div>
        </div>
      </div>
      {actionMeta && (
        <input
          type="text"
          placeholder={actionMeta.inputPlaceholder}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }}
        />
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          disabled={loading || (actionMeta && !inputVal.trim())}
          onClick={() => resolve('approve')}
          style={{ padding: '6px 14px', fontSize: 12, background: 'var(--ember)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '...' : 'Approve'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => resolve('dismiss')}
          style={{ padding: '6px 14px', fontSize: 12, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
        >
          Dismiss
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: 'var(--red, #e55)', marginTop: 6 }}>{error}</p>}
    </div>
  )
}
```

---

## Hard Rules

1. **Do not rewrite `ExecutionPanel.jsx`** — it is 1253 lines. Make surgical additions only (3 additions described above). Do not restructure or rename anything.
2. **Do not add a database column or table beyond the SQL migration above.** The two tables are the complete schema for Phase 4.
3. **Do not call `executeTool` directly from the frontend or from the stage endpoint.** Only `api/actions/execute.js` calls Composio.
4. **Do not auto-execute anything.** Every action requires an explicit `decision: 'approve'` POST.
5. **Do not add memory/retry/rollback logic.** The `execution_log` is append-only. No retries in v1.
6. **`api/lib/actions/registry.js` is backend only.** Do not import it in any frontend component. The frontend has its own inline `PUSH_ACTIONS` constant (Addition A above).
7. **Auth pattern:** All 3 API endpoints use `validateUserToken(req, res, userId)` imported from `../lib/auth.js`. The function handles the response itself on auth failure — just `return` after calling it if it returned truthy.
8. **vercel.json does not need changes.** The wildcard `/api/(.*)` rewrite already covers `api/actions/*`.

---

## Build Order

1. SQL migration (run in Supabase SQL editor)
2. `api/lib/actions/registry.js`
3. `api/actions/stage.js`
4. `api/actions/feed.js`
5. `api/actions/execute.js`
6. `src/components/ExecutionPanel.jsx` — additions A, B, C
7. `src/components/Dashboard.jsx` — action feed state + fetch + two UI blocks + PendingActionCard

## QC Checkpoint (for Claude to verify after Codex delivers)

- [ ] `api/lib/actions/registry.js` exports `ACTION_REGISTRY` and `getActionForArtifact`
- [ ] `api/actions/stage.js` calls `getActionForArtifact` and inserts to `pending_actions` — never calls `executeTool`
- [ ] `api/actions/execute.js` loads from `pending_actions` by `id + user_id`, enforces ownership, handles both decisions, always writes to `execution_log`
- [ ] `api/actions/feed.js` queries both tables, returns `{ pending, history }`
- [ ] ExecutionPanel has `PUSH_ACTIONS` object and push button only appears for EMAIL, TEAM_BRIEF, ACTION_PLAN
- [ ] Push button sets `stagedAction` state and does NOT call execute directly
- [ ] Dashboard shows pending actions block and history block (conditional on data)
- [ ] `PendingActionCard` calls `/api/actions/execute` with `decision` and `finalArgs`
- [ ] No per-connector files created anywhere
- [ ] No direct Composio calls from frontend
