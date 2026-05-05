CREATE TABLE IF NOT EXISTS public.business_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  revenue_streams text[],
  core_offer text,
  target_customer text,
  funnel_stages text[],
  conversion_bottlenecks text[],
  retention_signals text[],
  team_ownership text,
  operational_blockers text[],
  pricing_structure text,
  current_constraints text[],
  active_goal text,
  goal_timeline text,
  goal_baseline text,
  goal_score integer DEFAULT 0,
  goal_score_delta integer DEFAULT 0,
  last_audit_headline text,
  assumptions_unverified text[],
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_state ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'business_state' AND policyname = 'Users can read own business state'
  ) THEN
    CREATE POLICY "Users can read own business state"
      ON public.business_state FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'business_state' AND policyname = 'Users can upsert own business state'
  ) THEN
    CREATE POLICY "Users can upsert own business state"
      ON public.business_state FOR ALL
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'business_state' AND policyname = 'Service role full access to business_state'
  ) THEN
    CREATE POLICY "Service role full access to business_state"
      ON public.business_state FOR ALL
      USING (true);
  END IF;
END $$;
