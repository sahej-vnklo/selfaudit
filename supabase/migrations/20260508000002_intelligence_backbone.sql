CREATE TABLE IF NOT EXISTS public.intelligence_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  summary text,
  active_goal text,
  goal_score integer DEFAULT 0,
  confidence text,
  top_headlines text[] DEFAULT '{}'::text[],
  focus_areas text[] DEFAULT '{}'::text[],
  domains_audited text[] DEFAULT '{}'::text[],
  repeated_blockers text[] DEFAULT '{}'::text[],
  top_priorities text[] DEFAULT '{}'::text[],
  watchouts text[] DEFAULT '{}'::text[],
  opportunities text[] DEFAULT '{}'::text[],
  changes_since_last text[] DEFAULT '{}'::text[],
  has_verified_brief boolean DEFAULT false,
  has_live_connectors boolean DEFAULT false,
  latest_connector_sync timestamptz,
  source_counts jsonb DEFAULT '{}'::jsonb,
  synthesized_profile jsonb DEFAULT '{}'::jsonb,
  last_synthesized_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intelligence_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  frequency text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'every_3_days', 'weekly')),
  channels text[] NOT NULL DEFAULT ARRAY['in_app'],
  areas text[] NOT NULL DEFAULT ARRAY[
    'goal_progress',
    'revenue',
    'operations',
    'customer_experience',
    'people',
    'connectors',
    'critical_risks'
  ],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.intelligence_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intelligence_profiles'
      AND policyname = 'Users can read own intelligence profile'
  ) THEN
    CREATE POLICY "Users can read own intelligence profile"
      ON public.intelligence_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intelligence_profiles'
      AND policyname = 'Service role full access to intelligence profiles'
  ) THEN
    CREATE POLICY "Service role full access to intelligence profiles"
      ON public.intelligence_profiles
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intelligence_notification_preferences'
      AND policyname = 'Users can read own notification preferences'
  ) THEN
    CREATE POLICY "Users can read own notification preferences"
      ON public.intelligence_notification_preferences
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intelligence_notification_preferences'
      AND policyname = 'Users can upsert own notification preferences'
  ) THEN
    CREATE POLICY "Users can upsert own notification preferences"
      ON public.intelligence_notification_preferences
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intelligence_notification_preferences'
      AND policyname = 'Service role full access to notification preferences'
  ) THEN
    CREATE POLICY "Service role full access to notification preferences"
      ON public.intelligence_notification_preferences
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS intelligence_profiles_last_synthesized_idx
  ON public.intelligence_profiles (last_synthesized_at DESC);

CREATE INDEX IF NOT EXISTS intelligence_notification_preferences_updated_idx
  ON public.intelligence_notification_preferences (updated_at DESC);
