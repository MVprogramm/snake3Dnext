import { SnakeHeadCoord } from '../../types/snakeTypes'
import { getCrossesBorders } from '../bonuses/bonusSnakeCrossesBorders'
import { getBorderDestination, isPlayableCell } from '../field/fieldGeometry'
import { isContact } from './isContact'
import isCross from './isCross'
import { getSnakeStepCells } from './snakeStepCollision'

function snakeBorderContactEvent(head: SnakeHeadCoord): SnakeHeadCoord {
  let previous: [number, number] = [
    head.snakeHeadCoordX - head.snakeHeadStepX,
    head.snakeHeadCoordY - head.snakeHeadStepY,
  ]
  for (const [x, y] of getSnakeStepCells(head)) {
    if (!isPlayableCell(x, y)) {
      if (getCrossesBorders()) {
        const destination = getBorderDestination(previous[0], previous[1], head.snakeHeadStepX, head.snakeHeadStepY)
        if (destination) {
          head.snakeHeadCoordX = destination[0]
          head.snakeHeadCoordY = destination[1]
          return isCross(head)
        }
      }
      head.snakeHeadCoordX = previous[0]
      head.snakeHeadCoordY = previous[1]
      return isContact(head, 'border')
    }
    previous = [x, y]
  }
  return head
}

export default snakeBorderContactEvent
