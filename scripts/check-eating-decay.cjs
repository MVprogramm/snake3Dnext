const fs = require('fs'), ts = require('typescript'), assert = require('node:assert/strict')
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, file)
const { SmoothSnakeTrail } = require('../src/animations/snakeAnimation/smoothSnakeTrail.ts')
const { getEatingLiftHeights, EATING_HEAD_HEIGHT } = require('../src/animations/snakeAnimation/bodyAnimations/snakeEatingLift.ts')
for (const count of [1, 2, 3, 8, 20]) {
  for (const speed of [1, 3, 5]) {
    const trail = new SmoothSnakeTrail(), peaks = Array(count).fill(0)
    let heights = Array(count + 2).fill(0)
    for (let frame = 0; frame < 360; frame++) {
      heights = getEatingLiftHeights(heights, frame >= 30 && frame < 90, speed, 1 / 60)
      const source = heights.map((z, i) => [frame * speed / 60 - i, 0, z])
      const poses = trail.update(source, count)
      assert.equal(poses.at(-1).z, 0)
      assert.equal(poses.at(-1).pitch, 0)
      poses.forEach((pose, i) => {
        assert(Number.isFinite(pose.z) && pose.z >= 0)
        peaks[i] = Math.max(peaks[i], pose.z)
        if (i >= 5) { assert.equal(pose.z, 0); assert.equal(pose.pitch, 0) }
      })
      assert(heights.slice(5).every(z => z === 0), 'source lift must stop after four body segments')
    }
    if (count >= 8) {
      assert(peaks[0] > EATING_HEAD_HEIGHT * .8, 'preserve head reach')
      assert(peaks[1] > peaks[2] && peaks[2] > peaks[3] && peaks[3] > peaks[4], 'quick taper through the first four body segments')
      assert(peaks[4] < peaks[0] * .15, 'fourth body segment must be nearly grounded')
    }
  }
}
console.log('PASS: head reach, rapid four-body-segment taper, no later lift/pitch, grounded short-snake tail at speeds 1/3/5.')
