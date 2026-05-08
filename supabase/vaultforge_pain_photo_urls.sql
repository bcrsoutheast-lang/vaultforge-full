-- VaultForge Pain Button photo support
-- Safe additive column only. Does not modify existing records or policies.
alter table public.vf_pain_submissions
add column if not exists photo_urls text[] default array[]::text[];
