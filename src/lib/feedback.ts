import { supabase } from './supabaseClient'

export type FeedbackMode = 'disabled' | 'invited_testers' | 'authenticated_users' | 'all_users'
export type FeedbackTiming = 'after_main_walk_completion' | 'after_all_content_completion' | 'always_available' | 'manually_triggered'
export type QuestionType = 'rating' | 'nps' | 'single_choice' | 'text' | 'textarea' | 'story_selector' | 'device' | 'email'
export type LocalizedText = Record<string, string>

export interface SurveyQuestion {
  id: string
  question_key: string
  section: string
  question_type: QuestionType
  label: LocalizedText
  description?: LocalizedText
  required: boolean
  display_order: number
  options: Array<{ value: string; label: LocalizedText }>
  conditional_logic?: { question_key: string; operator: 'equals' | 'in' | 'not_empty'; value?: unknown }
  enabled: boolean
}

export interface FeedbackSurvey {
  id: string
  guide_id: string
  version: number
  status: 'draft' | 'published' | 'closed'
  access_mode: FeedbackMode
  display_timing: FeedbackTiming
  title: LocalizedText
  introduction: LocalizedText
  completion_message: LocalizedText
  estimated_minutes: number
  allow_anonymous: boolean
  allow_multiple_submissions: boolean
  ask_for_email: boolean
  require_email: boolean
  collect_technical_context: boolean
  starts_at?: string | null
  ends_at?: string | null
  internal_notes?: string | null
  questions?: SurveyQuestion[]
}

const tx = (en: string, sl: string, de: string, el: string, es: string, fr: string, hr: string, it: string, sr: string, zh: string): LocalizedText => ({ en, sl, de, el, es, fr, hr, it, sr, zh })
const option = (value: string, label: LocalizedText) => ({ value, label })

export const TEST_SURVEY_META = {
  title: tx(
    'Short survey for test users', 'Kratka anketa za testne uporabnike', 'Kurze Umfrage für Testnutzer',
    'Σύντομη έρευνα για δοκιμαστικούς χρήστες', 'Encuesta breve para usuarios de prueba',
    'Courte enquête pour les utilisateurs test', 'Kratka anketa za testne korisnike',
    'Breve sondaggio per gli utenti di prova', 'Kratka anketa za testne korisnike', '测试用户简短问卷'
  ),
  introduction: tx(
    'Help us improve PNYX. We are testing the website, not you. Honest criticism is the most useful. The survey is anonymous and takes about 2 minutes.',
    'Pomagajte nama izboljšati PNYX. Testiramo spletno stran, ne vas. Iskrena kritika je najbolj koristna. Anketa je anonimna in traja približno 2 minuti.',
    'Helfen Sie uns, PNYX zu verbessern. Wir testen die Website, nicht Sie. Ehrliche Kritik ist am hilfreichsten. Die Umfrage ist anonym und dauert etwa 2 Minuten.',
    'Βοηθήστε μας να βελτιώσουμε το PNYX. Δοκιμάζουμε τον ιστότοπο, όχι εσάς. Η ειλικρινής κριτική είναι η πιο χρήσιμη. Η έρευνα είναι ανώνυμη και διαρκεί περίπου 2 λεπτά.',
    'Ayúdanos a mejorar PNYX. Estamos probando el sitio web, no a ti. La crítica sincera es la más útil. La encuesta es anónima y dura unos 2 minutos.',
    'Aidez-nous à améliorer PNYX. Nous testons le site, pas vous. Une critique sincère est la plus utile. L’enquête est anonyme et dure environ 2 minutes.',
    'Pomozite nam poboljšati PNYX. Testiramo web-stranicu, ne vas. Iskrena kritika je najkorisnija. Anketa je anonimna i traje oko 2 minute.',
    'Aiutaci a migliorare PNYX. Stiamo testando il sito, non te. Una critica sincera è molto utile. Il sondaggio è anonimo e richiede circa 2 minuti.',
    'Pomozite nam da poboljšamo PNYX. Testiramo veb-sajt, ne vas. Iskrena kritika je najkorisnija. Anketa je anonimna i traje oko 2 minuta.',
    '帮助我们改进 PNYX。我们测试的是网站，而不是您。坦诚的意见最有帮助。问卷匿名填写，大约需要 2 分钟。'
  ),
  completion_message: tx(
    'Thank you. Your answers will help us improve PNYX before launch.',
    'Hvala. Vaši odgovori nama bodo pomagali izboljšati PNYX pred objavo.',
    'Vielen Dank. Ihre Antworten helfen uns, PNYX vor der Veröffentlichung zu verbessern.',
    'Ευχαριστούμε. Οι απαντήσεις σας θα μας βοηθήσουν να βελτιώσουμε το PNYX πριν από τη δημοσίευση.',
    'Gracias. Tus respuestas nos ayudarán a mejorar PNYX antes del lanzamiento.',
    'Merci. Vos réponses nous aideront à améliorer PNYX avant son lancement.',
    'Hvala. Vaši odgovori pomoći će nam poboljšati PNYX prije objave.',
    'Grazie. Le tue risposte ci aiuteranno a migliorare PNYX prima del lancio.',
    'Hvala. Vaši odgovori će nam pomoći da poboljšamo PNYX pre objave.',
    '谢谢。您的回答将帮助我们在发布前改进 PNYX。'
  ),
}

