import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Stop } from '@/lib/types'
import type { StoryProgress } from '@/lib/audioProgress'
import { getStoryArtwork } from '@/lib/storyArtwork'

interface Props {
  open: boolean
  stories: Stop[]
  currentId: string
  progress: Record<string, StoryProgress>
  isLocked: (story: Stop) => boolean
  onSelect: (story: Stop) => void
  onClose: () => void
}

export default function StorySelectorSheet({ open, stories, currentId, progress, isLocked, onSelect, onClose }: Props) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/45 backdrop-blur-[2px]" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="stories-title" tabIndex={-1} className="max-h-[88dvh] w-full max-w-lg overflow-hidden rounded-t-[1.75rem] border border-amber-200 bg-parchment-50 shadow-2xl focus:outline-none dark:border-stone-700 dark:bg-stone-900">
        <div className="sticky top-0 z-10 border-b border-amber-200/70 bg-parchment-50/95 px-5 pb-3 pt-2 backdrop-blur dark:border-stone-700 dark:bg-stone-900/95">
          <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-stone-300 dark:bg-stone-600" aria-hidden="true" />
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">Pnyx Athens</p><h2 id="stories-title" className="font-serif text-2xl font-bold text-navy-900 dark:text-stone-50">{t('listening.allStories')}</h2></div>
            <button onClick={onClose} aria-label={t('listening.closeStories')} className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-stone-500 hover:bg-parchment-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600">×</button>
          </div>
        </div>
        <div className="overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
          {stories.map((story) => {
            const saved = progress[story.id]
            const locked = isLocked(story)
            const selected = story.id === currentId
            const percent = saved?.duration ? Math.min(100, (saved.position / saved.duration) * 100) : 0
            const type = story.story_type ?? (story.is_bonus ? 'bonus' : story.order_index === 1 ? 'introduction' : 'main')
            const artwork = getStoryArtwork(story, stories)
            return (
              <button key={story.id} onClick={() => onSelect(story)} className={`relative flex w-full gap-3 rounded-xl border px-3 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${selected ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/20' : 'border-transparent hover:bg-parchment-100 dark:hover:bg-stone-800'}`}>
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-parchment-200 dark:bg-stone-800">{artwork && <img src={artwork} alt="" className="h-full w-full object-cover" />}</div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-amber-700">
                    {type === 'introduction' && <span>{t('listening.free')}</span>}{type === 'bonus' && <span>{t('listening.bonus')}</span>}{locked && <span className="text-stone-500">{t('listening.locked')}</span>}{saved?.completed && <span className="text-emerald-700">{t('listening.completed')}</span>}
                  </div>
                  <p className={`font-serif text-[15px] leading-tight text-navy-900 dark:text-stone-100 ${selected ? 'font-bold' : 'font-semibold'}`}>{story.title}</p>
                  <p className="mt-1 text-[11px] text-stone-500">{story.duration_seconds ? `${Math.ceil(story.duration_seconds / 60)} ${t('listening.minutes')}` : t('listening.audioStory')}</p>
                  {percent > 0 && <div className="mt-2 h-0.5 overflow-hidden bg-stone-200"><div className="h-full bg-amber-600" style={{ width: `${percent}%` }} /></div>}
                </div>
                {locked && <span className="self-center text-stone-400" aria-hidden="true">⌑</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
