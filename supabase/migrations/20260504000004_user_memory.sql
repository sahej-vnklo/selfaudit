-- User memory table: structured per-user intelligence that accumulates across sessions
CREATE TABLE IF NOT EXISTS public.user_memory (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id       uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  session_date    timestamptz DEFAULT now(),
  headline        text,
  core_problem    text,
  root_causes     text[],
  priority_actions text[],
  ai_opportunities text[],
  domains_audited text[],
  business_state  jsonb,
  ranked_path     jsonb,
  status          text DEFAULT 'open' CHECK (status IN ('open', 'done')),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memory" ON public.user_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to user_memory" ON public.user_memory
  FOR ALL USING (true);

-- Pattern table: anonymous aggregate root causes across all businesses
CREATE TABLE IF NOT EXISTS public.business_patterns (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  industry     text,
  domain       text,
  root_cause   text NOT NULL,
  frequency    integer DEFAULT 1,
  first_seen   timestamptz DEFAULT now(),
  last_seen    timestamptz DEFAULT now()
);