const familiarityOptions = [
  option('never_heard', tx('I had never heard of it.', 'Zanj še nisem slišal/-a.', 'Ich hatte noch nie davon gehört.', 'Δεν την είχα ξανακούσει.', 'Nunca había oído hablar de ella.', 'Je n’en avais jamais entendu parler.', 'Nikad prije nisam čuo/-la za njega.', 'Non ne avevo mai sentito parlare.', 'Nikada ranije nisam čuo/-la za njega.', '我从未听说过。')),
  option('name_only', tx('I knew the name, but not its significance.', 'Poznal/-a sem ime, ne pa pomena.', 'Ich kannte den Namen, aber nicht seine Bedeutung.', 'Γνώριζα το όνομα, αλλά όχι τη σημασία της.', 'Conocía el nombre, pero no su importancia.', 'Je connaissais le nom, mais pas son importance.', 'Znao/-la sam ime, ali ne i njegov značaj.', 'Conoscevo il nome, ma non la sua importanza.', 'Znao/-la sam ime, ali ne i njegov značaj.', '我知道这个名字，但不了解其意义。')),
  option('knew_significance', tx('I knew what the Pnyx was.', 'Vedel/-a sem, kaj je Pnyx.', 'Ich wusste, was die Pnyx war.', 'Γνώριζα τι ήταν η Πνύκα.', 'Sabía qué era la Pnyx.', 'Je savais ce qu’était la Pnyx.', 'Znao/-la sam što je Pniks.', 'Sapevo cos’era la Pnice.', 'Znao/-la sam šta je Pniks.', '我知道普尼克斯是什么。')),
  option('visited', tx('I had already visited the Pnyx.', 'Pnyx sem že obiskal/-a.', 'Ich hatte die Pnyx bereits besucht.', 'Είχα ήδη επισκεφθεί την Πνύκα.', 'Ya había visitado la Pnyx.', 'J’avais déjà visité la Pnyx.', 'Već sam posjetio/-la Pniks.', 'Avevo già visitato la Pnice.', 'Već sam posetio/-la Pniks.', '我以前参观过普尼克斯。')),
]

