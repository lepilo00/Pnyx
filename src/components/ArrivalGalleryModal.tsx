import { useState, useEffect, useRef } from 'react'
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
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="arrival-gallery-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2
            id="arrival-gallery-title"
            className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100"
          >
            You've arrived 🏛
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0
                       hover:bg-stone-100 dark:hover:bg-stone-800
                       text-stone-400 dark:text-stone-500
                       hover:text-stone-700 dark:hover:text-stone-200
                       transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {images.length === 0 ? (
            <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-8">
              Photos coming soon.
            </p>
          ) : (
            <>
              {/* Carousel */}
              <div className="relative">
                <div className="w-full aspect-[4/3] rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
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
                      Image unavailable
                    </div>
                  )}
                </div>

                {hasMultiple && (
                  <>
                    <button
                      onClick={goPrev}
                      aria-label="Previous image"
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
                      aria-label="Next image"
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
                <div className="flex justify-center gap-2">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentIndex(i)}
                      aria-label={`Go to image ${i + 1} of ${images.length}`}
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
              <p className="text-center">
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
            className="flex items-center justify-center gap-2 w-full
                       bg-white dark:bg-stone-900
                       hover:bg-stone-50 dark:hover:bg-stone-800
                       border border-stone-200 dark:border-stone-700
                       text-stone-700 dark:text-stone-200
                       font-semibold py-3 rounded-2xl transition-colors"
          >
            <svg className="w-5 h-5 text-stone-400 dark:text-stone-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            View on Google Street View
          </a>

          <p className="text-xs text-stone-400 dark:text-stone-500 text-center leading-relaxed">
            Photos are linked from external sources and are not hosted by this app.
          </p>
        </div>
      </div>
    </div>
  )
}
