import type { StoryProgress } from './audioProgress'
import type { Stop } from './types'

interface ProgressSnapshot {
  lastStoryId?: string
  stories: Record<string, StoryProgress>
}

// Resume an unfinished last story first. If it was completed, continue with
// the first unfinished story after it, then fall back to the first unfinished
// story in the guide. Access is deliberately handled by the destination page:
// selecting the next locked story should open the existing purchase flow.
export function getResumeStory(stories: Stop[], progress: ProgressSnapshot): Stop | undefined {
  if (!stories.length) return undefined
  const latestStoryId = [...stories]
    .filter((story) => progress.stories[story.id]?.updatedAt)
    .sort((a, b) => progress.stories[b.id].updatedAt.localeCompare(progress.stories[a.id].updatedAt))[0]?.id
  const lastIndex = latestStoryId ? stories.findIndex((story) => story.id === latestStoryId) : -1
  if (lastIndex >= 0 && !progress.stories[stories[lastIndex].id]?.completed) return stories[lastIndex]
  if (lastIndex >= 0) {
    const nextUnfinished = stories.slice(lastIndex + 1).find((story) => !progress.stories[story.id]?.completed)
    if (nextUnfinished) return nextUnfinished
  }
  return stories.find((story) => !progress.stories[story.id]?.completed) ?? stories[Math.max(0, lastIndex)] ?? stories[0]
}
