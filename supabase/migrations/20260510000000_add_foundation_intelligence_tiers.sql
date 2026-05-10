-- Add foundation and intelligence to the tier check constraint.
-- The old constraint only allowed essential/business/portfolio/free/paid,
-- causing profile updates from the signup flow to be silently rejected.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_tier_check
  CHECK (tier IN ('foundation', 'intelligence', 'essential', 'business', 'portfolio', 'free', 'paid'));

-- Update column default from the old name to the new one.
ALTER TABLE public.profiles ALTER COLUMN tier SET DEFAULT 'foundation';
