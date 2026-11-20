const fs = require('fs'), path = require('path'), ts = require('typescript'), assert = require('node:assert/strict'), THREE = require('three')
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, file)
const { RandomBlink } = require('../src/assets/obstacleSymbols/randomBlink.ts')
const seeded = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
const blinks = [1, 23, 456].map(seed => new RandomBlink(seeded(seed)))
const patterns = blinks.map(() => [])
for (let frame=0;frame<1200;frame++) blinks.forEach((blink,i) => patterns[i].push(blink.update(1/60)))
for (const pattern of patterns) {
  assert(pattern.includes(true) && pattern.includes(false))
  const darkRuns = []; let dark = 0
  for (const value of pattern) { if (!value) dark++; else if (dark) { darkRuns.push(dark); dark=0 } }
  assert(darkRuns.every(length => length>=5 && length<=14), 'brief dark flashes, not disappearing obstacles')
  assert(new Set(darkRuns).size>1, 'flash intervals must vary')
}
assert.notDeepEqual(patterns[0],patterns[1]);assert.notDeepEqual(patterns[1],patterns[2])
const callbacks = [], refs = []
function load(file) {
  const output={exports:{}}
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText
  new Function('require','exports',code)(name=>{
    if(name==='react')return {useMemo:factory=>factory(),useRef:value=>{const ref={current:value};refs.push(ref);return ref}}
    if(name==='@react-three/fiber')return {useFrame:callback=>callbacks.push(callback)}
    return require(name.startsWith('.')?path.resolve(path.dirname(file),name):name)
  },output.exports)
  return output.exports.default
}
const Ring=load(path.resolve('src/assets/obstacleSymbols/AnimatedObstacleRing.tsx'))
const ringElement=Ring({})
assert.equal(callbacks.length,0,'solid ring must not register rotation animation')
assert.deepEqual(ringElement.props.children.props.children[0].props.args,[.31,.4,64])
const Glyph=load(path.resolve('src/assets/obstacleSymbols/BlinkingObstacleGlyph.tsx'))
const savedRandom=Math.random;Math.random=seeded(192)
try {for(let i=0;i<3;i++)Glyph({children:null,position:[i*.18,0,0]})} finally {Math.random=savedRandom}
refs.forEach(ref=>{ref.current=new THREE.Group()})
let independent=false
for(let frame=0;frame<600;frame++){
  callbacks.forEach(callback=>callback(null,1/60))
  if(new Set(refs.map(ref=>ref.current.visible)).size>1)independent=true
}
assert(independent,'actual chevron wrappers must blink independently')
console.log('PASS: solid stationary ring, random short flashes, independent glyph schedules and actual wrapper visibility.')
