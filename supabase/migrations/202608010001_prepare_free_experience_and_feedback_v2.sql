-- Phase 1: make the catalogue free, prepare the anonymous V2 survey as a draft,
-- enforce its data-minimisation rules, and install the retention job.
-- Publish V2 only after the matching application/legal copy is live by running
-- supabase/post_deploy/202608010001_publish_feedback_v2.sql.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'stops' and column_name = 'is_paid'
  ) then
    execute 'update public.stops set is_paid = false where is_paid is distinct from false';
  end if;
end
$$;

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at);
create index if not exists feedback_submissions_submitted_at_idx
  on public.feedback_submissions (submitted_at);

create or replace function public.purge_pnyx_expired_data()
returns table (analytics_deleted bigint, submissions_deleted bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.analytics_events
  where created_at < now() - interval '12 months';
  get diagnostics analytics_deleted = row_count;

  -- feedback_answers are removed by their ON DELETE CASCADE foreign key.
  delete from public.feedback_submissions
  where submitted_at < now() - interval '12 months';
  get diagnostics submissions_deleted = row_count;

  return next;
end
$$;

revoke all on function public.purge_pnyx_expired_data() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      execute 'create extension pg_cron';
    exception when others then
      raise warning 'pg_cron is unavailable; schedule public.purge_pnyx_expired_data() manually: %', sqlerrm;
    end;
  end if;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute $schedule$
      select cron.unschedule(jobid)
      from cron.job
      where jobname = 'pnyx-weekly-retention'
    $schedule$;
    execute $schedule$
      select cron.schedule(
        'pnyx-weekly-retention',
        '30 3 * * 6',
        'select public.purge_pnyx_expired_data();'
      )
    $schedule$;
  end if;
end
$$;

-- Only active, non-paywall events may be written by the public application.
drop policy if exists "Public can insert analytics events" on public.analytics_events;
create policy "Public can insert analytics events"
  on public.analytics_events for insert
  with check (
    event_name in (
      'landing_page_view', 'start_walk_clicked',
      'stop_opened', 'stop_audio_started', 'stop_completed', 'walk_completed',
      'email_signup_submitted', 'feedback_submitted', 'feedback_started',
      'feedback_step_completed', 'feedback_submission_failed', 'beta_invitation_opened',
      'destination_arrived', 'donation_prompt_shown', 'donation_amount_selected',
      'support_screen_shown', 'listen_page_view', 'listen_start_clicked',
      'listen_continue_clicked', 'listen_milestone', 'transcript_opened',
      'bonus_stories_expanded', 'directions_clicked', 'all_main_stories_completed',
      'bonus_story_started', 'donation_clicked', 'language_selected',
      'listen_shared', 'listen_feedback_clicked', 'bonus_transition_viewed',
      'bonus_transition_explore_clicked', 'bonus_transition_support_clicked',
      'bonus_transition_share_clicked', 'bonus_transition_dismissed',
      'bonus_transition_reopened', 'bonus_section_expanded',
      'donation_panel_opened', 'donation_self_reported',
      'share_native_invoked', 'share_link_copied'
    )
    and length(page_path) between 1 and 256
    and (metadata is null or pg_column_size(metadata) <= 4096)
  );

-- Validate only questions whose conditional rule currently applies and persist
-- only those visible answers. V2 deliberately receives null/empty values for
-- email, session, progress and technical context.
create or replace function public.submit_feedback(
  p_survey_id uuid,
  p_invitation_token text,
  p_anonymous_session_id uuid,
  p_email text,
  p_answers jsonb,
  p_context jsonb default '{}',
  p_progress jsonb default '{}'
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s feedback_surveys;
  inv feedback_invitations;
  sub_id uuid;
  question_row feedback_questions;
  val jsonb;
  condition_value jsonb;
  condition_applies boolean;
  clean_answers jsonb := '{}'::jsonb;
begin
  select * into s from feedback_surveys where id = p_survey_id for update;
  if not found or s.status <> 'published' or s.access_mode = 'disabled'
     or (s.starts_at is not null and s.starts_at > now())
     or (s.ends_at is not null and s.ends_at < now()) then
    raise exception 'Survey unavailable';
  end if;

  if s.access_mode = 'invited_testers' then
    select * into inv from feedback_invitations
    where survey_id = s.id and token_hash = feedback_token_hash(p_invitation_token)
      and active and (expires_at is null or expires_at > now()) and use_count < max_uses
    for update;
    if not found then raise exception 'Invalid or expired invitation'; end if;
  end if;
  if s.access_mode = 'authenticated_users' and auth.uid() is null then raise exception 'Sign in required'; end if;
  if s.access_mode = 'all_users' and auth.uid() is null and not s.allow_anonymous then raise exception 'Sign in required'; end if;
  if s.require_email and (p_email is null or p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'A valid email is required';
  end if;
  if not s.ask_for_email then p_email := null; end if;

  if not s.allow_multiple_submissions and exists (
    select 1 from feedback_submissions existing_submission
    where existing_submission.survey_id = s.id
      and ((auth.uid() is not null and existing_submission.user_id = auth.uid())
        or (auth.uid() is null and p_anonymous_session_id is not null
          and existing_submission.anonymous_session_id = p_anonymous_session_id))
  ) then raise exception 'Feedback already submitted'; end if;

  if auth.uid() is null and p_anonymous_session_id is not null and exists (
    select 1 from feedback_submissions recent_submission
    where recent_submission.anonymous_session_id = p_anonymous_session_id
      and recent_submission.submitted_at > now() - interval '30 seconds'
  ) then raise exception 'Please wait before submitting again'; end if;

  for question_row in
    select * from feedback_questions where survey_id = s.id and enabled order by display_order
  loop
    condition_applies := true;
    if question_row.conditional_logic is not null then
      condition_value := p_answers -> (question_row.conditional_logic ->> 'question_key');
      case question_row.conditional_logic ->> 'operator'
        when 'equals' then
          condition_applies := condition_value = question_row.conditional_logic -> 'value';
        when 'in' then
          condition_applies := exists (
            select 1 from jsonb_array_elements(question_row.conditional_logic -> 'value') candidate
            where candidate = condition_value
          );
        when 'not_empty' then
          condition_applies := condition_value is not null
            and condition_value <> 'null'::jsonb and condition_value <> '""'::jsonb;
        else condition_applies := false;
      end case;
    end if;

    if condition_applies then
      val := p_answers -> question_row.question_key;
      if question_row.required and (val is null or val = 'null'::jsonb or val = '""'::jsonb) then
        raise exception 'Required answer missing: %', question_row.question_key;
      end if;
      if val is not null and pg_column_size(val) > 10000 then raise exception 'Answer too large'; end if;
      if p_answers ? question_row.question_key then
        clean_answers := clean_answers || jsonb_build_object(question_row.question_key, val);
      end if;
    end if;
  end loop;

  insert into feedback_submissions (
    survey_id, guide_id, survey_version, user_id, anonymous_session_id,
    tester_invitation_id, email, progress, technical_context, locale, source
  ) values (
    s.id, s.guide_id, s.version, auth.uid(),
    case when auth.uid() is null and s.version < 2 then p_anonymous_session_id end,
    inv.id, left(trim(p_email), 254),
    case when s.collect_technical_context then coalesce(p_progress, '{}') else '{}'::jsonb end,
    case when s.collect_technical_context then coalesce(p_context, '{}') else '{}'::jsonb end,
    case when s.collect_technical_context then p_context ->> 'locale' end,
    case when inv.id is not null then 'invited_tester'
      when auth.uid() is null then 'anonymous' else 'authenticated' end
  ) returning id into sub_id;

  insert into feedback_answers (submission_id, question_id, question_key, value)
  select sub_id, fq.id, fq.question_key, clean_answers -> fq.question_key
  from feedback_questions fq
  where fq.survey_id = s.id and fq.enabled and clean_answers ? fq.question_key;

  if inv.id is not null then
    update feedback_invitations set use_count = use_count + 1, last_used_at = now() where id = inv.id;
  end if;
  return sub_id;
end
$$;

revoke all on function public.submit_feedback(uuid,text,uuid,text,jsonb,jsonb,jsonb) from public;
grant execute on function public.submit_feedback(uuid,text,uuid,text,jsonb,jsonb,jsonb) to anon, authenticated;

create temporary table pnyx_v2_questions (
  question_key text primary key,
  question_type text not null,
  label jsonb not null,
  options jsonb not null default '[]'::jsonb,
  required boolean not null default true,
  display_order integer not null,
  conditional_logic jsonb
) on commit drop;

insert into pnyx_v2_questions (question_key, question_type, label, options, display_order, conditional_logic) values
('pnyx_familiarity', 'single_choice',
 '{"en":"Before today’s test, how well did you know the Pnyx?","sl":"Kako dobro ste pred današnjim testom poznali Pnyx?","de":"Wie gut kannten Sie die Pnyx vor dem heutigen Test?","el":"Πόσο καλά γνωρίζατε την Πνύκα πριν από τη σημερινή δοκιμή;","es":"¿Cuánto conocías la Pnyx antes de la prueba de hoy?","fr":"Dans quelle mesure connaissiez-vous la Pnyx avant le test d’aujourd’hui ?","hr":"Koliko ste dobro poznavali Pniks prije današnjeg testiranja?","it":"Quanto conoscevi la Pnice prima del test di oggi?","sr":"Koliko ste dobro poznavali Pniks pre današnjeg testiranja?","zh":"在今天测试之前，您对普尼克斯了解多少？"}',
 '[{"value":"never_heard","label":{"en":"I had never heard of it.","sl":"Zanj še nisem slišal/-a.","de":"Ich hatte noch nie davon gehört.","el":"Δεν την είχα ξανακούσει.","es":"Nunca había oído hablar de ella.","fr":"Je n’en avais jamais entendu parler.","hr":"Nikad prije nisam čuo/-la za njega.","it":"Non ne avevo mai sentito parlare.","sr":"Nikada ranije nisam čuo/-la za njega.","zh":"我从未听说过。"}},{"value":"name_only","label":{"en":"I knew the name, but not its significance.","sl":"Poznal/-a sem ime, ne pa pomena.","de":"Ich kannte den Namen, aber nicht seine Bedeutung.","el":"Γνώριζα το όνομα, αλλά όχι τη σημασία της.","es":"Conocía el nombre, pero no su importancia.","fr":"Je connaissais le nom, mais pas son importance.","hr":"Znao/-la sam ime, ali ne i njegov značaj.","it":"Conoscevo il nome, ma non la sua importanza.","sr":"Znao/-la sam ime, ali ne i njegov značaj.","zh":"我知道这个名字，但不了解其意义。"}},{"value":"knew_significance","label":{"en":"I knew what the Pnyx was.","sl":"Vedel/-a sem, kaj je Pnyx.","de":"Ich wusste, was die Pnyx war.","el":"Γνώριζα τι ήταν η Πνύκα.","es":"Sabía qué era la Pnyx.","fr":"Je savais ce qu’était la Pnyx.","hr":"Znao/-la sam što je Pniks.","it":"Sapevo cos’era la Pnice.","sr":"Znao/-la sam šta je Pniks.","zh":"我知道普尼克斯是什么。"}},{"value":"visited","label":{"en":"I had already visited the Pnyx.","sl":"Pnyx sem že obiskal/-a.","de":"Ich hatte die Pnyx bereits besucht.","el":"Είχα ήδη επισκεφθεί την Πνύκα.","es":"Ya había visitado la Pnyx.","fr":"J’avais déjà visité la Pnyx.","hr":"Već sam posjetio/-la Pniks.","it":"Avevo già visitato la Pnice.","sr":"Već sam posetio/-la Pniks.","zh":"我以前参观过普尼克斯。"}}]', 1, null),
('offering_summary', 'text',
 '{"en":"In one sentence, what do you think PNYX offers?","sl":"V enem stavku napišite, kaj po vašem mnenju ponuja PNYX.","de":"Beschreiben Sie in einem Satz, was PNYX Ihrer Meinung nach bietet.","el":"Σε μία πρόταση, τι πιστεύετε ότι προσφέρει το PNYX;","es":"En una frase, ¿qué crees que ofrece PNYX?","fr":"En une phrase, qu’offre PNYX selon vous ?","hr":"U jednoj rečenici napišite što po vašem mišljenju nudi PNYX.","it":"In una frase, cosa pensi che offra PNYX?","sr":"U jednoj rečenici napišite šta po vašem mišljenju nudi PNYX.","zh":"请用一句话说明您认为 PNYX 提供什么。"}', '[]', 2, null),
('start_ease', 'rating',
 '{"en":"How easy was it to find and start the audio experience?","sl":"Kako preprosto je bilo najti in začeti avdio izkušnjo?","de":"Wie einfach war es, das Audio-Erlebnis zu finden und zu starten?","el":"Πόσο εύκολο ήταν να βρείτε και να ξεκινήσετε την ηχητική εμπειρία;","es":"¿Qué tan fácil fue encontrar e iniciar la experiencia de audio?","fr":"A-t-il été facile de trouver et de lancer l’expérience audio ?","hr":"Koliko je bilo jednostavno pronaći i pokrenuti audio iskustvo?","it":"Quanto è stato facile trovare e avviare l’esperienza audio?","sr":"Koliko je bilo jednostavno pronaći i pokrenuti audio iskustvo?","zh":"找到并开始音频体验有多容易？"}',
 '[{"value":"1","label":{"en":"Very difficult","sl":"Zelo težko","de":"Sehr schwierig","el":"Πολύ δύσκολο","es":"Muy difícil","fr":"Très difficile","hr":"Vrlo teško","it":"Molto difficile","sr":"Veoma teško","zh":"非常困难"}},{"value":"5","label":{"en":"Very easy","sl":"Zelo preprosto","de":"Sehr einfach","el":"Πολύ εύκολο","es":"Muy fácil","fr":"Très facile","hr":"Vrlo jednostavno","it":"Molto facile","sr":"Veoma jednostavno","zh":"非常容易"}}]', 3, null),
('start_ease_blocker', 'textarea',
 '{"en":"What got in your way?","sl":"Kaj vas je oviralo?","de":"Was hat Sie dabei behindert?","el":"Τι σας δυσκόλεψε;","es":"¿Qué te lo dificultó?","fr":"Qu’est-ce qui vous a gêné ?","hr":"Što vam je predstavljalo prepreku?","it":"Cosa ti ha ostacolato?","sr":"Šta vam je predstavljalo prepreku?","zh":"是什么阻碍了您？"}', '[]', 4,
 '{"question_key":"start_ease","operator":"in","value":[1,2,3]}'),
('pnyx_liveliness', 'rating',
 '{"en":"After listening, how much more meaningful and alive did the Pnyx feel?","sl":"Po poslušanju: koliko bolj smiseln in živ se vam je zdel Pnyx?","de":"Wie viel bedeutungsvoller und lebendiger wirkte die Pnyx nach dem Hören?","el":"Μετά την ακρόαση, πόσο πιο ουσιαστική και ζωντανή σας φάνηκε η Πνύκα;","es":"Después de escuchar, ¿cuánto más significativa y viva te pareció la Pnyx?","fr":"Après l’écoute, la Pnyx vous a-t-elle semblé plus vivante et porteuse de sens ?","hr":"Nakon slušanja, koliko vam je Pniks djelovao smislenije i življe?","it":"Dopo l’ascolto, quanto ti è sembrata più significativa e viva la Pnice?","sr":"Nakon slušanja, koliko vam je Pniks delovao smislenije i življe?","zh":"收听后，普尼克斯让您感觉更有意义、更鲜活了吗？"}',
 '[{"value":"1","label":{"en":"Not at all","sl":"Sploh ne","de":"Überhaupt nicht","el":"Καθόλου","es":"En absoluto","fr":"Pas du tout","hr":"Nimalo","it":"Per niente","sr":"Nimalo","zh":"完全没有"}},{"value":"5","label":{"en":"Very much","sl":"Zelo","de":"Sehr","el":"Πάρα πολύ","es":"Mucho","fr":"Beaucoup","hr":"Vrlo","it":"Molto","sr":"Veoma","zh":"非常"}}]', 5, null),
('bonus_likelihood', 'rating',
 '{"en":"How likely would you be to continue with the seven shorter stories?","sl":"Kako verjetno bi nadaljevali s sedmimi krajšimi zgodbami?","de":"Wie wahrscheinlich würden Sie mit den sieben kürzeren Geschichten fortfahren?","el":"Πόσο πιθανό είναι να συνεχίσετε με τις επτά συντομότερες ιστορίες;","es":"¿Qué probabilidad hay de que continúes con las siete historias más breves?","fr":"Quelle serait la probabilité que vous poursuiviez avec les sept histoires plus courtes ?","hr":"Koliko je vjerojatno da biste nastavili sa sedam kraćih priča?","it":"Quanto è probabile che continueresti con le sette storie più brevi?","sr":"Koliko je verovatno da biste nastavili sa sedam kraćih priča?","zh":"您继续收听七个较短故事的可能性有多大？"}',
 '[{"value":"1","label":{"en":"Definitely not","sl":"Zagotovo ne","de":"Auf keinen Fall","el":"Σίγουρα όχι","es":"Definitivamente no","fr":"Certainement pas","hr":"Sigurno ne","it":"Sicuramente no","sr":"Sigurno ne","zh":"肯定不会"}},{"value":"5","label":{"en":"Definitely would","sl":"Zagotovo bi","de":"Auf jeden Fall","el":"Σίγουρα ναι","es":"Definitivamente sí","fr":"Certainement","hr":"Sigurno bih","it":"Sicuramente sì","sr":"Sigurno bih","zh":"肯定会"}}]', 6, null),
('contribution_prompt_reaction', 'single_choice',
 '{"en":"How did the voluntary contribution prompt feel to you?","sl":"Kako je na vas deloval poziv k prostovoljnemu prispevku?","de":"Wie wirkte der Hinweis auf einen freiwilligen Beitrag auf Sie?","el":"Πώς σας φάνηκε η προτροπή για εθελοντική συνεισφορά;","es":"¿Qué te pareció la invitación a hacer una contribución voluntaria?","fr":"Comment avez-vous perçu l’invitation à contribuer volontairement ?","hr":"Kako je na vas djelovao poziv na dobrovoljni doprinos?","it":"Come ti è sembrato l’invito a dare un contributo volontario?","sr":"Kako je na vas delovao poziv na dobrovoljni doprinos?","zh":"您对自愿捐助提示有何感受？"}',
 '[{"value":"clear_appropriate","label":{"en":"Clear and appropriate","sl":"Jasen in primeren","de":"Klar und angemessen","el":"Σαφής και κατάλληλη","es":"Clara y adecuada","fr":"Clair et approprié","hr":"Jasan i primjeren","it":"Chiaro e appropriato","sr":"Jasan i primeren","zh":"清楚且恰当"}},{"value":"appropriate_too_hidden","label":{"en":"Appropriate, but too hidden","sl":"Primeren, vendar preveč skrit","de":"Angemessen, aber zu versteckt","el":"Κατάλληλη, αλλά πολύ κρυμμένη","es":"Adecuada, pero demasiado oculta","fr":"Approprié, mais trop discret","hr":"Primjeren, ali previše skriven","it":"Appropriato, ma troppo nascosto","sr":"Primeren, ali previše skriven","zh":"恰当，但太隐蔽"}},{"value":"too_prominent","label":{"en":"Too prominent or intrusive","sl":"Preveč izrazit ali vsiljiv","de":"Zu auffällig oder aufdringlich","el":"Υπερβολικά έντονη ή ενοχλητική","es":"Demasiado visible o intrusiva","fr":"Trop visible ou intrusif","hr":"Previše istaknut ili nametljiv","it":"Troppo evidente o invadente","sr":"Previše istaknut ili nametljiv","zh":"过于突出或打扰"}},{"value":"unclear_effect","label":{"en":"It was unclear what the contribution enables","sl":"Ni bilo jasno, kaj prispevek omogoča","de":"Es war unklar, was der Beitrag ermöglicht","el":"Δεν ήταν σαφές τι επιτρέπει η συνεισφορά","es":"No quedaba claro qué permite la contribución","fr":"L’utilité de la contribution n’était pas claire","hr":"Nije bilo jasno što doprinos omogućuje","it":"Non era chiaro cosa rendesse possibile il contributo","sr":"Nije bilo jasno šta doprinos omogućava","zh":"不清楚捐助会带来什么"}},{"value":"not_noticed","label":{"en":"I did not notice the prompt","sl":"Poziva nisem opazil/-a","de":"Ich habe den Hinweis nicht bemerkt","el":"Δεν πρόσεξα την προτροπή","es":"No vi la invitación","fr":"Je n’ai pas remarqué l’invitation","hr":"Nisam primijetio/-la poziv","it":"Non ho notato l’invito","sr":"Nisam primetio/-la poziv","zh":"我没有注意到该提示"}}]', 7, null),
('top_improvement', 'textarea',
 '{"en":"What is the single most important thing we should improve before launch?","sl":"Kaj je ena najpomembnejša stvar, ki jo moramo pred objavo izboljšati?","de":"Was ist das Wichtigste, das wir vor der Veröffentlichung verbessern sollten?","el":"Ποιο είναι το σημαντικότερο πράγμα που πρέπει να βελτιώσουμε πριν από τη δημοσίευση;","es":"¿Qué es lo más importante que deberíamos mejorar antes del lanzamiento?","fr":"Quelle est la chose la plus importante à améliorer avant le lancement ?","hr":"Koja je najvažnija stvar koju trebamo poboljšati prije objave?","it":"Qual è la cosa più importante che dovremmo migliorare prima del lancio?","sr":"Koja je najvažnija stvar koju treba da poboljšamo pre objave?","zh":"正式发布前我们最应该改进的一件事是什么？"}', '[]', 8, null);

do $$
declare
  guide_row record;
  v_survey_id uuid;
begin
  for guide_row in select id from public.walks where is_published loop
    select id into v_survey_id
    from public.feedback_surveys
    where guide_id = guide_row.id and version = 2;

    if v_survey_id is null then
      insert into public.feedback_surveys (
        guide_id, name, version, status, access_mode, display_timing,
        title, introduction, estimated_minutes, completion_message,
        allow_anonymous, allow_multiple_submissions, ask_for_email,
        require_email, collect_technical_context, survey_price, price_choices,
        internal_notes
      ) values (
        guide_row.id, 'PNYX test survey V2', 2, 'draft', 'disabled',
        'after_main_walk_completion',
        '{"en":"Short survey for test users","sl":"Kratka anketa za testne uporabnike","de":"Kurze Umfrage für Testnutzer","el":"Σύντομη έρευνα για δοκιμαστικούς χρήστες","es":"Encuesta breve para usuarios de prueba","fr":"Courte enquête pour les utilisateurs test","hr":"Kratka anketa za testne korisnike","it":"Breve sondaggio per gli utenti di prova","sr":"Kratka anketa za testne korisnike","zh":"测试用户简短问卷"}',
        '{"en":"Help us improve PNYX. We are testing the website, not you. Honest criticism is the most useful. The survey is anonymous and takes about 2 minutes.","sl":"Pomagajte nama izboljšati PNYX. Testiramo spletno stran, ne vas. Iskrena kritika je najbolj koristna. Anketa je anonimna in traja približno 2 minuti.","de":"Helfen Sie uns, PNYX zu verbessern. Wir testen die Website, nicht Sie. Ehrliche Kritik ist am hilfreichsten. Die Umfrage ist anonym und dauert etwa 2 Minuten.","el":"Βοηθήστε μας να βελτιώσουμε το PNYX. Δοκιμάζουμε τον ιστότοπο, όχι εσάς. Η ειλικρινής κριτική είναι η πιο χρήσιμη. Η έρευνα είναι ανώνυμη και διαρκεί περίπου 2 λεπτά.","es":"Ayúdanos a mejorar PNYX. Estamos probando el sitio web, no a ti. La crítica sincera es la más útil. La encuesta es anónima y dura unos 2 minutos.","fr":"Aidez-nous à améliorer PNYX. Nous testons le site, pas vous. Une critique sincère est la plus utile. L’enquête est anonyme et dure environ 2 minutes.","hr":"Pomozite nam poboljšati PNYX. Testiramo web-stranicu, ne vas. Iskrena kritika je najkorisnija. Anketa je anonimna i traje oko 2 minute.","it":"Aiutaci a migliorare PNYX. Stiamo testando il sito, non te. Una critica sincera è molto utile. Il sondaggio è anonimo e richiede circa 2 minuti.","sr":"Pomozite nam da poboljšamo PNYX. Testiramo veb-sajt, ne vas. Iskrena kritika je najkorisnija. Anketa je anonimna i traje oko 2 minuta.","zh":"帮助我们改进 PNYX。我们测试的是网站，而不是您。坦诚的意见最有帮助。问卷匿名填写，大约需要 2 分钟。"}',
        2,
        '{"en":"Thank you. Your answers will help us improve PNYX before launch.","sl":"Hvala. Vaši odgovori nama bodo pomagali izboljšati PNYX pred objavo.","de":"Vielen Dank. Ihre Antworten helfen uns, PNYX vor der Veröffentlichung zu verbessern.","el":"Ευχαριστούμε. Οι απαντήσεις σας θα μας βοηθήσουν να βελτιώσουμε το PNYX πριν από τη δημοσίευση.","es":"Gracias. Tus respuestas nos ayudarán a mejorar PNYX antes del lanzamiento.","fr":"Merci. Vos réponses nous aideront à améliorer PNYX avant son lancement.","hr":"Hvala. Vaši odgovori pomoći će nam poboljšati PNYX prije objave.","it":"Grazie. Le tue risposte ci aiuteranno a migliorare PNYX prima del lancio.","sr":"Hvala. Vaši odgovori će nam pomoći da poboljšamo PNYX pre objave.","zh":"谢谢。您的回答将帮助我们在发布前改进 PNYX。"}',
        true, false, false, false, false, null, '[]'::jsonb,
        'Prepared by migration 202608010001. Publish with the post-deploy script after the application and legal copy are live.'
      ) returning id into v_survey_id;
    else
      update public.feedback_surveys set
        status = 'draft', access_mode = 'disabled',
        display_timing = 'after_main_walk_completion', estimated_minutes = 2,
        allow_anonymous = true, allow_multiple_submissions = false,
        ask_for_email = false, require_email = false,
        collect_technical_context = false, survey_price = null, price_choices = '[]'::jsonb,
        updated_at = now()
      where id = v_survey_id;
    end if;

    -- Preserve any existing V2 answers while retiring questions that are not
    -- part of the fixed template.
    update public.feedback_questions existing_question
    set enabled = false, updated_at = now()
    where existing_question.survey_id = v_survey_id
      and not exists (
        select 1 from pnyx_v2_questions template
        where template.question_key = existing_question.question_key
      );

    insert into public.feedback_questions (
      survey_id, section, question_key, question_type, label, required,
      display_order, options, conditional_logic, enabled
    )
    select v_survey_id, 'Test survey', q.question_key, q.question_type, q.label,
      q.required, q.display_order, q.options, q.conditional_logic, true
    from pnyx_v2_questions q
    on conflict (survey_id, question_key) do update set
      section = excluded.section,
      question_type = excluded.question_type,
      label = excluded.label,
      required = excluded.required,
      display_order = excluded.display_order,
      options = excluded.options,
      conditional_logic = excluded.conditional_logic,
      enabled = true,
      updated_at = now();
  end loop;
end
$$;