const contributionOptions = [
  option('clear_appropriate', tx('Clear and appropriate', 'Jasen in primeren', 'Klar und angemessen', 'Σαφής και κατάλληλη', 'Clara y adecuada', 'Clair et approprié', 'Jasan i primjeren', 'Chiaro e appropriato', 'Jasan i primeren', '清楚且恰当')),
  option('appropriate_too_hidden', tx('Appropriate, but too hidden', 'Primeren, vendar preveč skrit', 'Angemessen, aber zu versteckt', 'Κατάλληλη, αλλά πολύ κρυμμένη', 'Adecuada, pero demasiado oculta', 'Approprié, mais trop discret', 'Primjeren, ali previše skriven', 'Appropriato, ma troppo nascosto', 'Primeren, ali previše skriven', '恰当，但太隐蔽')),
  option('too_prominent', tx('Too prominent or intrusive', 'Preveč izrazit ali vsiljiv', 'Zu auffällig oder aufdringlich', 'Υπερβολικά έντονη ή ενοχλητική', 'Demasiado visible o intrusiva', 'Trop visible ou intrusif', 'Previše istaknut ili nametljiv', 'Troppo evidente o invadente', 'Previše istaknut ili nametljiv', '过于突出或打扰')),
  option('unclear_effect', tx('It was unclear what the contribution enables', 'Ni bilo jasno, kaj prispevek omogoča', 'Es war unklar, was der Beitrag ermöglicht', 'Δεν ήταν σαφές τι επιτρέπει η συνεισφορά', 'No quedaba claro qué permite la contribución', 'L’utilité de la contribution n’était pas claire', 'Nije bilo jasno što doprinos omogućuje', 'Non era chiaro cosa rendesse possibile il contributo', 'Nije bilo jasno šta doprinos omogućava', '不清楚捐助会带来什么')),
  option('not_noticed', tx('I did not notice the prompt', 'Poziva nisem opazil/-a', 'Ich habe den Hinweis nicht bemerkt', 'Δεν πρόσεξα την προτροπή', 'No vi la invitación', 'Je n’ai pas remarqué l’invitation', 'Nisam primijetio/-la poziv', 'Non ho notato l’invito', 'Nisam primetio/-la poziv', '我没有注意到该提示')),
]

