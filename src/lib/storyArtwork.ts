import type { Stop } from './types'
import { isBonusStory } from './storyGroups'

// Explicitly match the available local artwork to the published bonus story.
// image_url always wins so an editor can override this map.
const BONUS_STORY_ARTWORK_BY_ORDER: Readonly<Record<number, string>> = {
  8: '/bonus/dragged-to-democracy.png',
  9: '/bonus/how-athens-became-democracy.png',
  10: '/bonus/pericles.png',
  11: '/bonus/sausage-seller.png',
  12: '/bonus/theatre.png',
  13: '/bonus/symposium.png',
  14: '/bonus/archer.png',
}

// Match the four main-story illustrations by main-story order so admin
// reordering remains data-driven and titles/locales never influence presentation.
export function getStoryArtwork(story: Stop, stories: Stop[]): string | undefined {
  if (story.story_type === 'main') {
    const mainStories = stories.filter((item) => item.story_type === 'main')
    const artworkIndex = mainStories.findIndex((item) => item.id === story.id)
    if (artworkIndex >= 0 && artworkIndex < 4) return `/premium/chapter-${artworkIndex + 1}.png`
  }
  return story.image_url
}

export function getBonusStoryArtwork(story: Stop): string | undefined {
  if (story.image_url) return story.image_url
  if (!isBonusStory(story)) return undefined

  return BONUS_STORY_ARTWORK_BY_ORDER[story.order_index]
}
