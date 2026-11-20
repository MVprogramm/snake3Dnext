import { SnakeHeadCoord } from '../../types/snakeTypes'
import { getHighlightedObstacleCells, hasHighlightedObstacleSnapshot } from '../obstacles/highlightedObstacleCells'
import snakeCoordCompare from './snakeCoordCompare'
import { isContact } from './isContact'
import { getBreaksObstacles } from '../bonuses/bonusSnakeBreaksObstacles'
import isBroken from './isBroken'

// Only the currently highlighted cell is dangerous, never a future target or
// the interpolated chevrons that may already extend outside that cell.
function snakeObstacleContactEvent(snakeHead: SnakeHeadCoord): SnakeHeadCoord {
  // With live cell highlights, check the animated head when it actually enters
  // the cell rather than rejecting its planned next step in advance.
  if (hasHighlightedObstacleSnapshot()) return snakeHead
  let contact = false
  for (const cell of getHighlightedObstacleCells()) {
    ;[snakeHead, contact] = snakeCoordCompare(snakeHead, cell, contact)
    if (contact) {
      return getBreaksObstacles() ? isBroken(snakeHead) : isContact(snakeHead, 'obstacle')
    }
  }
  return snakeHead
}

export default snakeObstacleContactEvent
