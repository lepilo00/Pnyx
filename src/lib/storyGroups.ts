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
// Pass isLocked to skip locked stories (lock-screen controls, auto-play);
// omit it when a locked target should surface the paywall instead.
export function getAdjacentStory(
  stories: Stop[],
  currentId: string,
  direction: 1 | -1,
  isLocked: (story: Stop) => boolean = () => false
): Stop | undefined {
  const index = stories.findIndex((story) => story.id === currentId)
  if (index < 0) return undefined
  for (let i = index + direction; i >= 0 && i < stories.length; i += direction) {
    if (!isLocked(stories[i])) return stories[i]
  }
  return undefined
}
