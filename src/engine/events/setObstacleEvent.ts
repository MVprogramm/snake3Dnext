/**
 * @module setObstacleEvent.ts Генерирует координаты препятствий всех типов
 *    @function setObstacleEvent Каждое препятствие занимает отдельную ячейку
 */
import * as X from '../obstacles/obstaclesX'
import * as Y from '../obstacles/obstaclesY'
import * as FIX from '../obstacles/obstaclesFix'
import getFreeCell from '../field/getFreeCell'
import { getField, getFieldRows } from '../field/fieldPerLevel'
import cellsBookingAroundSnake from '../snake/cellsBookingAroundSnake'
import selectionObstacleType from '../obstacles/selectionObstacleType'
import { addEvent } from '../protocol/protocol'
import cellsBooking from '../field/cellsBooking'
import { cellsAroundObstacle } from '../field/cellsAroundObstacle'
/**
 * Генерирует координаты препятствий всех типов в свободных ячейках
 * @description
 * 1. В центре поля резервируется 9 клеток под змейку и ее первые ходы
 * 2. Последовательно генерируются координаты препятствий типов "x", "y" и "fix"
 * 3. Препятствия размещаются не ближе чем на 2 клетки друг от друга (3x3 зона)
 * 4. Сгенерированные координаты препятствий и их зоны заносятся в booking
 * 5. Событие генерации заносится в протокол
 * 6. Координаты препятствий каждого типа хранятся в соответствующих массивах
 * 7. Если не все препятствия разместились, повторяет генерацию (макс. 20 попыток)
 */
function setObstacleEvent(): void {
  const MAX_ATTEMPTS = 20
  let attempt = 0
  let isSuccessful = false

  while (attempt < MAX_ATTEMPTS && !isSuccessful) {
    attempt += 1

    // Сброс препятствий перед новой попыткой
    if (attempt > 1) {
      console.log(
        `\n🔄 Повторная генерация препятствий (попытка ${attempt}/${MAX_ATTEMPTS})...`,
      )
      X.setObstaclesXCoord([])
      Y.setObstaclesYCoord([])
      FIX.setObstaclesFixCoord([])
    }

    let booking: number[][] = []
    const snakeCoord = Math.round(getField() / 2)
    const fieldSize = getField()
    booking = [...cellsBooking(snakeCoord, Math.round(getFieldRows() / 2))]

    // Отслеживание статистики размещения
    const placementStats = {
      x: { total: 0, placed: 0 },
      y: { total: 0, placed: 0 },
      fix: { total: 0, placed: 0 },
    }

    for (const type of ['x', 'y', 'fix'] as const) {
      const obstaclesDirection = selectionObstacleType(type)
      placementStats[type].total = obstaclesDirection.length

      // Резервируем зоны вокруг уже расположенных препятствий
      if (type === 'y') {
        // Добавляем координаты препятствий X
        booking = booking.concat([...X.getObstaclesXCoord()])
        // Добавляем зоны вокруг препятствий X (2 клетки расстояния)
        X.getObstaclesXCoord().forEach((coord) => {
          booking = booking.concat(cellsAroundObstacle(coord[0], coord[1], fieldSize))
        })
      }

      if (type === 'fix') {
        // Добавляем координаты препятствий Y
        booking = booking.concat([...Y.getObstaclesYCoord()])
        // Добавляем зоны вокруг препятствий Y (2 клетки расстояния)
        Y.getObstaclesYCoord().forEach((coord) => {
          booking = booking.concat(cellsAroundObstacle(coord[0], coord[1], fieldSize))
        })
      }

      const obstacles: number[][] = []
      const failedAttempts: { index: number; reason: string }[] = []

      for (let index = 0; index < obstaclesDirection.length; index += 1) {
        const freeCell = getFreeCell(booking)

        if (!freeCell) {
          failedAttempts.push({
            index,
            reason: 'Нет свободных ячеек на поле',
          })
          continue
        }

        // Проверяем коллизии с уже размещёнными препятствиями текущего типа
        const [obstacleX, obstacleY] = freeCell
        const collision = obstacles.some(
          (obs) => obs[0] === obstacleX && obs[1] === obstacleY,
        )

        if (collision) {
          failedAttempts.push({
            index,
            reason: `Коллизия с уже размещённым препятствием на [${obstacleX}, ${obstacleY}]`,
          })
          continue
        }

        // Проверяем коллизии с препятствиями других типов
        const allPlacedObstacles = [
          ...X.getObstaclesXCoord(),
          ...Y.getObstaclesYCoord(),
          ...FIX.getObstaclesFixCoord(),
        ]
        const crossTypeCollision = allPlacedObstacles.some(
          (obs) => obs[0] === obstacleX && obs[1] === obstacleY,
        )

        if (crossTypeCollision) {
          failedAttempts.push({
            index,
            reason: `Коллизия с препятствием другого типа на [${obstacleX}, ${obstacleY}]`,
          })
          continue
        }

        // Успешное размещение
        addEvent({
          name: `set obstacle ${type === 'fix' ? 'fix' : 'moving ' + type}`,
          value: `${obstacleX} : ${obstacleY} ${type !== 'fix' ? 'step ' : ''}${
            type === 'x'
              ? X.getObstaclesStepX()[index]
              : type === 'y'
                ? Y.getObstaclesStepY()[index]
                : ''
          }`,
        })

        // Резервируем саму ячейку препятствия
        booking.push([obstacleX, obstacleY])
        // Резервируем зону вокруг препятствия (2 клетки во все стороны)
        booking = booking.concat(cellsAroundObstacle(obstacleX, obstacleY, fieldSize))
        obstacles.push([obstacleX, obstacleY])
        placementStats[type].placed += 1
      }

      // Установка размещённых препятствий
      if (type === 'x') X.setObstaclesXCoord(obstacles)
      if (type === 'y') Y.setObstaclesYCoord(obstacles)
      if (type === 'fix') FIX.setObstaclesFixCoord(obstacles)

      // Вывод информации о размещении (только при первой попытке или при ошибке)
      if (attempt === 1 || failedAttempts.length > 0) {
        if (failedAttempts.length > 0) {
          console.warn(
            `⚠️ Препятствия типа "${type}" не полностью размещены: ${placementStats[type].placed}/${placementStats[type].total}`,
          )
          failedAttempts.forEach(({ index, reason }) => {
            console.warn(`   └─ Препятствие #${index + 1}: ${reason}`)
          })
        } else {
          console.log(
            `✓ Препятствия типа "${type}" успешно размещены: ${placementStats[type].placed}/${placementStats[type].total}`,
          )
        }
      }
    }

    // Проверка успешности размещения
    const totalNeeded =
      placementStats.x.total + placementStats.y.total + placementStats.fix.total
    const totalPlaced =
      placementStats.x.placed + placementStats.y.placed + placementStats.fix.placed

    if (totalPlaced === totalNeeded) {
      isSuccessful = true
      console.log(`✓ Все ${totalPlaced} препятствий успешно размещены на поле.`)
    } else if (attempt < MAX_ATTEMPTS) {
      console.warn(
        `⚠️ Попытка ${attempt}/${MAX_ATTEMPTS}: размещено ${totalPlaced}/${totalNeeded} препятствий. ` +
          `Повторяю генерацию...`,
      )
    }
  }

  // Итоговый отчёт при неудаче
  if (!isSuccessful) {
    console.error(
      `❌ КРИТИЧЕСКАЯ ОШИБКА: Не удалось разместить все препятствия после ${MAX_ATTEMPTS} попыток. ` +
        `Генерация уровня не может быть завершена.`,
    )
  }
}

export default setObstacleEvent
