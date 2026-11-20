/**
 * @module contactBorderObstacle.ts Управляет контактом препятствий с краями поля
 *    @function contactBorderObstacle Изменяет направление движение препятствий
 */
import { obstacleContactProps } from '../../types/obstacleTypes'
import { isPlayableCell } from '../field/fieldGeometry'
import { getObstaclesXCoord } from './obstaclesX'
/**
 * При контакте с краем поля меняет направление движения препятствия
 * @param props объект с аргументами функции, проверяющей контакты препятствий
 * @description
 *  1. Если препятствие касается края поля:
 *      - определяется положение края (верхний/нижний, левый/правый)
 *      - шаг изменяется на 1 или -1 в зависимости от положения края
 * @return измененный шаг препятствия, коснувшегося края поля
 */
function contactBorderObstacle(props: obstacleContactProps): number {
  const { i, twist, coord, step } = props

  const next = [...coord[i]]
  next[twist[0]] += step[i]
  if (!isPlayableCell(next[0], next[1])) step[i] = -step[i]

  return step[i]
}

export default contactBorderObstacle
