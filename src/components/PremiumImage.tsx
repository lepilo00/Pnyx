import { useState } from 'react'

interface PremiumImageProps {
  src: string
  alt?: string
  containerClassName?: string
  imgClassName?: string
  loading?: 'eager' | 'lazy'
  /** Rendered on top of the image (e.g. a gradient fade); position it absolutely. */
  children?: React.ReactNode
}

// Illustration slot for the premium page. Keeps a neutral placeholder block
// (correct aspect ratio, no broken-image icon) when the asset is missing.
export default function PremiumImage({
  src,
  alt = '',
  containerClassName = '',
  imgClassName = 'h-full w-full object-cover',
  loading = 'lazy',
  children,
}: PremiumImageProps) {
  const [hasError, setHasError] = useState(false)

  return (
    <div className={`overflow-hidden bg-parchment-200 dark:bg-stone-800 ${containerClassName}`}>
      {!hasError && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onError={() => setHasError(true)}
          className={imgClassName}
        />
      )}
      {children}
    </div>
  )
}
