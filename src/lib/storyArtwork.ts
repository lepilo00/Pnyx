import type { Stop } from './types'
import { isMainWalkStory } from './storyGroups'

// The four paid-story illustrations are shared with the premium presentation
// page. Match by paid-main-story order so admin reordering remains data-driven
// and titles/locales never influence presentation.
export function getStoryArtwork(story: Stop, stories: Stop[]): string | undefined {
  if (story.is_paid && isMainWalkStory(story)) {
    const paidMainStories = stories.filter((item) => item.is_paid && isMainWalkStory(item))
    const artworkIndex = paidMainStories.findIndex((item) => item.id === story.id)
    if (artworkIndex >= 0 && artworkIndex < 4) return `/premium/chapter-${artworkIndex + 1}.png`
  }
  return story.image_url
}
