-- Guide-agnostic feedback system. All writes pass through submit_feedback(); tables are never public-writeable.
create table if not exists public.feedback_surveys (
 id uuid primary key default uuid_generate_v4(), guide_id uuid not null references public.walks(id) on delete cascade,
 name text not null default 'Product feedback', version integer not null default 1 check(version>0), status text not null default 'draft' check(status in('draft','published','closed')),
 access_mode text not null default 'disabled' check(access_mode in('disabled','invited_testers','authenticated_users','all_users')),
 display_timing text not null default 'after_main_walk_completion' check(display_timing in('after_main_walk_completion','after_all_content_completion','always_available','manually_triggered')),
 title jsonb not null default '{"en":"Help us improve this guide"}', introduction jsonb not null default '{"en":"Your feedback will directly shape future versions."}', estimated_minutes integer not null default 3,
 completion_message jsonb not null default '{"en":"Your feedback will shape the future of this guide."}', allow_anonymous boolean not null default false,
 allow_multiple_submissions boolean not null default false, ask_for_email boolean not null default false, require_email boolean not null default false,
 collect_technical_context boolean not null default true, starts_at timestamptz, ends_at timestamptz, survey_price numeric(10,2),
 price_choices jsonb not null default '["€2.99","€4.99","€6.99","€9.99","I would not pay"]', internal_notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(guide_id,version), check(not require_email or ask_for_email)
);
create table if not exists public.feedback_questions (
 id uuid primary key default uuid_generate_v4(), survey_id uuid not null references public.feedback_surveys(id) on delete cascade,
 section text not null, question_key text not null, question_type text not null check(question_type in('rating','nps','single_choice','text','textarea','story_selector','device','email')),
 label jsonb not null, description jsonb, required boolean not null default false, display_order integer not null, options jsonb not null default '[]', conditional_logic jsonb,
 enabled boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(survey_id,question_key)
);
create table if not exists public.feedback_invitations (
 id uuid primary key default uuid_generate_v4(), survey_id uuid not null references public.feedback_surveys(id) on delete cascade,
 token_hash text not null unique, token_hint text not null, email text, name text, active boolean not null default true, expires_at timestamptz,
 max_uses integer not null default 1 check(max_uses>0), use_count integer not null default 0, last_used_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.feedback_submissions (
 id uuid primary key default uuid_generate_v4(), survey_id uuid not null references public.feedback_surveys(id), guide_id uuid not null references public.walks(id),
 survey_version integer not null, user_id uuid references auth.users(id) on delete set null, anonymous_session_id uuid, tester_invitation_id uuid references public.feedback_invitations(id) on delete set null,
 email text, progress jsonb not null default '{}', technical_context jsonb not null default '{}', locale text, source text not null default 'public', started_at timestamptz not null default now(), submitted_at timestamptz not null default now(),
 reviewed boolean not null default false, internal_note text, category text check(category is null or category in('UX','Audio','Content','Bug','Performance','Pricing','Translation','Accessibility','Other')),
 priority text check(priority is null or priority in('Low','Medium','High','Critical')), resolved boolean not null default false, hidden boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.feedback_answers (
 id uuid primary key default uuid_generate_v4(), submission_id uuid not null references public.feedback_submissions(id) on delete cascade,
 question_id uuid not null references public.feedback_questions(id), question_key text not null, value jsonb not null, created_at timestamptz not null default now(), unique(submission_id,question_id)
);
create index if not exists feedback_submissions_survey_date on public.feedback_submissions(survey_id,submitted_at desc);
create index if not exists feedback_answers_key on public.feedback_answers(question_key);
alter table public.feedback_surveys enable row level security; alter table public.feedback_questions enable row level security;
alter table public.feedback_invitations enable row level security; alter table public.feedback_submissions enable row level security; alter table public.feedback_answers enable row level security;
create policy "Admin manages surveys" on public.feedback_surveys for all using(public.is_admin()) with check(public.is_admin());
create policy "Admin manages questions" on public.feedback_questions for all using(public.is_admin()) with check(public.is_admin());
create policy "Admin manages invitations" on public.feedback_invitations for all using(public.is_admin()) with check(public.is_admin());
create policy "Admin manages submissions" on public.feedback_submissions for all using(public.is_admin()) with check(public.is_admin());
create policy "Admin manages answers" on public.feedback_answers for all using(public.is_admin()) with check(public.is_admin());

create or replace function public.feedback_token_hash(p_token text) returns text language sql immutable strict set search_path='' as $$ select encode(sha256(convert_to(p_token,'utf8')),'hex') $$;
create or replace function public.get_feedback_survey(p_guide_id uuid,p_invitation_token text default null) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s feedback_surveys; inv feedback_invitations; result jsonb;
begin
 select * into s from feedback_surveys where guide_id=p_guide_id and status='published' and access_mode<>'disabled' and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now()) order by version desc limit 1;
 if not found then return null; end if;
 if s.access_mode='invited_testers' then select * into inv from feedback_invitations where survey_id=s.id and token_hash=feedback_token_hash(p_invitation_token) and active and (expires_at is null or expires_at>now()) and use_count<max_uses; if not found then return null; end if; end if;
 if s.access_mode='authenticated_users' and auth.uid() is null then return null; end if;
 if s.access_mode='all_users' and auth.uid() is null and not s.allow_anonymous then return null; end if;
 select (to_jsonb(s)-'internal_notes')||jsonb_build_object('questions',coalesce((select jsonb_agg(to_jsonb(q) order by q.display_order) from feedback_questions q where q.survey_id=s.id),'[]'::jsonb)) into result;
 return result;
end $$;

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
 if not s.allow_multiple_submissions and exists(select 1 from feedback_submissions x where x.survey_id=s.id and ((auth.uid() is not null and x.user_id=auth.uid()) or (auth.uid() is null and x.anonymous_session_id=p_anonymous_session_id))) then raise exception 'Feedback already submitted'; end if;
 if auth.uid() is null and exists(select 1 from feedback_submissions x where x.anonymous_session_id=p_anonymous_session_id and x.submitted_at>now()-interval '30 seconds') then raise exception 'Please wait before submitting again'; end if;
 for question_row in select * from feedback_questions where survey_id=s.id and enabled loop val:=p_answers->question_row.question_key; if question_row.required and (val is null or val='null'::jsonb or val='""'::jsonb) then raise exception 'Required answer missing: %',question_row.question_key; end if; if val is not null and pg_column_size(val)>10000 then raise exception 'Answer too large'; end if; end loop;
 insert into feedback_submissions(survey_id,guide_id,survey_version,user_id,anonymous_session_id,tester_invitation_id,email,progress,technical_context,locale,source)
 values(s.id,s.guide_id,s.version,auth.uid(),case when auth.uid() is null then p_anonymous_session_id end,inv.id,left(trim(p_email),254),coalesce(p_progress,'{}'),case when s.collect_technical_context then coalesce(p_context,'{}') else '{}' end,p_context->>'locale',case when inv.id is null then case when auth.uid() is null then 'anonymous' else 'authenticated' end else 'invited_tester' end) returning id into sub_id;
 insert into feedback_answers(submission_id,question_id,question_key,value) select sub_id,fq.id,fq.question_key,p_answers->fq.question_key from feedback_questions fq where fq.survey_id=s.id and fq.enabled and p_answers?fq.question_key;
 if inv.id is not null then update feedback_invitations set use_count=use_count+1,last_used_at=now() where id=inv.id; end if; return sub_id;
end $$;
revoke all on function public.submit_feedback(uuid,text,uuid,text,jsonb,jsonb,jsonb) from public; grant execute on function public.submit_feedback(uuid,text,uuid,text,jsonb,jsonb,jsonb) to anon,authenticated;
grant execute on function public.get_feedback_survey(uuid,text) to anon,authenticated;
create or replace function public.resolve_feedback_invitation(p_token text) returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('guide_id',s.guide_id,'survey_id',s.id) from feedback_invitations i join feedback_surveys s on s.id=i.survey_id
 where i.token_hash=feedback_token_hash(p_token) and i.active and i.use_count<i.max_uses and (i.expires_at is null or i.expires_at>now()) and s.status='published' and s.access_mode='invited_testers' limit 1
$$;
grant execute on function public.resolve_feedback_invitation(text) to anon,authenticated;

-- Legacy table must no longer accept direct anonymous writes.
drop policy if exists "Public can insert feedback" on public.feedback;
alter table public.feedback_surveys add constraint feedback_title_object check(jsonb_typeof(title)='object');
