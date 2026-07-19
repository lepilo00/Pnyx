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
}

// The grouped story list (MAIN WALK / BONUS STORIES with per-section n/n
// counters). Shared between the "All stories" sheet and the playlist view.
export default function StorySectionList({ stories, currentId, progress, isLocked, onSelect, renderAfterItem }: StorySectionListProps) {
  const { t } = useTranslation()
  const { mainStories, bonusStories } = groupStories(stories)
  const sections = [
    { key: 'main', title: t('listening.mainWalk'), stories: mainStories },
    { key: 'bonus', title: t('listening.bonusStories'), stories: bonusStories },
  ].filter((section) => section.stories.length)

  return (
    <>
      {sections.map((section) => (
        <section key={section.key} className="mb-3">
          <div className="flex items-center justify-between px-3 pb-1 pt-3">
            <h3 className={`text-[10px] font-bold uppercase tracking-[0.18em] ${section.key === 'bonus' ? 'text-amber-700' : 'text-stone-500'}`}>{section.title}</h3>
            <span className="text-[10px] text-stone-400">{section.stories.filter((story) => progress[story.id]?.completed).length}/{section.stories.length}</span>
          </div>
          {section.stories.map((story) => (
            <div key={story.id} id={`story-${story.id}`}>
              <StoryListItem
                story={story}
                stories={stories}
                progress={progress[story.id]}
                locked={isLocked(story)}
                selected={story.id === currentId}
                onSelect={() => onSelect(story)}
              />
              {renderAfterItem?.(story)}
            </div>
          ))}
        </section>
      ))}
    </>
  )
}
