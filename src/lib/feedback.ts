import { supabase } from './supabaseClient'

export type FeedbackMode = 'disabled' | 'invited_testers' | 'authenticated_users' | 'all_users'
export type FeedbackTiming = 'after_main_walk_completion' | 'after_all_content_completion' | 'always_available' | 'manually_triggered'
export type QuestionType = 'rating' | 'nps' | 'single_choice' | 'text' | 'textarea' | 'story_selector' | 'device' | 'email'

export interface SurveyQuestion {
  id: string; question_key: string; section: string; question_type: QuestionType
  label: Record<string, string>; description?: Record<string, string>; required: boolean
  display_order: number; options: Array<{ value: string; label: Record<string, string> }>
  conditional_logic?: { question_key: string; operator: 'equals' | 'in' | 'not_empty'; value?: unknown }
  enabled: boolean
}
export interface FeedbackSurvey {
  id: string; guide_id: string; version: number; status: 'draft' | 'published' | 'closed'
  access_mode: FeedbackMode; display_timing: FeedbackTiming; title: Record<string, string>
  introduction: Record<string, string>; completion_message: Record<string, string>; estimated_minutes: number
  allow_anonymous: boolean; allow_multiple_submissions: boolean; ask_for_email: boolean; require_email: boolean
  collect_technical_context: boolean; starts_at?: string | null; ends_at?: string | null; survey_price?: number | null
  price_choices: string[]; internal_notes?: string | null; questions?: SurveyQuestion[]
}

const l = (en: string) => ({ en })
const options = (...items: string[]) => items.map(value => ({ value: value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), label: l(value) }))
export const DEFAULT_QUESTIONS: Omit<SurveyQuestion, 'id'>[] = [
  ['overall_rating','Overall Experience','rating','How would you rate your overall experience?',true],
  ['nps','Overall Experience','nps','How likely are you to recommend this guide to a friend?',true],
  ['nps_reason','Overall Experience','text','Why did you choose that score?',false],
  ['biggest_problem','Overall Experience','textarea','What was the biggest problem?',false,[],{question_key:'overall_rating',operator:'in',value:[1,2]}],
  ['ease_of_use','Usability','rating','How easy was the guide to use?',false],
  ['unsure_next','Usability','single_choice','Did you ever feel unsure what to do next?',false,options('Never','Once','A few times','Frequently')],
  ['confusing','Usability','text','Was anything confusing?',false],
  ['confusing_where','Usability','text','Where did this happen?',false,[],{question_key:'confusing',operator:'not_empty'}],
  ['story_navigation','Usability','rating','How easy was it to move between stories?',false],
  ['audio_player','Usability','rating','Did the audio player feel natural to use?',false],
  ['progress_indicator','Usability','single_choice','Did you notice and understand the progress indicator?',false,options('Yes','Partly','No')],
  ['narration_rating','Audio and Content','rating','How would you rate the narration?',false],
  ['narration_speed','Audio and Content','single_choice','How was the narration speed?',false,options('Too slow','Just right','Too fast')],
  ['audio_quality','Audio and Content','rating','How would you rate the audio quality?',false],
  ['story_length','Audio and Content','single_choice','How did the story length feel?',false,options('Too short','Just right','Too long')],
  ['most_liked_story','Audio and Content','story_selector','Which story did you enjoy the most?',false],
  ['least_engaging_story','Audio and Content','story_selector','Which story was the least engaging?',false,options('None','Not sure')],
  ['content_engagement','Audio and Content','rating','How engaging was the historical content?',false],
  ['learned_new','Audio and Content','rating','Did you learn something new?',false],
  ['content_missing','Audio and Content','text','Was anything missing from the content?',false],
  ['use_location','Real-world Use','single_choice','Where did you use the guide?',false,options('At the location','Walking near the location','Sitting nearby','At home','Somewhere else')],
  ['outdoor_readability','Real-world Use','single_choice','Was the screen easy to read outdoors?',false,options('Yes','Mostly','No','I did not use it outdoors')],
  ['readability_problem','Real-world Use','text','What was difficult to read?',false,[],{question_key:'outdoor_readability',operator:'equals',value:'no'}],
  ['headphones','Real-world Use','single_choice','Did you use headphones?',false,options('Yes','No')],
  ['device','Real-world Use','device','Which device did you use?',false,options('iPhone','Android phone','Tablet','Desktop or laptop','Other')],
  ['worth_paying','Value','rating','Did the experience feel worth paying for?',false],
  ['would_buy','Value','single_choice','Would you buy this guide at the displayed price?',false,options('Definitely yes','Probably yes','Maybe','Probably not','Definitely not')],
  ['reasonable_price','Value','single_choice','What price would feel reasonable?',false],
  ['premium_perception','Value','single_choice','How did the guide feel overall?',false,options('Like a basic website','Like a standard audio guide','Like a premium mobile experience')],
  ['pmf_disappointment','Value','single_choice','How would you feel if this guide were no longer available?',false,options('Very disappointed','Somewhat disappointed','Not disappointed','I am not sure')],
  ['improvements','Open Feedback','textarea','What are the three things you would improve first?',false],
  ['bugs','Open Feedback','textarea','Did you notice any bugs or technical issues?',false],
  ['disappointed','Open Feedback','text','Did anything disappoint you?',false],
  ['positive_surprise','Open Feedback','text','What surprised you positively?',false],
  ['anything_else','Open Feedback','textarea','Is there anything else you would like to tell us?',false],
  ['future_beta','Open Feedback','single_choice','Would you participate in future beta tests?',false,options('Yes','Maybe','No')],
].map((q, i) => ({ question_key:q[0] as string, section:q[1] as string, question_type:q[2] as QuestionType, label:l(q[3] as string), required:q[4] as boolean, options:(q[5] as SurveyQuestion['options']) ?? [], conditional_logic:q[6] as SurveyQuestion['conditional_logic'], display_order:i+1, enabled:true }))

