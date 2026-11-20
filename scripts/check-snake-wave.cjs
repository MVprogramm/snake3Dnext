const fs = require('fs'), ts = require('typescript'), assert = require('node:assert/strict');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, file);
const { applyBodyWave, SmoothSnakeTrail } = require('../src/animations/snakeAnimation/smoothSnakeTrail.ts');
for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
  const forward = { x: -Math.sin(yaw), y: Math.cos(yaw) };
  const base = Array.from({ length: 6 }, (_, index) => ({ x: -index * forward.x, y: -index * forward.y, z: index === 5 ? 0 : .3, yaw, pitch: index === 5 ? 0 : .1 }));
  const snapshot = JSON.stringify(base);
  const a = applyBodyWave(base, 1), b = applyBodyWave(base, 2);
  assert.deepEqual(a[0], base[0]);
  assert(a.slice(1).some((pose, i) => Math.hypot(pose.x - b[i + 1].x, pose.y - b[i + 1].y) > .02));
  for (let i = 1; i < a.length; i++) {
    const dx = a[i].x - base[i].x, dy = a[i].y - base[i].y;
    assert(Math.abs(dx * forward.x + dy * forward.y) < 1e-9);
    assert(Math.hypot(dx, dy) <= .120001);
    assert.equal(a[i].z, base[i].z); assert.equal(a[i].pitch, base[i].pitch);
  }
  assert.equal(JSON.stringify(base), snapshot);
}
const trail = new SmoothSnakeTrail();
const source = y => Array.from({ length: 10 }, (_, index) => [0, y - index, index === 0 ? .9 : .2]);
trail.update(source(0), 7);
let poses;
for (let frame = 1; frame <= 240; frame++) {
  poses = trail.update(source(frame / 60), 7);
  assert.equal(poses.at(-1).z, 0); assert.equal(poses.at(-1).pitch, 0);
}
assert(poses.slice(1).some(pose => Math.abs(pose.x) > .02));
const paused = trail.update(source(4), 7);
for (let frame = 0; frame < 30; frame++) assert.deepEqual(trail.update(source(4), 7), paused);
const reset = trail.update(Array.from({ length: 10 }, (_, i) => [0, -i, 0]), 7, true);
assert(reset.every(pose => Math.abs(pose.x) < 1e-9));
console.log('PASS: transverse wave in all four directions; progressing phase; head fixed to path; amplitude bound; unchanged lift/grounded tail; pause stability and level reset.');
