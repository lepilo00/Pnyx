import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { PnyxGalleryImage } from '@/data/pnyxImages'

interface ArrivalGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  images: PnyxGalleryImage[]
  streetViewUrl: string
}

export default function ArrivalGalleryModal({
  isOpen,
  onClose,
  images,
  streetViewUrl,
}: ArrivalGalleryModalProps) {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const hasMultiple = images.length > 1

  const goPrev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  const goNext = () => setCurrentIndex((i) => (i + 1) % images.length)

  useEffect(() => {
    if (isOpen) setCurrentIndex(0)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' && hasMultiple) goPrev()
      else if (e.key === 'ArrowRight' && hasMultiple) goNext()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previouslyFocusedRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hasMultiple])

  if (!isOpen) return null

  const current = images[currentIndex]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="arrival-gallery-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full h-[95vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between gap-3 px-5 pt-4 pb-2 flex-shrink-0 bg-white dark:bg-stone-900 rounded-t-2xl">
          <h2
            id="arrival-gallery-title"
            className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 truncate"
          >
            {t('gallery.title')}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label={t('gallery.close')}
            className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0
                       bg-stone-100 dark:bg-stone-800
                       text-stone-600 dark:text-stone-300
                       hover:bg-stone-200 dark:hover:bg-stone-700
                       transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — image area grows to fill available height */}
        <div className="flex-1 flex flex-col min-h-0 px-5 pb-4 overflow-y-auto">
          {images.length === 0 ? (
            <p className="flex-1 flex items-center justify-center text-sm text-stone-400 dark:text-stone-500">
              {t('gallery.comingSoon')}
            </p>
          ) : (
            <>
              {/* Carousel — fills remaining vertical space */}
              <div className="relative flex-1 min-h-[180px] mb-3">
                <div className="w-full h-full rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
                  <img
                    src={current.src}
                    alt={current.alt}
                    loading="lazy"
                    onError={() =>
                      setFailedIds((prev) => new Set(prev).add(current.id))
                    }
                    className="w-full h-full object-cover"
                  />
                  {failedIds.has(current.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-sm text-stone-400 dark:text-stone-500 px-4 text-center">
                      {t('gallery.imageUnavailable')}
                    </div>
                  )}
                </div>

                {hasMultiple && (
                  <>
                    <button
                      onClick={goPrev}
                      aria-label={t('gallery.prevImage')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                                 bg-white/80 dark:bg-stone-900/80 shadow-sm flex items-center justify-center
                                 text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-900 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={goNext}
                      aria-label={t('gallery.nextImage')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                                 bg-white/80 dark:bg-stone-900/80 shadow-sm flex items-center justify-center
                                 text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-900 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {hasMultiple && (
                <div className="flex justify-center gap-2 mb-2 flex-shrink-0">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentIndex(i)}
                      aria-label={t('gallery.goToImage', { number: i + 1, total: images.length })}
                      aria-current={i === currentIndex}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentIndex
                          ? 'bg-amber-600'
                          : 'bg-stone-300 dark:bg-stone-700'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Attribution */}
              <p className="text-center flex-shrink-0 mb-3">
                <a
                  href={current.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-amber-600 dark:text-amber-500 hover:underline"
                >
                  {current.sourceLabel}
                </a>
              </p>
            </>
          )}

          {/* Street View link */}
          <a
            href={streetViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full flex-shrink-0
                       bg-white dark:bg-stone-900
                       hover:bg-stone-50 dark:hover:bg-stone-800
                       border border-stone-200 dark:border-stone-700
                       text-stone-700 dark:text-stone-200
                       font-semibold py-3 rounded-2xl transition-colors mb-2"
          >
            <svg className="w-5 h-5 text-stone-400 dark:text-stone-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {t('gallery.streetViewLink')}
          </a>

          <p className="text-xs text-stone-400 dark:text-stone-500 text-center leading-relaxed flex-shrink-0">
            {t('gallery.attributionNote')}
          </p>
        </div>
      </div>
    </div>
  )
}
