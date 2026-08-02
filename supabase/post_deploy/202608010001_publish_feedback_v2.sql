-- Phase 3: run only after the free application and updated legal text are live.
-- V1 is closed, never deleted; its submissions and answers remain queryable.
begin;

update public.feedback_surveys old_survey
set status = 'closed', updated_at = now()
where old_survey.version < 2
  and old_survey.status <> 'closed'
  and exists (
    select 1 from public.feedback_surveys v2
    where v2.guide_id = old_survey.guide_id and v2.version = 2
  );

update public.feedback_surveys
set status = 'published',
    access_mode = 'all_users',
    display_timing = 'after_main_walk_completion',
    allow_anonymous = true,
    allow_multiple_submissions = false,
    ask_for_email = false,
    require_email = false,
    collect_technical_context = false,
    starts_at = coalesce(starts_at, now()),
    ends_at = null,
    updated_at = now()
where version = 2;

commit;

