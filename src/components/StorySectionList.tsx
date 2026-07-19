import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import StoryListItem from '@/components/StoryListItem'
import type { Stop } from '@/lib/types'
import type { StoryProgress } from '@/lib/audioProgress'
import { groupStories } from '@/lib/storyGroups'

interface StorySectionListProps {
  stories: Stop[]
  currentId?: string
  progress: Record<string, StoryProgress>
  isLocked: (story: Stop) => boolean
  onSelect: (story: Stop) => void
  /** Optional slot rendered directly under a story's row (e.g. inline details for the active story). */
  renderAfterItem?: (story: Stop) => ReactNode
  /** Per-section n/n counters — hidden on the playlist page where the hero already shows overall progress. */
  showSectionCounts?: boolean
  /** Story currently audible — its card shows the animated equalizer. */
  playingId?: string
  /** When set, the active story's card gets an expand chevron controlling its details. */
  onToggleDetails?: (story: Stop) => void
  detailsOpenId?: string
  /** 'premium' refines section labels (gold small-caps) and opens up vertical rhythm. */
  tone?: 'default' | 'premium'
}

// The grouped story list (MAIN WALK / BONUS STORIES). Shared between the
// "All stories" sheet and the playlist view.
export default function StorySectionList({
  stories,
  currentId,
  progress,
  isLocked,
  onSelect,
  renderAfterItem,
  showSectionCounts = true,
  playingId,
  onToggleDetails,
  detailsOpenId,
  tone = 'default',
}: StorySectionListProps) {
  const { t } = useTranslation()
  const { mainStories, bonusStories } = groupStories(stories)
  const sections = [
    { key: 'main', title: t('listening.mainWalk'), stories: mainStories },
    { key: 'bonus', title: t('listening.bonusStories'), stories: bonusStories },
  ].filter((section) => section.stories.length)
  const premium = tone === 'premium'

  return (
    <>
      {sections.map((section) => (
        <section key={section.key} className={premium ? 'mb-6' : 'mb-3'}>
          <div className={`flex items-center justify-between px-3 ${premium ? 'pb-2 pt-5' : 'pb-1 pt-3'}`}>
            <h3 className={`text-[10px] font-bold uppercase tracking-[0.18em] ${premium || section.key === 'bonus' ? 'text-amber-700' : 'text-stone-500'}`}>{section.title}</h3>
            {showSectionCounts && (
              <span className="text-[10px] text-stone-400">{section.stories.filter((story) => progress[story.id]?.completed).length}/{section.stories.length}</span>
            )}
          </div>
          <div className={premium ? 'space-y-2.5 px-1' : 'space-y-1'}>
            {section.stories.map((story) => (
              <div key={story.id} id={`story-${story.id}`} className="story-anchor scroll-mt-24">
                <StoryListItem
                  story={story}
                  stories={stories}
                  progress={progress[story.id]}
                  locked={isLocked(story)}
                  selected={story.id === currentId}
                  onSelect={() => onSelect(story)}
                  isPlaying={playingId === story.id}
                  onToggleDetails={onToggleDetails && story.id === currentId ? () => onToggleDetails(story) : undefined}
                  detailsOpen={detailsOpenId === story.id}
                />
                {renderAfterItem?.(story)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
