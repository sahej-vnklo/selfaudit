import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'saheje@gmail.com'

const G = {
  green:      '#1D9E75',
  greenLight: '#E1F5EE',
  greenDark:  '#0F6E56',
  bg:         '#F5F4F0',
  white:      '#FFFFFF',
  border:     '#E5E3DC',
  ink:        '#1A1A1A',
  inkMuted:   '#6B6B6B',
  inkFaint:   '#9A9A9A',
  red:        '#C0392B',
  redLight:   '#FDECEA',
}

function getServiceClient() {
  const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://spinhhzpboojmpndaxue.supabase.co'
  const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: `3px solid ${G.border}`,
        borderTopColor: G.green,
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div style={{
      background: G.redLight, color: G.red, border: `1px solid #f5c6c2`,
      borderRadius: 8, padding: '12px 16px', fontSize: 14, marginBottom: 20,
    }}>
      {message}
    </div>
  )
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'none', border: `1px solid ${G.border}`,
        borderRadius: 8, padding: '8px 14px', fontSize: 14,
        color: G.inkMuted, cursor: 'pointer', marginBottom: 24,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = G.green}
      onMouseLeave={e => e.currentTarget.style.borderColor = G.border}
    >
      ← Back to users
    </button>
  )
}

function Badge({ label, bg, color }) {
  return (
    <span style={{
      background: bg ?? G.greenLight, color: color ?? G.greenDark,
      borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 600,
    }}>
      {label}
    </span>
  )
}

