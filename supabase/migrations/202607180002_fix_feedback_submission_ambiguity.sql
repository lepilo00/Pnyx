-- Fix PL/pgSQL variable/table alias collision in submit_feedback.
create or replace function public.submit_feedback(p_survey_id uuid,p_invitation_token text,p_anonymous_session_id uuid,p_email text,p_answers jsonb,p_context jsonb default '{}',p_progress jsonb default '{}') returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare s feedback_surveys; inv feedback_invitations; sub_id uuid; question_row feedback_questions; val jsonb;
begin
 select * into s from feedback_surveys where id=p_survey_id for update;
 if not found or s.status<>'published' or s.access_mode='disabled' or (s.starts_at is not null and s.starts_at>now()) or (s.ends_at is not null and s.ends_at<now()) then raise exception 'Survey unavailable'; end if;
 if s.access_mode='invited_testers' then select * into inv from feedback_invitations where survey_id=s.id and token_hash=feedback_token_hash(p_invitation_token) and active and (expires_at is null or expires_at>now()) and use_count<max_uses for update; if not found then raise exception 'Invalid or expired invitation'; end if; end if;
 if s.access_mode='authenticated_users' and auth.uid() is null then raise exception 'Sign in required'; end if;
 if s.access_mode='all_users' and auth.uid() is null and not s.allow_anonymous then raise exception 'Sign in required'; end if;
 if s.require_email and (p_email is null or p_email!~*'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'A valid email is required'; end if;
 if not s.ask_for_email then p_email:=null; end if;
 if not s.allow_multiple_submissions and exists(select 1 from feedback_submissions existing_submission where existing_submission.survey_id=s.id and ((auth.uid() is not null and existing_submission.user_id=auth.uid()) or (auth.uid() is null and existing_submission.anonymous_session_id=p_anonymous_session_id))) then raise exception 'Feedback already submitted'; end if;
 if auth.uid() is null and exists(select 1 from feedback_submissions recent_submission where recent_submission.anonymous_session_id=p_anonymous_session_id and recent_submission.submitted_at>now()-interval '30 seconds') then raise exception 'Please wait before submitting again'; end if;
 for question_row in select * from feedback_questions where survey_id=s.id and enabled loop
   val:=p_answers->question_row.question_key;
   if question_row.required and (val is null or val='null'::jsonb or val='""'::jsonb) then raise exception 'Required answer missing: %',question_row.question_key; end if;
   if val is not null and pg_column_size(val)>10000 then raise exception 'Answer too large'; end if;
 end loop;
 insert into feedback_submissions(survey_id,guide_id,survey_version,user_id,anonymous_session_id,tester_invitation_id,email,progress,technical_context,locale,source)
 values(s.id,s.guide_id,s.version,auth.uid(),case when auth.uid() is null then p_anonymous_session_id end,inv.id,left(trim(p_email),254),coalesce(p_progress,'{}'),case when s.collect_technical_context then coalesce(p_context,'{}') else '{}' end,p_context->>'locale',case when inv.id is null then case when auth.uid() is null then 'anonymous' else 'authenticated' end else 'invited_tester' end) returning id into sub_id;
 insert into feedback_answers(submission_id,question_id,question_key,value)
 select sub_id,fq.id,fq.question_key,p_answers->fq.question_key from feedback_questions fq where fq.survey_id=s.id and fq.enabled and p_answers?fq.question_key;
 if inv.id is not null then update feedback_invitations set use_count=use_count+1,last_used_at=now() where id=inv.id; end if;
 return sub_id;
end $$;
revoke all on function public.submit_feedback(uuid,text,uuid,text,jsonb,jsonb,jsonb) from public;
grant execute on function public.submit_feedback(uuid,text,uuid,text,jsonb,jsonb,jsonb) to anon,authenticated;
