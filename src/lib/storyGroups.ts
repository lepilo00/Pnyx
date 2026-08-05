import type { Stop } from './types'

export function isBonusStory(story: Stop): boolean {
  return story.story_type === 'bonus'
}

export function isMainWalkStory(story: Stop): boolean {
  return story.story_type === 'introduction' || story.story_type === 'main'
}

export function groupStories(stories: Stop[]) {
  return {
    mainStories: stories.filter(isMainWalkStory),
    bonusStories: stories.filter(isBonusStory),
  }
}

/** The numbered "main experience" stories, excluding the introduction. */
export function coreStories(stories: Stop[]): Stop[] {
  const uniqueIds = new Set<string>()
  return stories.filter((story) => {
    if (story.story_type !== 'main' || uniqueIds.has(story.id)) return false
    uniqueIds.add(story.id)
    return true
  })
}

/** Single source of truth for "has the listener finished this set of stories". */
export function isSequenceComplete(stories: Stop[], progress: Record<string, { completed?: boolean }>): boolean {
  return stories.length > 0 && stories.every((story) => progress[story.id]?.completed === true)
}

interface ProgressLike {
  position?: number
  duration?: number
  completed?: boolean
}

/** Fraction of a story listened, 0-1. A story marked completed counts as fully listened. */
function listenedRatio(state?: ProgressLike): number {
  if (!state) return 0
  if (state.completed) return 1
  if (!state.duration) return 0
  return Math.max(0, Math.min(1, (state.position ?? 0) / state.duration))
}

/** Has the listener sampled at least `minCount` of these stories to at least `minRatio` each? */
export function hasSampledStories(
  stories: Stop[],
  progress: Record<string, ProgressLike>,
  minCount: number,
  minRatio: number
): boolean {
  return stories.filter((story) => listenedRatio(progress[story.id]) >= minRatio).length >= minCount
}

/** Full listening order: the main walk followed by the bonus stories. */
export function orderStories(stories: Stop[]): Stop[] {
  const { mainStories, bonusStories } = groupStories(stories)
  return [...mainStories, ...bonusStories]
}

// Single source of truth for next/previous story resolution, shared by the
// on-page navigation, playlist auto-play and the Media Session handlers.
export function getAdjacentStory(
  stories: Stop[],
  currentId: string,
  direction: 1 | -1
): Stop | undefined {
  const index = stories.findIndex((story) => story.id === currentId)
  if (index < 0) return undefined
  return stories[index + direction]
}

/** Resolve the next autoplay item without crossing a story-type boundary. */
export function getNextStoryInSection(stories: Stop[], currentId: string): Stop | undefined {
  const currentStory = stories.find((story) => story.id === currentId)
  if (!currentStory?.story_type) return undefined

  const sectionStories = stories.filter((story) => story.story_type === currentStory.story_type)
  return getAdjacentStory(sectionStories, currentId, 1)
}
