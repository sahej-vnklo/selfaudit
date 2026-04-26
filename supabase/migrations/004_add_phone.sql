-- Add phone number to user profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
