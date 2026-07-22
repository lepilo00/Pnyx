import PremiumImage from '@/components/PremiumImage'

interface StoryIllustrationProps {
  src?: string
  alt: string
  size?: 'small' | 'medium' | 'large' | 'fluid'
  circular?: boolean
  className?: string
  imgClassName?: string
}

const SIZE_CLASSES = {
  small: 'h-14 w-14',
  medium: 'h-[4.5rem] w-[4.5rem]',
  large: 'h-24 w-24',
  fluid: 'h-full w-full',
} as const

// Reusable premium artwork slot. It accepts a real asset now and retains a
// styled, accessible layout slot if an illustration is added later or fails.
export default function StoryIllustration({
  src,
  alt,
  size = 'medium',
  circular = false,
  className = '',
  imgClassName = 'h-full w-full object-cover',
}: StoryIllustrationProps) {
  return (
    <PremiumImage
      src={src}
      alt={alt}
      containerClassName={`${SIZE_CLASSES[size]} shrink-0 ${circular ? 'rounded-full' : ''} ${className}`}
      imgClassName={imgClassName}
      fallback={
        <span className="flex h-full w-full items-center justify-center text-amber-700" aria-hidden="true">
          <PlaceholderGlyph />
        </span>
      }
    />
  )
}

function PlaceholderGlyph() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="16" cy="16" r="12" />
      <path d="M8 21c2.4-3.7 5.2-5.6 8-5.6s5.6 1.9 8 5.6M16 8v7M12.5 11.5h7" strokeLinecap="round" />
    </svg>
  )
}
