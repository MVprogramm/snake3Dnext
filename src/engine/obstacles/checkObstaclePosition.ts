import { isPlayableCell } from '../field/fieldGeometry'
/**
 * @module checkObstaclePosition.ts Проверяет доступность ячейки для препятствия
 *    @function checkObstaclePosition Если ячейка доступна возвращает true
 */
import cellCheck from '../field/cellCheck'
/**
 * Проверяет все условия, при которых ячейка доступна для препятствий
 * @param pos координаты проверяемой ячейки
 * @description если ячейка не занята и лежит внутри поля, она доступна
 * @returns true, если ячейка доступна, и false, если нет
 */
function checkObstaclePosition(pos: number[]): boolean {
  let isCorrect = isPlayableCell(pos[0], pos[1])
  if (!cellCheck(pos, { ignoreSnakeReserveTail: true })) isCorrect = false

  return isCorrect
}

export default checkObstaclePosition
