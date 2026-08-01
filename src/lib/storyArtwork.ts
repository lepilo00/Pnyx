import type { Stop } from './types'
import { isBonusStory, isMainWalkStory } from './storyGroups'

// Explicitly match the available local artwork to the published bonus story.
// Story 9 currently has no dedicated image and therefore uses the generic
// bonus fallback. image_url always wins so an editor can override this map.
const BONUS_STORY_ARTWORK_BY_ORDER: Readonly<Record<number, string>> = {
  8: '/bonus/dragged-to-democracy.png',
  10: '/bonus/pericles.png',
  11: '/bonus/fish-market.png',
  12: '/bonus/theatre.png',
  13: '/bonus/symposium.png',
  14: '/bonus/archer.png',
}

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

export function getBonusStoryArtwork(story: Stop): string | undefined {
  if (story.image_url) return story.image_url
  if (!isBonusStory(story)) return undefined

  return BONUS_STORY_ARTWORK_BY_ORDER[story.order_index]
}
