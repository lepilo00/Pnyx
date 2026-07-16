import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { HeroSlideshowImage } from '@/data/heroSlideshowImages'

interface HeroSlideshowProps {
  images: HeroSlideshowImage[]
  aspectClassName?: string
  imagePositionClassName?: string
  frameClassName?: string
  imageClassName?: string
}

const AUTO_ADVANCE_MS = 5000
const SWIPE_THRESHOLD_PX = 40

export default function HeroSlideshow({
  images,
  aspectClassName = 'aspect-[4/3]',
  imagePositionClassName = 'object-center',
  frameClassName = 'rounded-2xl shadow-md bg-stone-100 dark:bg-stone-800',
  imageClassName = '',
}: HeroSlideshowProps) {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const hasMultiple = images.length > 1

  const goPrev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  const goNext = () => setCurrentIndex((i) => (i + 1) % images.length)

  useEffect(() => {
    if (!hasMultiple) return
    const timer = setInterval(goNext, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
    // Resets the auto-advance clock on every slide change (auto or manual),
    // so a manual nav isn't immediately overridden by a stale tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMultiple, currentIndex])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !hasMultiple) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) {
      if (delta > 0) goPrev()
      else goNext()
    }
    touchStartX.current = null
  }

  if (images.length === 0) return null

  return (
    <div className="relative">
      <div
        className={`w-full ${aspectClassName} overflow-hidden relative ${frameClassName}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={images[currentIndex].src}
          alt={t('landing.heroSlideshow.alt')}
          className={`w-full h-full object-cover ${imagePositionClassName} ${imageClassName}`}
        />
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

          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
            {images.map((img, i) => (
              <button
                key={img.src}
                onClick={() => setCurrentIndex(i)}
                aria-label={t('gallery.goToImage', { number: i + 1, total: images.length })}
                aria-current={i === currentIndex}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-amber-500' : 'bg-white/70 dark:bg-stone-300/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
