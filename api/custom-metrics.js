// /api/custom-metrics — CRUD for user-defined custom metrics per area.
//
// Expected table (create in Supabase if not exists):
//
// create table user_custom_metrics (
//   id          uuid primary key default gen_random_uuid(),
//   user_id     uuid not null references profiles(id) on delete cascade,
//   area_id     text not null,
//   name        text not null,
//   value       numeric not null,
//   unit        text not null default '',
//   created_at  timestamptz default now(),
//   updated_at  timestamptz default now()
// );
// create index on user_custom_metrics (user_id, area_id);

import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

function isValidAreaId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 80 && /^[a-z0-9-]+$/.test(id)
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  const userId = req.method === 'GET' || req.method === 'DELETE'
    ? req.query.userId
    : req.body?.userId

  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  const sb = getSupabase()

  // ── GET — list custom metrics for an area ─────────────────────────────────
  if (req.method === 'GET') {
    const { area } = req.query
    if (!area || !isValidAreaId(area)) return res.status(400).json({ error: 'Invalid area' })

    const { data, error } = await sb
      .from('user_custom_metrics')
      .select('id, name, value, unit, created_at')
      .eq('user_id', userId)
      .eq('area_id', area)
      .order('created_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ metrics: data ?? [] })
  }

  // ── POST — create a new custom metric ────────────────────────────────────
  if (req.method === 'POST') {
    const { area_id, name, value, unit = '' } = req.body ?? {}

    if (!area_id || !isValidAreaId(area_id))  return res.status(400).json({ error: 'Invalid area_id' })
    if (!name || typeof name !== 'string' || name.trim().length === 0) return res.status(400).json({ error: 'name is required' })
    if (value == null || isNaN(Number(value))) return res.status(400).json({ error: 'value must be a number' })
    if (name.trim().length > 80) return res.status(400).json({ error: 'name too long (max 80 chars)' })

    const { data, error } = await sb
      .from('user_custom_metrics')
      .insert({
        user_id: userId,
        area_id,
        name:    name.trim(),
        value:   Number(value),
        unit:    String(unit).slice(0, 20),
      })
      .select('id, name, value, unit, created_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ metric: data })
  }

  // ── PATCH — upsert a metric by (area_id, name) ───────────────────────────
  if (req.method === 'PATCH') {
    const { area_id, name, value, unit = '' } = req.body ?? {}

    if (!area_id || !isValidAreaId(area_id))  return res.status(400).json({ error: 'Invalid area_id' })
    if (!name || typeof name !== 'string' || name.trim().length === 0) return res.status(400).json({ error: 'name is required' })
    if (value == null || isNaN(Number(value))) return res.status(400).json({ error: 'value must be a number' })

    const { data, error } = await sb
      .from('user_custom_metrics')
      .upsert(
        {
          user_id:    userId,
          area_id,
          name:       name.trim(),
          value:      Number(value),
          unit:       String(unit).slice(0, 20),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,area_id,name' }
      )
      .select('id, name, value, unit, updated_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ metric: data })
  }

  // ── DELETE — remove a custom metric ──────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const { error } = await sb
      .from('user_custom_metrics')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)   // RLS-safe: user can only delete their own

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
