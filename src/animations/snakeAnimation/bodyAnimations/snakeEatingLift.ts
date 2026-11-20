import { appleCONFIG } from '../../../config/appleConfig'

// Lift the larger head to the elevated apple; vertical coordinates are cell units.
export const EATING_HEAD_HEIGHT = appleCONFIG.zLocation + .15
export const EATING_HEAD_RESPONSE = 50
export const MAX_EATING_BODY_SEGMENTS = 4

export function getEatingLiftHeights(previous: number[], raising: boolean, speed: number, delta: number): number[] {
  const headBlend = 1 - Math.exp(-EATING_HEAD_RESPONSE * Math.max(1, speed) * delta)
  const followBlend = 1 - Math.exp(-12 * Math.max(1, speed) * delta)
  return previous.map((height, index) => {
    if (index > MAX_EATING_BODY_SEGMENTS) return 0
    const target = index === 0 ? (raising ? EATING_HEAD_HEIGHT : 0) : previous[index - 1] * .55
    const blend = index === 0 ? headBlend : followBlend
    return height + (target - height) * blend
  })
}