const TIER_COLORS = {
  essential: { bg: '#E1F5EE', color: '#0F6E56' },
  business:  { bg: '#E6F1FB', color: '#185FA5' },
  portfolio: { bg: '#EEEDFE', color: '#534AB7' },
  free:      { bg: '#E1F5EE', color: '#0F6E56' },
  paid:      { bg: '#E6F1FB', color: '#185FA5' },
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── User List ────────────────────────────────────────────────────────────────

function UserList({ onSelectUser }) {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    async function load() {
      const sb = getServiceClient()
      if (!sb) { setError('VITE_SUPABASE_SERVICE_ROLE_KEY not set'); setLoading(false); return }
      const { data, error: err } = await sb.from('admin_user_overview').select('*').order('created_at', { ascending: false })
      if (err) setError(err.message)
      else setUsers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const cols = [
    { key: 'name',         label: 'Name',     width: '16%' },
    { key: 'email',        label: 'Email',    width: '22%' },
    { key: 'tier',         label: 'Tier',     width: '11%' },
    { key: 'industry',     label: 'Industry', width: '16%' },
    { key: 'domain',       label: 'Domain',   width: '14%' },
    { key: 'report_count', label: 'Reports',  width: '9%'  },
    { key: 'created_at',   label: 'Joined',   width: '12%' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: G.ink }}>All Users</h2>
        <span style={{ fontSize: 14, color: G.inkMuted }}>{users.length} total</span>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? <Spinner /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${G.border}` }}>
                {cols.map(c => (
                  <th key={c.key} style={{
                    width: c.width, padding: '10px 12px', textAlign: 'left',
                    fontWeight: 600, color: G.inkMuted, whiteSpace: 'nowrap',
                  }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={cols.length} style={{ padding: '32px 12px', textAlign: 'center', color: G.inkFaint }}>No users found.</td></tr>
              )}
              {users.map((u, i) => {
                const tc = TIER_COLORS[u.tier] ?? TIER_COLORS.essential
                return (
                  <tr
                    key={u.id ?? i}
                    onClick={() => onSelectUser(u)}
                    style={{
                      borderBottom: `1px solid ${G.border}`,
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = G.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 12px', color: G.ink, fontWeight: 500 }}>{u.name || '—'}</td>
                    <td style={{ padding: '12px 12px', color: G.inkMuted }}>{u.email}</td>
                    <td style={{ padding: '12px 12px' }}>
                      {u.tier ? <Badge label={u.tier} bg={tc.bg} color={tc.color} /> : '—'}
                    </td>
                    <td style={{ padding: '12px 12px', color: G.inkMuted }}>{u.industry || '—'}</td>
                    <td style={{ padding: '12px 12px', color: G.inkMuted }}>{u.domain || '—'}</td>
                    <td style={{ padding: '12px 12px', color: G.ink, textAlign: 'center', fontWeight: 600 }}>{u.report_count ?? 0}</td>
                    <td style={{ padding: '12px 12px', color: G.inkMuted, whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── User Detail ──────────────────────────────────────────────────────────────

function UserDetail({ user, onBack }) {
  const [reports, setReports]   = useState([])
  const [chats, setChats]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    async function load() {
      const sb = getServiceClient()
      if (!sb) { setError('VITE_SUPABASE_SERVICE_ROLE_KEY not set'); setLoading(false); return }

      const [{ data: rData, error: rErr }, { data: cData, error: cErr }] = await Promise.all([
        sb.from('reports').select('id, title, industry, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        sb.from('chats').select('id, created_at, messages').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      if (rErr || cErr) setError((rErr ?? cErr).message)
      setReports(rData ?? [])
      setChats(cData ?? [])
      setLoading(false)
    }
    load()
  }, [user.id])

  const tc = TIER_COLORS[user.tier] ?? TIER_COLORS.essential

  return (
    <div>
      <BackButton onClick={onBack} />

      {/* User info card */}
      <div style={{
        background: G.white, border: `1px solid ${G.border}`,
        borderRadius: 12, padding: '24px 28px', marginBottom: 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: G.ink, marginBottom: 4 }}>{user.name || '(no name)'}</h2>
            <p style={{ fontSize: 14, color: G.inkMuted }}>{user.email}</p>
          </div>
          {user.tier && <Badge label={user.tier} bg={tc.bg} color={tc.color} />}
        </div>
        <div style={{ display: 'flex', gap: 32, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            ['Industry', user.industry],
            ['Domain',   user.domain],
            ['Joined',   fmtDate(user.created_at)],
            ['Reports',  user.report_count ?? '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <p style={{ fontSize: 11, fontWeight: 600, color: G.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 15, color: G.ink }}>{val || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? <Spinner /> : (
        <>
          {/* Reports */}
          <section style={{ marginBottom: 36 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: G.ink, marginBottom: 14 }}>
              Reports <span style={{ color: G.inkFaint, fontWeight: 400 }}>({reports.length})</span>
            </h3>
            {reports.length === 0 ? (
              <p style={{ color: G.inkFaint, fontSize: 14 }}>No reports yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reports.map(r => (
                  <div key={r.id} style={{
                    background: G.white, border: `1px solid ${G.border}`,
                    borderRadius: 8, padding: '12px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                  }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: G.ink }}>{r.title || '(untitled)'}</p>
                      {r.industry && <p style={{ fontSize: 12, color: G.inkMuted, marginTop: 2 }}>{r.industry}</p>}
                    </div>
                    <p style={{ fontSize: 12, color: G.inkFaint, whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Chats */}
          <section>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: G.ink, marginBottom: 14 }}>
              Chats <span style={{ color: G.inkFaint, fontWeight: 400 }}>({chats.length})</span>
            </h3>
            {chats.length === 0 ? (
              <p style={{ color: G.inkFaint, fontSize: 14 }}>No chats yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chats.map(c => {
                  const preview = (() => {
                    try {
                      const msgs = typeof c.messages === 'string' ? JSON.parse(c.messages) : c.messages
                      const first = Array.isArray(msgs) ? msgs[0] : null
                      const text = first?.content ?? first?.text ?? ''
                      return typeof text === 'string' ? text.slice(0, 100) : ''
                    } catch { return '' }
                  })()
                  return (
                    <div key={c.id} style={{
                      background: G.white, border: `1px solid ${G.border}`,
                      borderRadius: 8, padding: '12px 16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                    }}>
                      <p style={{ fontSize: 13, color: G.inkMuted, flex: 1 }}>
                        {preview || <span style={{ color: G.inkFaint, fontStyle: 'italic' }}>empty</span>}
                      </p>
                      <p style={{ fontSize: 12, color: G.inkFaint, whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboard({ session, onUnauthorized }) {
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    if (!session || session.user?.email !== ADMIN_EMAIL) {
      onUnauthorized?.()
    }
  }, [session, onUnauthorized])

  if (!session || session.user?.email !== ADMIN_EMAIL) return null

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: 'var(--sans, DM Sans, system-ui, sans-serif)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${G.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              background: G.greenLight, color: G.greenDark,
              borderRadius: 8, padding: '4px 10px', fontSize: 11,
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Admin</span>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: G.ink }}>TSA Dashboard</h1>
          </div>
          <p style={{ fontSize: 13, color: G.inkFaint }}>{session.user.email}</p>
        </div>

        {/* Content */}
        <div style={{
          background: G.white, border: `1px solid ${G.border}`,
          borderRadius: 12, padding: '28px 32px',
        }}>
          {selectedUser
            ? <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />
            : <UserList onSelectUser={setSelectedUser} />
          }
        </div>
      </div>
    </div>
  )
}
