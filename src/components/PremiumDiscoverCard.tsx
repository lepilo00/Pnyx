import { Link } from 'react-router-dom'
import PremiumImage from '@/components/PremiumImage'
import type { Stop } from '@/lib/types'

interface PremiumDiscoverCardProps {
  imageSrc: string
  title: string
  description: string
  index: number
  to?: string
  stops?: Stop[]
}

// A chapter in one continuous editorial folio. The alternating alignment and
// shared vertical rule make the four stories read as one curated sequence.
export default function PremiumDiscoverCard({
  imageSrc,
  title,
  description,
  index,
  to,
  stops,
}: PremiumDiscoverCardProps) {
  const isEven = index % 2 === 0
  const chapter = String(index + 1).padStart(2, '0')
  const content = (
    <article className="group relative pb-14 last:pb-4">
      <div className={`relative ${isEven ? 'mr-7' : 'ml-7'}`}>
        <div className="relative overflow-hidden bg-[#eee4d1] shadow-[0_18px_45px_-30px_rgba(28,25,23,0.55)] ring-1 ring-stone-900/[0.07]">
          <PremiumImage
            src={imageSrc}
            containerClassName="aspect-[16/11]"
            imgClassName="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/10 via-transparent to-white/10" aria-hidden="true" />
        </div>
      </div>

      <div className={`relative z-[1] -mt-5 w-[88%] bg-[#fbf8f0]/95 px-5 py-5 shadow-[0_14px_35px_-30px_rgba(28,25,23,0.7)] backdrop-blur-[2px]
                       dark:bg-stone-900/95 ${isEven ? 'ml-auto border-l border-amber-600/35' : 'mr-auto border-r border-amber-600/35'}`}>
        <div className={`mb-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-500 ${isEven ? '' : 'justify-end'}`}>
          <span className="h-px w-7 bg-amber-600/60" aria-hidden="true" />
          <span>{chapter}</span>
        </div>
        <h3 className={`font-serif text-[1.35rem] font-bold leading-[1.18] text-stone-900 transition-colors duration-300 group-hover:text-amber-800 dark:text-stone-100 dark:group-hover:text-amber-400 ${isEven ? '' : 'text-right'}`}>
          {title}
        </h3>
        <p className={`mt-2 text-[0.875rem] leading-[1.7] text-stone-600 dark:text-stone-400 ${isEven ? '' : 'ml-auto text-right'}`}>
          {description}
        </p>
      </div>
    </article>
  )

  if (!to) return content

  return (
    <Link
      to={to}
      state={{ stops }}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-4 focus-visible:ring-offset-parchment-100"
    >
      {content}
    </Link>
  )
}
