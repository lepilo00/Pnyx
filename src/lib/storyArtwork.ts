import type { Stop } from './types'

// The four paid-story illustrations are shared with the premium presentation
// page. Match by paid-main-story order so admin reordering remains data-driven
// and titles/locales never influence presentation.
export function getStoryArtwork(story: Stop, stories: Stop[]): string | undefined {
  if (story.is_paid && story.story_type !== 'bonus' && !story.is_bonus) {
    const paidMainStories = stories.filter((item) => item.is_paid && item.story_type !== 'bonus' && !item.is_bonus)
    const artworkIndex = paidMainStories.findIndex((item) => item.id === story.id)
    if (artworkIndex >= 0 && artworkIndex < 4) return `/premium/chapter-${artworkIndex + 1}.png`
  }
  return story.image_url
}