export const DEFAULT_QUESTIONS: Omit<SurveyQuestion, 'id'>[] = [
  {
    question_key: 'pnyx_familiarity', section: 'Test survey', question_type: 'single_choice', required: true, display_order: 1, enabled: true,
    label: tx('Before today’s test, how well did you know the Pnyx?', 'Kako dobro ste pred današnjim testom poznali Pnyx?', 'Wie gut kannten Sie die Pnyx vor dem heutigen Test?', 'Πόσο καλά γνωρίζατε την Πνύκα πριν από τη σημερινή δοκιμή;', '¿Cuánto conocías la Pnyx antes de la prueba de hoy?', 'Dans quelle mesure connaissiez-vous la Pnyx avant le test d’aujourd’hui ?', 'Koliko ste dobro poznavali Pniks prije današnjeg testiranja?', 'Quanto conoscevi la Pnice prima del test di oggi?', 'Koliko ste dobro poznavali Pniks pre današnjeg testiranja?', '在今天测试之前，您对普尼克斯了解多少？'),
    options: familiarityOptions,
  },
  {
    question_key: 'offering_summary', section: 'Test survey', question_type: 'text', required: true, display_order: 2, enabled: true, options: [],
    label: tx('In one sentence, what do you think PNYX offers?', 'V enem stavku napišite, kaj po vašem mnenju ponuja PNYX.', 'Beschreiben Sie in einem Satz, was PNYX Ihrer Meinung nach bietet.', 'Σε μία πρόταση, τι πιστεύετε ότι προσφέρει το PNYX;', 'En una frase, ¿qué crees que ofrece PNYX?', 'En une phrase, qu’offre PNYX selon vous ?', 'U jednoj rečenici napišite što po vašem mišljenju nudi PNYX.', 'In una frase, cosa pensi che offra PNYX?', 'U jednoj rečenici napišite šta po vašem mišljenju nudi PNYX.', '请用一句话说明您认为 PNYX 提供什么。'),
  },
  {
    question_key: 'start_ease', section: 'Test survey', question_type: 'rating', required: true, display_order: 3, enabled: true,
    label: tx('How easy was it to find and start the audio experience?', 'Kako preprosto je bilo najti in začeti avdio izkušnjo?', 'Wie einfach war es, das Audio-Erlebnis zu finden und zu starten?', 'Πόσο εύκολο ήταν να βρείτε και να ξεκινήσετε την ηχητική εμπειρία;', '¿Qué tan fácil fue encontrar e iniciar la experiencia de audio?', 'A-t-il été facile de trouver et de lancer l’expérience audio ?', 'Koliko je bilo jednostavno pronaći i pokrenuti audio iskustvo?', 'Quanto è stato facile trovare e avviare l’esperienza audio?', 'Koliko je bilo jednostavno pronaći i pokrenuti audio iskustvo?', '找到并开始音频体验有多容易？'),
    options: [
      option('1', tx('Very difficult', 'Zelo težko', 'Sehr schwierig', 'Πολύ δύσκολο', 'Muy difícil', 'Très difficile', 'Vrlo teško', 'Molto difficile', 'Veoma teško', '非常困难')),
      option('5', tx('Very easy', 'Zelo preprosto', 'Sehr einfach', 'Πολύ εύκολο', 'Muy fácil', 'Très facile', 'Vrlo jednostavno', 'Molto facile', 'Veoma jednostavno', '非常容易')),
    ],
  },
  {
    question_key: 'start_ease_blocker', section: 'Test survey', question_type: 'textarea', required: true, display_order: 4, enabled: true, options: [],
    label: tx('What got in your way?', 'Kaj vas je oviralo?', 'Was hat Sie dabei behindert?', 'Τι σας δυσκόλεψε;', '¿Qué te lo dificultó?', 'Qu’est-ce qui vous a gêné ?', 'Što vam je predstavljalo prepreku?', 'Cosa ti ha ostacolato?', 'Šta vam je predstavljalo prepreku?', '是什么阻碍了您？'),
    conditional_logic: { question_key: 'start_ease', operator: 'in', value: [1, 2, 3] },
  },
  {
    question_key: 'pnyx_liveliness', section: 'Test survey', question_type: 'rating', required: true, display_order: 5, enabled: true,
    label: tx('After listening, how much more meaningful and alive did the Pnyx feel?', 'Po poslušanju: koliko bolj smiseln in živ se vam je zdel Pnyx?', 'Wie viel bedeutungsvoller und lebendiger wirkte die Pnyx nach dem Hören?', 'Μετά την ακρόαση, πόσο πιο ουσιαστική και ζωντανή σας φάνηκε η Πνύκα;', 'Después de escuchar, ¿cuánto más significativa y viva te pareció la Pnyx?', 'Après l’écoute, la Pnyx vous a-t-elle semblé plus vivante et porteuse de sens ?', 'Nakon slušanja, koliko vam je Pniks djelovao smislenije i življe?', 'Dopo l’ascolto, quanto ti è sembrata più significativa e viva la Pnice?', 'Nakon slušanja, koliko vam je Pniks delovao smislenije i življe?', '收听后，普尼克斯让您感觉更有意义、更鲜活了吗？'),
    options: [
      option('1', tx('Not at all', 'Sploh ne', 'Überhaupt nicht', 'Καθόλου', 'En absoluto', 'Pas du tout', 'Nimalo', 'Per niente', 'Nimalo', '完全没有')),
      option('5', tx('Very much', 'Zelo', 'Sehr', 'Πάρα πολύ', 'Mucho', 'Beaucoup', 'Vrlo', 'Molto', 'Veoma', '非常')),
    ],
  },
  {
    question_key: 'bonus_likelihood', section: 'Test survey', question_type: 'rating', required: true, display_order: 6, enabled: true,
    label: tx('How likely would you be to continue with the seven shorter stories?', 'Kako verjetno bi nadaljevali s sedmimi krajšimi zgodbami?', 'Wie wahrscheinlich würden Sie mit den sieben kürzeren Geschichten fortfahren?', 'Πόσο πιθανό είναι να συνεχίσετε με τις επτά συντομότερες ιστορίες;', '¿Qué probabilidad hay de que continúes con las siete historias más breves?', 'Quelle serait la probabilité que vous poursuiviez avec les sept histoires plus courtes ?', 'Koliko je vjerojatno da biste nastavili sa sedam kraćih priča?', 'Quanto è probabile che continueresti con le sette storie più brevi?', 'Koliko je verovatno da biste nastavili sa sedam kraćih priča?', '您继续收听七个较短故事的可能性有多大？'),
    options: [
      option('1', tx('Definitely not', 'Zagotovo ne', 'Auf keinen Fall', 'Σίγουρα όχι', 'Definitivamente no', 'Certainement pas', 'Sigurno ne', 'Sicuramente no', 'Sigurno ne', '肯定不会')),
      option('5', tx('Definitely would', 'Zagotovo bi', 'Auf jeden Fall', 'Σίγουρα ναι', 'Definitivamente sí', 'Certainement', 'Sigurno bih', 'Sicuramente sì', 'Sigurno bih', '肯定会')),
    ],
  },
  {
    question_key: 'contribution_prompt_reaction', section: 'Test survey', question_type: 'single_choice', required: true, display_order: 7, enabled: true,
    label: tx('How did the voluntary contribution prompt feel to you?', 'Kako je na vas deloval poziv k prostovoljnemu prispevku?', 'Wie wirkte der Hinweis auf einen freiwilligen Beitrag auf Sie?', 'Πώς σας φάνηκε η προτροπή για εθελοντική συνεισφορά;', '¿Qué te pareció la invitación a hacer una contribución voluntaria?', 'Comment avez-vous perçu l’invitation à contribuer volontairement ?', 'Kako je na vas djelovao poziv na dobrovoljni doprinos?', 'Come ti è sembrato l’invito a dare un contributo volontario?', 'Kako je na vas delovao poziv na dobrovoljni doprinos?', '您对自愿捐助提示有何感受？'),
    options: contributionOptions,
  },
  {
    question_key: 'top_improvement', section: 'Test survey', question_type: 'textarea', required: true, display_order: 8, enabled: true, options: [],
    label: tx('What is the single most important thing we should improve before launch?', 'Kaj je ena najpomembnejša stvar, ki jo moramo pred objavo izboljšati?', 'Was ist das Wichtigste, das wir vor der Veröffentlichung verbessern sollten?', 'Ποιο είναι το σημαντικότερο πράγμα που πρέπει να βελτιώσουμε πριν από τη δημοσίευση;', '¿Qué es lo más importante que deberíamos mejorar antes del lanzamiento?', 'Quelle est la chose la plus importante à améliorer avant le lancement ?', 'Koja je najvažnija stvar koju trebamo poboljšati prije objave?', 'Qual è la cosa più importante che dovremmo migliorare prima del lancio?', 'Koja je najvažnija stvar koju treba da poboljšamo pre objave?', '正式发布前我们最应该改进的一件事是什么？'),
  },
]

