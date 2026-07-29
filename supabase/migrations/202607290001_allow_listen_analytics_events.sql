-- Keep anonymous analytics constrained to known, non-sensitive event names.
-- This only updates the INSERT policy; it grants no SELECT access and changes no data.
drop policy if exists "Public can insert analytics events" on public.analytics_events;

create policy "Public can insert analytics events"
  on public.analytics_events for insert
  with check (
    event_name in (
      'landing_page_view',
      'start_walk_clicked',
      'stop_opened',
      'stop_audio_started',
      'stop_completed',
      'walk_completed',
      'email_signup_submitted',
      'feedback_submitted',
      'feedback_started',
      'feedback_step_completed',
      'feedback_submission_failed',
      'beta_invitation_opened',
      'would_pay_answered',
      'destination_arrived',
      'donation_prompt_shown',
      'donation_amount_selected',
      'support_screen_shown',
      'donation_unlock',
      'paywall_shown',
      'unlock_confirmed',
      'listen_page_view',
      'listen_start_clicked',
      'listen_continue_clicked',
      'listen_milestone',
      'transcript_opened',
      'bonus_stories_expanded',
      'directions_clicked',
      'all_main_stories_completed',
      'bonus_story_started',
      'donation_clicked',
      'language_selected',
      'listen_shared',
      'listen_feedback_clicked'
    )
    and length(page_path) between 1 and 256
    and (metadata is null or pg_column_size(metadata) <= 4096)
  );
