import { EATING_HEAD_HEIGHT, EATING_HEAD_RESPONSE } from '../bodyAnimations/snakeEatingLift'
import { SnakeSteps } from '../../../types/animationTypes'
import { getPositionHead, setPositionHead } from './snakeHeadProps'
import { SystemConfig } from '../../../config/systemConfig'
import { getCounterHead, getHeadVerticalStep } from './snakeHeadLocation'
import { getTimerStep } from '../../../engine/time/timerStepPerLevel'
import { foodEatenAnimation } from './foodEatenAnimation'
import { snakeTongueMoving } from './snakeTongueMoving'
import { MathUtils } from 'three'

let moveSpeed = 1

export const snakeHeadMoving = (steps: SnakeSteps, delta: number) => {
  const { currentStepX, currentStepY } = steps
  const currentStepZ = getHeadVerticalStep()

  foodEatenAnimation(delta)
  snakeTongueMoving(steps, delta)

  const [counterHeadX, counterHeadY] = getCounterHead()
  if (counterHeadX === 0 && counterHeadY === 0) moveSpeed = getTimerStep()
  const positionHead = getPositionHead()

  positionHead[0] += (currentStepX * moveSpeed) / SystemConfig.FPS
  positionHead[1] += (currentStepY * moveSpeed) / SystemConfig.FPS
  const targetZ = currentStepZ > 0 ? EATING_HEAD_HEIGHT : 0
  positionHead[2] = MathUtils.damp(positionHead[2], targetZ, EATING_HEAD_RESPONSE * Math.max(1, moveSpeed), delta)
  if (counterHeadX === 0 && counterHeadY === 0) {
    positionHead[0] = Math.round(positionHead[0])
    positionHead[1] = Math.round(positionHead[1])
  }

  setPositionHead(positionHead)
}
