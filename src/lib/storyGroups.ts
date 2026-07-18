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
