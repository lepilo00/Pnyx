-- Phase 4 (irreversible): run only after a backup and at least 24 hours of
-- verified free-model operation. Keep this outside migrations so db push does
-- not collapse the rollback window.
begin;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'stops' and column_name = 'is_bonus'
  ) then
    execute $sql$
      update public.stops set story_type = 'bonus'
      where is_bonus = true and story_type <> 'bonus'
    $sql$;
  end if;
end
$$;

delete from public.analytics_events
where event_name in (
  'would_pay_answered', 'donation_unlock', 'paywall_shown', 'unlock_confirmed'
);

delete from public.app_settings where key = 'unlock_price_eur';

alter table public.stops
  drop column if exists is_paid,
  drop column if exists is_bonus;

alter table public.walks
  drop column if exists price,
  drop column if exists stripe_product_id;

alter table public.feedback_surveys
  drop column if exists survey_price,
  drop column if exists price_choices;

commit;
