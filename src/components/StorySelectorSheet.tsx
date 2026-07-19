import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import StorySectionList from '@/components/StorySectionList'
import type { Stop } from '@/lib/types'
import type { StoryProgress } from '@/lib/audioProgress'

interface Props {
  open: boolean
  stories: Stop[]
  currentId: string
  guideTitle: string
  progress: Record<string, StoryProgress>
  isLocked: (story: Stop) => boolean
  onSelect: (story: Stop) => void
  onClose: () => void
}

export default function StorySelectorSheet({ open, stories, currentId, guideTitle, progress, isLocked, onSelect, onClose }: Props) {
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
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">{guideTitle}</p><h2 id="stories-title" className="font-serif text-2xl font-bold text-navy-900 dark:text-stone-50">{t('listening.allStories')}</h2></div>
            <button onClick={onClose} aria-label={t('listening.closeStories')} className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-stone-500 hover:bg-parchment-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600">×</button>
          </div>
        </div>
        <div className="overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
          <StorySectionList stories={stories} currentId={currentId} progress={progress} isLocked={isLocked} onSelect={onSelect} />
        </div>
      </div>
    </div>
  )
}