export const localized = (value: Record<string,string> | undefined, locale: string, fallback='') => value?.[locale] || value?.[locale.split('-')[0]] || value?.en || Object.values(value ?? {})[0] || fallback
const SL_QUESTIONS: Record<string, string> = {
  overall_rating: 'Kako bi ocenili svojo celotno izkušnjo?', nps: 'Kako verjetno bi ta vodič priporočili prijatelju?', nps_reason: 'Zakaj ste izbrali to oceno?', biggest_problem: 'Kaj je bila največja težava?',
  ease_of_use: 'Kako preprosta je bila uporaba vodiča?', unsure_next: 'Ali kdaj niste vedeli, kaj storiti naprej?', confusing: 'Ali je bilo kaj nejasno?', confusing_where: 'Kje se je to zgodilo?', story_navigation: 'Kako preprosto je bilo prehajanje med zgodbami?', audio_player: 'Ali je bila uporaba predvajalnika zvoka naravna?', progress_indicator: 'Ali ste opazili in razumeli prikaz napredka?',
  narration_rating: 'Kako bi ocenili pripoved?', narration_speed: 'Kakšna je bila hitrost pripovedi?', audio_quality: 'Kako bi ocenili kakovost zvoka?', story_length: 'Kakšna se vam je zdela dolžina zgodb?', most_liked_story: 'Katera zgodba vam je bila najbolj všeč?', least_engaging_story: 'Katera zgodba je bila najmanj zanimiva?', content_engagement: 'Kako zanimiva je bila zgodovinska vsebina?', learned_new: 'Ali ste izvedeli kaj novega?', content_missing: 'Ali je v vsebini kaj manjkalo?',
  use_location: 'Kje ste uporabljali vodič?', outdoor_readability: 'Ali je bil zaslon na prostem dobro berljiv?', readability_problem: 'Kaj je bilo težko prebrati?', headphones: 'Ali ste uporabljali slušalke?', device: 'Katero napravo ste uporabljali?',
  worth_paying: 'Ali se vam je zdelo, da je izkušnja vredna plačila?', would_buy: 'Ali bi vodič kupili po prikazani ceni?', reasonable_price: 'Kakšna cena bi se vam zdela primerna?', premium_perception: 'Kakšen vtis je vodič naredil kot celota?', pmf_disappointment: 'Kako bi se počutili, če ta vodič ne bi bil več na voljo?',
  improvements: 'Katere tri stvari bi najprej izboljšali?', bugs: 'Ali ste opazili napake ali tehnične težave?', disappointed: 'Vas je kaj razočaralo?', positive_surprise: 'Kaj vas je pozitivno presenetilo?', anything_else: 'Ali nam želite povedati še kaj?', future_beta: 'Bi sodelovali pri prihodnjih beta testiranjih?',
}
const SL_OPTIONS: Record<string, string> = {
  never:'Nikoli', once:'Enkrat', a_few_times:'Nekajkrat', frequently:'Pogosto', yes:'Da', partly:'Delno', no:'Ne', too_slow:'Prepočasi', just_right:'Ravno prav', too_fast:'Prehitro', too_short:'Prekratko', too_long:'Predolgo', none:'Nobena', not_sure:'Nisem prepričan/-a',
  at_the_location:'Na lokaciji', walking_near_the_location:'Med hojo v bližini lokacije', sitting_nearby:'Med sedenjem v bližini', at_home:'Doma', somewhere_else:'Drugje', mostly:'Večinoma', i_did_not_use_it_outdoors:'Vodiča nisem uporabljal/-a na prostem', iphone:'iPhone', android_phone:'Telefon Android', tablet:'Tablica', desktop_or_laptop:'Namizni ali prenosni računalnik', other:'Drugo',
  definitely_yes:'Zagotovo da', probably_yes:'Verjetno da', maybe:'Morda', probably_not:'Verjetno ne', definitely_not:'Zagotovo ne', like_a_basic_website:'Kot osnovna spletna stran', like_a_standard_audio_guide:'Kot običajen avdio vodič', like_a_premium_mobile_experience:'Kot vrhunska mobilna izkušnja', very_disappointed:'Zelo razočaran/-a', somewhat_disappointed:'Nekoliko razočaran/-a', not_disappointed:'Ne bi bil/-a razočaran/-a', i_am_not_sure:'Nisem prepričan/-a', i_would_not_pay:'Ne bi plačal/-a',
}
const SL_SECTIONS: Record<string,string> = {'Overall Experience':'Celotna izkušnja','Usability':'Uporabnost','Audio and Content':'Zvok in vsebina','Real-world Use':'Uporaba na lokaciji','Value':'Vrednost','Open Feedback':'Odprte povratne informacije'}
export const localizedQuestion = (question: SurveyQuestion, locale: string) => locale.split('-')[0] === 'sl' ? SL_QUESTIONS[question.question_key] || localized(question.label, locale) : localized(question.label, locale)
export const localizedOption = (option: {value:string;label:Record<string,string>}, locale:string) => locale.split('-')[0] === 'sl' ? SL_OPTIONS[option.value] || localized(option.label,locale) : localized(option.label,locale)
export const localizedSection = (section:string,locale:string) => locale.split('-')[0] === 'sl' ? SL_SECTIONS[section] || section : section
export const conditionMet = (q: SurveyQuestion, answers: Record<string, unknown>) => {
  const c=q.conditional_logic; if(!c) return true; const v=answers[c.question_key]
  if(c.operator==='not_empty') return typeof v==='string' ? !!v.trim() : v != null
  if(c.operator==='in') return Array.isArray(c.value) && c.value.includes(v)
  return v===c.value
}
export const anonymousSessionId = () => { const key='pnyx_feedback_session'; let id=localStorage.getItem(key); if(!id){id=crypto.randomUUID();localStorage.setItem(key,id)} return id }
export async function loadSurvey(guideId:string, token?:string) {
  const { data, error } = await supabase.rpc('get_feedback_survey',{p_guide_id:guideId,p_invitation_token:token??null})
  if(error) throw error; return data as FeedbackSurvey | null
}
