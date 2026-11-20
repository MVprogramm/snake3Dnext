const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('node:assert/strict')
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},
}).outputText,file)
global.localStorage={setItem(){}};global.location={reload(){}}
global.document={querySelector:()=>null,querySelectorAll:()=>[]}
global.setInterval=()=>1;global.setTimeout=()=>1;global.clearInterval=()=>{}
const repository=path.resolve('src/services/gameSessionRepository.ts')
require.cache[repository]={id:repository,filename:repository,loaded:true,exports:{saveGameSession:async()=>{}}}
const init=require('../src/engine/events/setInitialLevelOfGame.ts').default
const snake=require('../src/engine/snake/snake.ts')
const phase=require('../src/engine/snake/snakeStepPhase.ts')
const timer=require('../src/engine/time/isTimer.ts')
const mistake=require('../src/engine/lives/isMistake.ts')
const contact=require('../src/engine/events/isContact.ts')
const protocol=require('../src/engine/protocol/protocol.ts')
const fixed=require('../src/engine/obstacles/obstaclesFix.ts')
const X=require('../src/engine/obstacles/obstaclesX.ts'),Y=require('../src/engine/obstacles/obstaclesY.ts')
const advance=require('../src/engine/snake/advanceSnake.ts').advanceSnake
const keyboard=require('../src/engine/events/keyboardEvents.ts').default
const noMoves=require('../src/engine/events/noMovesEvent.ts').default
const menu=require('../src/store/menuStore.ts').useMenuStore
const key=(x,y)=>x>0?'ArrowRight':x<0?'ArrowLeft':y>0?'ArrowUp':'ArrowDown'
function collide(dx,dy,type='fixed'){
  protocol.setProtocol([])
  init(1);if(menu.getState().isVisible)menu.getState().toggleModal()
  mistake.noMistakeWasMade();contact.breakContact();phase.clearPendingSnakeHead()
  fixed.setObstaclesFixCoord([]);X.setObstaclesXCoord([]);Y.setObstaclesYCoord([])
  X.setObstaclesStepX([]);Y.setObstaclesStepY([])
  const obstacle=[22+dx,12+dy]
  if(type==='fixed')fixed.setObstaclesFixCoord([obstacle])
  else if(type==='x'){X.setObstaclesXCoord([obstacle]);X.setObstaclesStepX([dx?-dx:1])}
  else {Y.setObstaclesYCoord([obstacle]);Y.setObstaclesStepY([dy?-dy:1])}
  require('../src/engine/food/food.ts').setFoodCoord([35,18])
  snake.setSnakeHeadParams({snakeHeadCoordX:22,snakeHeadCoordY:12,snakeHeadStepX:dx,snakeHeadStepY:dy})
  snake.setSnakeBodyCoord([[22,12],[22-dx,12-dy],[22-2*dx,12-2*dy]])
  // A queued/logged direction can differ from the actual collision heading.
  protocol.addEvent({name:dx?'Y':'X',value:1})
  timer.startTimer();advance()
  assert(!timer.checkTimerWorking());assert(mistake.checkMistake())
  assert.equal(snake.getSnakeHeadParams().snakeHeadStepX,0)
  assert.equal(snake.getSnakeHeadParams().snakeHeadStepY,0)
  assert(snake.isReverseAfterContact(-dx,-dy))
}
for(const type of ['fixed','x','y'])for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  collide(dx,dy,type)
  const body=JSON.stringify(snake.getSnakeBodyCoord()),events=protocol.getProtocol().length
  for(let press=0;press<4;press++)keyboard({code:key(-dx,-dy)})
  assert(!timer.checkTimerWorking(),'reverse must not restart timer')
  assert.equal(JSON.stringify(snake.getSnakeBodyCoord()),body,'tail/body must remain intact')
  assert.equal(protocol.getProtocol().length,events,'rejected reverse must not append movement')
  assert(!phase.hasPendingSnakeHead())
  const turn=dx?[0,1]:[1,0]
  keyboard({code:key(...turn)})
  assert(timer.checkTimerWorking());assert(!mistake.checkMistake())
  // A rapid second key cannot reverse before the first new step is planned.
  const acceptedHead={...snake.getSnakeHeadParams()}
  keyboard({code:key(-dx,-dy)})
  assert.deepEqual(snake.getSnakeHeadParams(),acceptedHead)
  advance();advance()
  assert.equal(snake.getSnakeBodyCoord().length,3)
  assert.equal(new Set(snake.getSnakeBodyCoord().map(cell=>cell.join(':'))).size,3)
  assert.equal(snake.getSnakeHeadParams().snakeHeadCoordX,22+turn[0])
  assert.equal(snake.getSnakeHeadParams().snakeHeadCoordY,12+turn[1])
  assert(!snake.isReverseAfterContact(-dx,-dy),'restriction clears after valid movement resumes')
}
collide(1,0)
fixed.setObstaclesFixCoord([[23,12],[22,11],[22,13]])
assert(noMoves(snake.getSnakeHeadParams()),'reverse must not count as an escape when all legal directions are blocked')
init(1)
assert(!snake.isReverseAfterContact(-1,0),'restart clears collision heading')
console.log('PASS: reverse blocked after fixed/X/Y contacts in all directions; unchanged timer/body/protocol, rapid keys, legal turn/resume, no-moves and restart.')
