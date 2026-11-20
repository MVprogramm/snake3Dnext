const fs = require('fs'), path = require('path'), ts = require('typescript'), assert = require('node:assert/strict'), THREE = require('three')
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, file)
global.localStorage = { setItem() {} }; global.location = { reload() {} }
const repository = path.resolve('src/services/gameSessionRepository.ts')
require.cache[repository] = { id: repository, filename: repository, loaded: true, exports: { saveGameSession: async () => {} } }
require('../src/engine/events/setInitialLevelOfGame.ts').default(1)
const X = require('../src/engine/obstacles/obstaclesX.ts'), Y = require('../src/engine/obstacles/obstaclesY.ts')
const fixed = require('../src/engine/obstacles/obstaclesFix.ts')
const { isPlayableCell } = require('../src/engine/field/fieldGeometry.ts')
const initial = [...X.getObstaclesXCoord(), ...Y.getObstaclesYCoord(), ...fixed.getObstaclesFixCoord()]
assert.equal(X.getObstaclesXCoord().length, 2); assert.equal(Y.getObstaclesYCoord().length, 2)
assert.equal(fixed.getObstaclesFixCoord().length, 1)
assert(initial.every(([x,y]) => isPlayableCell(x,y)))
assert.equal(new Set(initial.map(cell => cell.join(':'))).size, 5)
X.setObstaclesXCoord([[43,6],[12,8]]); X.setObstaclesStepX([1,1])
Y.setObstaclesYCoord([[12,23],[28,6]]); Y.setObstaclesStepY([1,1])
fixed.setObstaclesFixCoord([[36,18]])
require('../src/engine/food/food.ts').setFoodCoord([22,20])
const move = require('../src/engine/obstacles/moveObstacles.ts').default
move('x', true); move('y', true)
assert.deepEqual(X.getObstaclesXCoord(), [[42,6],[13,8]])
assert.deepEqual(Y.getObstaclesYCoord(), [[12,22],[28,7]])
assert.deepEqual(X.getObstaclesStepX(), [-1,1]); assert.deepEqual(Y.getObstaclesStepY(), [-1,1])
// Evaluate the actual glyph component with a minimal memo hook, then compare
// its forward direction with the real engine steps after a boundary bounce.
const output = { exports: {} }
const code = ts.transpileModule(fs.readFileSync('src/assets/obstacleSymbols/MovingObstacleSymbol.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText
new Function('require','exports',code)(name => {
  if (name === 'react') return { useMemo: factory => factory() }
  if (['./ObstacleGlow', './AnimatedObstacleRing', './BlinkingObstacleGlyph'].includes(name)) return { __esModule: true, default() {} }
  return require(name)
}, output.exports)
for (const [axis, steps] of [['x',X.getObstaclesStepX()], ['y',Y.getObstaclesStepY()]]) {
  for (const direction of steps) {
    const glyph = output.exports.default({ axis, direction })
    const forward = new THREE.Vector3(1,0,0).applyEuler(new THREE.Euler(...glyph.props.rotation))
    assert(Math.abs(forward[axis] - direction) < 1e-9)
    assert(Math.abs(forward[axis === 'x' ? 'y' : 'x']) < 1e-9)
    assert.equal(glyph.props.children.length, 3)
  }
}
for (let tick=0; tick<20; tick++) {
  move('x',true); move('y',true)
  assert(X.getObstaclesXCoord().every(([x,y],i) => isPlayableCell(x,y) && y === [6,8][i]))
  assert(Y.getObstaclesYCoord().every(([x,y],i) => isPlayableCell(x,y) && x === [12,28][i]))
}
console.log('PASS: level-one placement, two obstacles per axis, movement, boundary reversal, glyph direction/three chevrons and playable bounds.')
