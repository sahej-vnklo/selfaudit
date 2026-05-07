ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS integrations jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.connector_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  records_fetched integer DEFAULT 0,
  error_message text,
  synced_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.connector_sync_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'connector_sync_logs'
      AND policyname = 'Users can read own connector sync logs'
  ) THEN
    CREATE POLICY "Users can read own connector sync logs"
      ON public.connector_sync_logs
      TO authenticated
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'connector_sync_logs'
      AND policyname = 'Service role full access to connector_sync_logs'
  ) THEN
    CREATE POLICY "Service role full access to connector_sync_logs"
      ON public.connector_sync_logs
      TO service_role
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
