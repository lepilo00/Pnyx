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
}

// One story row: artwork, badges (free/bonus/locked/completed), title,
// duration and a resume-progress hairline. Shared between the "All stories"
// sheet and the playlist view.
export default function StoryListItem({ story, stories, progress, locked, selected, onSelect }: StoryListItemProps) {
  const { t } = useTranslation()
  const percent = progress?.duration ? Math.min(100, (progress.position / progress.duration) * 100) : 0
  const artwork = getStoryArtwork(story, stories)

  return (
    <button
      onClick={onSelect}
      aria-current={selected || undefined}
      className={`relative flex min-h-11 w-full gap-3 rounded-xl border px-3 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${selected ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/20' : 'border-transparent hover:bg-parchment-100 dark:hover:bg-stone-800'}`}
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-parchment-200 dark:bg-stone-800">
        {artwork && <img src={artwork} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-amber-700">
          {story.story_type === 'introduction' && <span>{t('listening.free')}</span>}
          {story.story_type === 'bonus' && <span>{t('listening.bonus')}</span>}
          {locked && <span className="text-stone-500">{t('listening.locked')}</span>}
          {progress?.completed && <span className="text-emerald-700">{t('listening.completed')}</span>}
        </div>
        <p className={`font-serif text-[15px] leading-tight text-navy-900 dark:text-stone-100 ${selected ? 'font-bold' : 'font-semibold'}`}>{story.title}</p>
        <p className="mt-1 text-[11px] text-stone-500">{story.duration_seconds ? `${Math.ceil(story.duration_seconds / 60)} ${t('listening.minutes')}` : t('listening.audioStory')}</p>
        {percent > 0 && <div className="mt-2 h-0.5 overflow-hidden bg-stone-200"><div className="h-full bg-amber-600" style={{ width: `${percent}%` }} /></div>}
      </div>
      {locked && <span className="self-center text-stone-400" aria-hidden="true">⌑</span>}
    </button>
  )
}
