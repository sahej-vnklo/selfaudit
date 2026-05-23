UPDATE public.profiles
SET tier = 'foundation'
WHERE tier IN ('essential', 'free');

UPDATE public.profiles
SET tier = 'intelligence'
WHERE tier IN ('business', 'portfolio', 'paid');

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_tier_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tier_check
  CHECK (tier IN ('foundation', 'intelligence'));

ALTER TABLE public.profiles
  ALTER COLUMN tier SET DEFAULT 'foundation';