const TEST_SECTION = tx('Test survey', 'Testna anketa', 'Testumfrage', 'Δοκιμαστική έρευνα', 'Encuesta de prueba', 'Enquête test', 'Testna anketa', 'Sondaggio di prova', 'Testna anketa', '测试问卷')

export const localized = (value: LocalizedText | undefined, locale: string, fallback = '') => value?.[locale] || value?.[locale.split('-')[0]] || value?.en || Object.values(value ?? {})[0] || fallback
export const localizedQuestion = (question: SurveyQuestion, locale: string) => localized(question.label, locale)
export const localizedOption = (item: { value: string; label: LocalizedText }, locale: string) => localized(item.label, locale)
export const localizedSection = (section: string, locale: string) => section === 'Test survey' ? localized(TEST_SECTION, locale) : section

export const conditionMet = (question: SurveyQuestion, answers: Record<string, unknown>) => {
  const condition = question.conditional_logic
  if (!condition) return true
  const value = answers[condition.question_key]
  if (condition.operator === 'not_empty') return typeof value === 'string' ? Boolean(value.trim()) : value != null
  if (condition.operator === 'in') return Array.isArray(condition.value) && condition.value.includes(value)
  return value === condition.value
}

export async function loadSurvey(guideId: string, token?: string) {
  const { data, error } = await supabase.rpc('get_feedback_survey', { p_guide_id: guideId, p_invitation_token: token ?? null })
  if (error) throw error
  return data as FeedbackSurvey | null
}
