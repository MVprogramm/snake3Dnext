import arena from '../field/arena.json'
import { toFieldScene } from '../field/fieldGeometry'
import { getHighlightedObstacleCells, hasHighlightedObstacleSnapshot } from '../obstacles/highlightedObstacleCells'
import { getSnakeHeadParams, getSnakeBodyCoord, getPreviousSnake, setSnakeHeadParams, setSnakeBodyCoord } from '../snake/snake'
import { clearPendingSnakeHead, hasPendingSnakeHead } from '../snake/snakeStepPhase'
import { checkTimerWorking } from '../time/isTimer'
import { checkMistake } from '../lives/isMistake'
import { getBreaksObstacles } from '../bonuses/bonusSnakeBreaksObstacles'
import breakObstacles from '../obstacles/breakObstacles'
import { addEvent } from '../protocol/protocol'
import { isContact, breakContact } from './isContact'
import { getSnakeUnitPosition, getSnakeUnitRotation, setSnakeUnitPosition } from '../../animations/snakeAnimation/bodyAnimations/snakeBodyProps'
import { setDiff } from '../../animations/snakeAnimation/bodyAnimations/snakeDiff'
import { setSnakePreviousStepsArray } from '../../animations/snakeAnimation/snakeAnimation'
import { setSnakeBodyLocation } from '../../animations/snakeAnimation/bodyAnimations/snakeBodyLocation'
import { getCounterUnits } from '../../animations/snakeAnimation/bodyAnimations/snakeBodyMoving'
import { resetHeadStepProgress } from '../../animations/snakeAnimation/headAnimations/snakeHeadLocation'
import { setPositionHead } from '../../animations/snakeAnimation/headAnimations/snakeHeadProps'
import { resetSnakePositionCounter } from '../snake/setSnakePosition'

// Called after head animation, with the same cell snapshot that draws the frames.
export function checkHighlightedHeadContact(): boolean {
  if (!hasHighlightedObstacleSnapshot() || !checkTimerWorking() || checkMistake()) return false
  const position = getSnakeUnitPosition()[0]
  if (!position) return false
  const cell = [Math.floor(position[0] + (arena.columns + 1) / 2 + .5),
    Math.floor(position[1] + (arena.rows + 1) / 2 + .5)]
  if (!getHighlightedObstacleCells().some(([x,y])=>x===cell[0] && y===cell[1])) return false
  if (getBreaksObstacles()) {
    breakObstacles(cell)
    addEvent({name:'bonus snakeBreaksObstacles',value:`obstacle ${cell[0]}:${cell[1]} is broken`})
    return false
  }
  const currentBody = getSnakeBodyCoord()
  const previous = hasPendingSnakeHead() ? getPreviousSnake() : currentBody
  const body = [...previous.map(coord=>[...coord]), ...currentBody.slice(previous.length).map(coord=>[...coord])]
  breakContact()
  setSnakeHeadParams(isContact({...getSnakeHeadParams()},'obstacle'))
  clearPendingSnakeHead()
  setSnakeBodyCoord(body)
  const poses = body.map(coord=>[...toFieldScene(coord),0])
  const count=Math.max(poses.length,getSnakeUnitPosition().length,getSnakeUnitRotation().length)
  while(poses.length<count){
    const last=poses[poses.length-1],front=poses[Math.max(0,poses.length-2)]
    poses.push([last[0]+(last[0]-front[0]),last[1]+(last[1]-front[1]),0])
  }
  poses.forEach((_,i)=>{setDiff({diffX:0,diffY:0},i);setDiff({diffX:0,diffY:0},i)})
  setSnakePreviousStepsArray(poses.map(()=>({previousStepX:0,previousStepY:0})))
  setSnakeUnitPosition(poses)
  setSnakeBodyLocation(poses.map(pose=>pose.slice(0,2)))
  if (poses[0]) setPositionHead(poses[0])
  getCounterUnits().forEach(counter=>{counter[0]=0;counter[1]=0})
  resetHeadStepProgress()
  resetSnakePositionCounter()
  return true
}
