const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('node:assert/strict'),THREE=require('three')
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},
}).outputText,file)
global.localStorage={setItem(){}};global.location={reload(){}};global.document={querySelector:()=>null,querySelectorAll:()=>[]}
global.setInterval=()=>1;global.setTimeout=()=>1;global.clearInterval=()=>{}
const repository=path.resolve('src/services/gameSessionRepository.ts')
require.cache[repository]={id:repository,filename:repository,loaded:true,exports:{saveGameSession:async()=>{}}}
require('../src/engine/events/setInitialLevelOfGame.ts').default(1)
const X=require('../src/engine/obstacles/obstaclesX.ts'),Y=require('../src/engine/obstacles/obstaclesY.ts')
const fixed=require('../src/engine/obstacles/obstaclesFix.ts'),cells=require('../src/engine/obstacles/highlightedObstacleCells.ts')
const snake=require('../src/engine/snake/snake.ts'),phase=require('../src/engine/snake/snakeStepPhase.ts')
const timer=require('../src/engine/time/isTimer.ts'),mistake=require('../src/engine/lives/isMistake.ts')
const units=require('../src/animations/snakeAnimation/bodyAnimations/snakeBodyProps.ts')
const contact=require('../src/engine/events/highlightedHeadContact.ts').checkHighlightedHeadContact
X.setObstaclesXCoord([[23,12]]);X.setObstaclesStepX([-1]);Y.setObstaclesYCoord([]);fixed.setObstaclesFixCoord([])
for(const [visual,expected] of [[23.75,24],[23.5001,24],[23.4999,23],[23.1,23]]){
  cells.setMovingObstacleVisualPositions('x',[[visual,12]])
  assert.deepEqual(cells.getMovingHighlightedCells('x'),[[expected,12]])
}
cells.setMovingObstacleVisualPositions('x',[[23.75,12]]);cells.setMovingObstacleVisualPositions('y',[])
snake.setSnakeHeadParams({snakeHeadCoordX:22,snakeHeadCoordY:12,snakeHeadStepX:1,snakeHeadStepY:0})
snake.setSnakeBodyCoord([[22,12],[21,12],[20,12]])
units.setSnakeUnitPosition([[0,0,0],[-1,0,0],[-2,0,0]])
require('../src/animations/snakeAnimation/headAnimations/snakeHeadProps.ts').setPositionHead([0,0,0])
timer.startTimer()
require('../src/engine/snake/advanceSnake.ts').advanceSnake()
assert(phase.hasPendingSnakeHead() && !mistake.checkMistake(),'unlit future target must not reject a planned step')
units.setSnakeUnitPosition([[.6,0,0],[-.4,0,0],[-1.4,0,0]])
assert(!contact(),'chevron/engine target outside the highlighted cell must not cause an error')
cells.setMovingObstacleVisualPositions('x',[[23.49,12]])
assert(contact(),'highlight arriving under the head must trigger contact in this frame')
assert(mistake.checkMistake() && !timer.checkTimerWorking())
assert(!phase.hasPendingSnakeHead())
assert.deepEqual(snake.getSnakeBodyCoord(),[[22,12],[21,12],[20,12]])
assert(snake.isReverseAfterContact(-1,0),'reverse remains blocked after contact rollback')
assert(!contact(),'contact must not repeat while stopped')
const keyboard=require('../src/engine/events/keyboardEvents.ts').default
keyboard({code:'ArrowLeft'});assert(!timer.checkTimerWorking())
keyboard({code:'ArrowUp'});assert(timer.checkTimerWorking())
const moveSnake=require('../src/engine/snake/moveSnake.ts').default
const animate=require('../src/animations/snakeAnimation/snakeAnimation.ts').snakeAnimation
for(let frame=0;frame<100;frame++){moveSnake();animate(1/60);contact()}
assert(!mistake.checkMistake() && snake.getSnakeHeadParams().snakeHeadCoordY>12,'valid turn must resume after mid-step contact')
assert.equal(snake.getSnakeBodyCoord().length,3)
// Breaking a highlighted cell removes its moving target and corresponding step.
X.setObstaclesXCoord([[24,12],[30,6]]);X.setObstaclesStepX([1,-1])
cells.setMovingObstacleVisualPositions('x',[[23.2,12],[30,6]])
require('../src/engine/obstacles/breakObstacles.ts').default([23,12])
assert.deepEqual(X.getObstaclesXCoord(),[[30,6]]);assert.deepEqual(X.getObstaclesStepX(),[-1])

// Drive actual Obstacles frame updates with memoized refs and controlled movement.
X.setObstaclesXCoord([[10,6]]);X.setObstaclesStepX([1]);Y.setObstaclesYCoord([])
mistake.noMistakeWasMade();timer.startTimer()
const effects=[],created=[];let frameCallback,priority
const fakeReact={createRef:()=>{const ref={current:new THREE.Group()};created.push(ref);return ref},
  useRef:value=>({current:value}),useState:value=>[typeof value==='function'?value():value,()=>{}],useEffect:callback=>effects.push(callback)}
const output={exports:{}}
const file=path.resolve('src/components/Obstacles.tsx')
const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText
new Function('require','exports',code)(name=>{
  if(name==='react')return fakeReact
  if(name==='@react-three/fiber')return {useFrame:(callback,value)=>{frameCallback=callback;priority=value}}
  if(name.includes('/assets/'))return {__esModule:true,default(){}}
  if(name.endsWith('/moveObstacles'))return {__esModule:true,default:axis=>{if(axis==='x')X.setObstaclesXCoord(X.getObstaclesXCoord().map(([x,y])=>[x+1,y]))}}
  return require(name.startsWith('.')?path.resolve(path.dirname(file),name):name)
},output.exports)
output.exports.default();effects.forEach(effect=>effect())
assert(priority<-100,'publish highlighted cells before Game collision checks')
const [glyph,frame]=created
let jumps=0,lastGlyph,lastFrame
for(let tick=0;tick<200;tick++){
  frameCallback()
  assert.equal(frame.current.position.x,Math.floor(glyph.current.position.x+.5))
  if(lastFrame!==undefined && frame.current.position.x!==lastFrame){
    jumps++;assert.equal(Math.abs(frame.current.position.x-lastFrame),1)
  }
  if(lastGlyph!==undefined)assert(Math.abs(glyph.current.position.x-lastGlyph)<.02,'only chevrons interpolate smoothly')
  lastFrame=frame.current.position.x;lastGlyph=glyph.current.position.x
}
assert(jumps>=2)
timer.stopTimer();const paused=glyph.current.position.toArray()
for(let tick=0;tick<20;tick++)frameCallback()
assert.deepEqual(glyph.current.position.toArray(),paused,'pause freezes the visual phase and frame together')
console.log('PASS: midpoint cell switch, smooth chevrons/snapped frames, no predicted contact, actual head-only contact, rollback/tail/resume, bonus removal and pause.')
