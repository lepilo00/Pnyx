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
