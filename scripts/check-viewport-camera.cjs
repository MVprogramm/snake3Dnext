const fs = require('fs'), ts = require('typescript'), assert = require('node:assert/strict')
const THREE = require('three')
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, file)
const { cropCameraToViewport } = require('../src/assets/trainingArena/viewportCamera.ts')
const fixed = new THREE.PerspectiveCamera(38, 1672 / 941, .1, 240)
fixed.position.set(0, 50, 25); fixed.lookAt(0, -1, 0); fixed.zoom = .45
fixed.updateProjectionMatrix(); fixed.updateMatrixWorld(true)
const cropped = new THREE.PerspectiveCamera()
const projection = fixed.projectionMatrix.toArray()
// Include zoom out, maximum zoom, panning, following translation and the
// arena-local viewport dimensions used after the 90-degree CSS rotation.
for (const [vw, vh] of [[1672, 941], [2000, 800], [1200, 600], [1200, 1000]]) {
  for (const scale of [.5, 1, 4]) {
    const iw = Math.round(1672 * scale), ih = Math.round(941 * scale)
    for (const [panX, panY] of [[0, 20 * scale], [240, -120], [-200, 180]]) {
      fixed.position.x = scale; fixed.updateMatrixWorld(true)
      cropCameraToViewport(cropped, fixed, iw, ih, vw, vh, panX, panY)
      for (const position of [[0, 0, 0], [20, 0, 10], [-18, 2, -9]]) {
        const full = new THREE.Vector3(...position).project(fixed)
        const visible = new THREE.Vector3(...position).project(cropped)
        assert(Math.abs((vw / 2 + full.x * iw / 2 + panX) - (visible.x + 1) * vw / 2) < 1e-8)
        assert(Math.abs((vh / 2 - full.y * ih / 2 + panY) - (1 - visible.y) * vh / 2) < 1e-8)
      }
      assert.deepEqual(fixed.projectionMatrix.toArray(), projection)
      assert.equal(fixed.view, null)
    }
  }
}
console.log('PASS: viewport crop preserves pixel positions at 50–400%, with pan, following and rotated dimensions; calibration unchanged.')
