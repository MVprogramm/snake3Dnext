/**
 *  @module breakObstacles.ts Удаляет препятствия
 *     @function breakObstacles По заданным координатам удаляет препятствия
 */
import * as FIX from '../obstacles/obstaclesFix'
import * as X from '../obstacles/obstaclesX'
import * as Y from '../obstacles/obstaclesY'
import { getMovingHighlightedCells, resetHighlightedObstacleCells } from './highlightedObstacleCells'
/**
 *  Находит среди всех препятствий заданное и удаляет его
 * @param coord Координаты препятствия, которое удаляется
 */
function breakObstacles(coord: number[]): void {
  const [coordX, coordY] = coord
  FIX.setObstaclesFixCoord(
    FIX.getObstaclesFixCoord().filter(
      (coord) => coord[0] !== coordX || coord[1] !== coordY
    )
  )
  const keepX=getMovingHighlightedCells('x').map(([x,y])=>x!==coordX || y!==coordY)
  const keepY=getMovingHighlightedCells('y').map(([x,y])=>x!==coordX || y!==coordY)
  X.setObstaclesXCoord(X.getObstaclesXCoord().filter((_,i)=>keepX[i]))
  X.setObstaclesStepX(X.getObstaclesStepX().filter((_,i)=>keepX[i]))
  Y.setObstaclesYCoord(Y.getObstaclesYCoord().filter((_,i)=>keepY[i]))
  Y.setObstaclesStepY(Y.getObstaclesStepY().filter((_,i)=>keepY[i]))
  resetHighlightedObstacleCells()
}

export default breakObstacles
