import type { Stop } from './types'
import { isBonusStory, isMainWalkStory } from './storyGroups'

// Local bonus artwork follows the admin-defined bonus-story order. The first
// two entries match the currently published stories; image_url always wins so
// an editor can override any slot without a code change.
const BONUS_STORY_ARTWORK = [
  '/bonus/dragged-to-democracy.png',
  '/bonus/pericles.png',
  '/bonus/fish-market.png',
  '/bonus/archer.png',
  '/bonus/symposium.png',
  '/bonus/theatre.png',
] as const

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

export function getBonusStoryArtwork(story: Stop, stories: Stop[]): string | undefined {
  if (story.image_url) return story.image_url
  if (!isBonusStory(story)) return undefined

  const bonusStories = stories.filter(isBonusStory)
  const artworkIndex = bonusStories.findIndex((item) => item.id === story.id)
  return artworkIndex >= 0 ? BONUS_STORY_ARTWORK[artworkIndex] : undefined
}
