import { useTranslation } from 'react-i18next'
import type { Stop } from '@/lib/types'
import type { StoryProgress } from '@/lib/audioProgress'
import { getStoryArtwork } from '@/lib/storyArtwork'

interface StoryListItemProps {
  story: Stop
  /** Full story list — needed to resolve the shared premium artwork. */
  stories: Stop[]
  progress?: StoryProgress
  locked: boolean
  selected: boolean
  onSelect: () => void
  /** Show the animated equalizer on the active card while audio is playing. */
  isPlaying?: boolean
  /** When set, renders the expand/collapse chevron inside the card. */
  onToggleDetails?: () => void
  detailsOpen?: boolean
}

// One story row: artwork, badges (free/bonus/locked/completed), title,
// duration and a resume-progress hairline. Shared between the "All stories"
// sheet and the playlist view. Visual states: active (gold border + glow +
// equalizer), completed (muted, desaturated thumb, gold check), unplayed
// (neutral), locked (muted + lock badge, tap opens the paywall).
export default function StoryListItem({ story, stories, progress, locked, selected, onSelect, isPlaying = false, onToggleDetails, detailsOpen = false }: StoryListItemProps) {
  const { t } = useTranslation()
  const percent = progress?.duration ? Math.min(100, (progress.position / progress.duration) * 100) : 0
  const artwork = getStoryArtwork(story, stories)
  const completed = Boolean(progress?.completed)

  const stateClass = selected
    ? 'border-amber-500/80 bg-amber-50/80 shadow-[0_4px_18px_rgba(146,64,14,0.16)] dark:bg-amber-950/20'
    : locked
      ? 'border-stone-200/70 bg-white/70 opacity-80 dark:border-stone-700 dark:bg-stone-900/60'
      : completed
        ? 'border-stone-200/70 bg-white/75 opacity-75 dark:border-stone-700 dark:bg-stone-900/70'
        : 'border-stone-200/70 bg-white/90 hover:border-amber-400/60 dark:border-stone-700 dark:bg-stone-900'

  return (
    <div className={`relative flex items-stretch rounded-xl border transition-[border-color,box-shadow,opacity] duration-200 motion-reduce:transition-none ${stateClass}`}>
      <button
        onClick={onSelect}
        aria-current={selected || undefined}
        className="flex min-h-11 min-w-0 flex-1 gap-3 rounded-xl px-3 py-3 text-left transition-transform duration-150
                   active:scale-[0.99] motion-reduce:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
      >
        <div className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200/60 dark:border-stone-700 ${completed && !selected ? 'opacity-90 saturate-[0.6]' : ''}`}>
          {artwork
            ? <img src={artwork} alt="" loading="lazy" className="h-full w-full object-cover" />
            : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-950 to-navy-800 text-amber-400" aria-hidden="true">
                <TempleGlyph />
              </span>
            )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-amber-700">
            {isPlaying && (
              <span className="flex h-3 items-end gap-[2px] text-amber-600" aria-hidden="true">
                {[0, 1, 2].map((bar) => (
                  <span key={bar} className="audio-wave-bar h-full w-[3px] rounded-sm bg-current" style={{ animationDelay: `${bar * 150}ms` }} />
                ))}
              </span>
            )}
            {story.story_type === 'introduction' && <span>{t('listening.free')}</span>}
            {story.story_type === 'bonus' && <span>{t('listening.bonus')}</span>}
            {locked && <span className="flex items-center gap-0.5 text-stone-500"><LockGlyph />{t('listening.locked')}</span>}
            {completed && <span className="flex items-center gap-0.5 text-amber-700 dark:text-amber-500"><CheckGlyph />{t('listening.completed')}</span>}
          </div>
          <p className={`font-serif text-[15px] leading-tight text-navy-900 dark:text-stone-100 ${selected ? 'font-bold' : 'font-semibold'}`}>{story.title}</p>
          <p className="mt-1 text-[11px] text-stone-500">{story.duration_seconds ? `${Math.ceil(story.duration_seconds / 60)} ${t('listening.minutes')}` : t('listening.audioStory')}</p>
          {percent > 0 && !completed && <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"><div className="h-full bg-amber-600" style={{ width: `${percent}%` }} /></div>}
        </div>
      </button>

      {onToggleDetails && (
        <button
          onClick={onToggleDetails}
          aria-expanded={detailsOpen}
          aria-label={detailsOpen ? t('listening.hideDetails') : t('listening.showDetails')}
          className="flex w-11 shrink-0 items-center justify-center self-stretch rounded-r-xl text-stone-400
                     transition-colors hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:hover:text-amber-400"
        >
          <svg className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${detailsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

function TempleGlyph() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 3l9 5H3l9-5zM5 8v9m4.5-9v9m5-9v9M19 8v9M3 20h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockGlyph() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M6 8V6a4 4 0 118 0v2h.5A1.5 1.5 0 0116 9.5v6a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 15.5v-6A1.5 1.5 0 015.5 8H6zm2 0h4V6a2 2 0 10-4 0v2z" />
    </svg>
  )
}

function CheckGlyph() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
      <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
