// Run from the repository root with: node scripts/check-level-transitions.cjs
// Exercise real engine transitions and arena geometry; stub persistence and the browser surface.
{
const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('node:assert/strict');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2020}}).outputText,file);
global.localStorage={setItem:()=>{}};global.location={reload:()=>console.log('RELOAD')};
const root=process.cwd(),load=p=>require(path.join(root,p));
const repository=path.join(root,'src/services/gameSessionRepository.ts');
require.cache[repository]={id:repository,filename:repository,loaded:true,exports:{saveGameSession:async()=>{}}};
const init=load('src/engine/events/setInitialLevelOfGame.ts').default;
const snake=load('src/engine/snake/snake.ts'),food=load('src/engine/food/food.ts'),catchFood=load('src/engine/events/snakeCatchesFoodEvent.ts').snakeCatchesFoodEvent;
const level=load('src/engine/levels/currentLevel.ts'),menu=load('src/store/menuStore.ts').useMenuStore;
const remaining=load('src/engine/food/currentFoodNumber.ts'),timer=load('src/engine/time/isTimer.ts'),interrupt=load('src/engine/events/interruptGameEvent.ts');

const keyboard=load('src/engine/events/keyboardEvents.ts').default;
const units=load('src/animations/snakeAnimation/bodyAnimations/snakeBodyProps.ts');
const Trail=load('src/animations/snakeAnimation/smoothSnakeTrail.ts').SmoothSnakeTrail;const trail=new Trail();
init(1);if(menu.getState().isVisible)menu.getState().toggleModal();
for(let expected=1;expected<=3;expected++){
 timer.startTimer();let safety=0;
 while(level.getCurrentLevel()===expected&&safety++<30){
  const [x,y]=food.getFoodCoord();snake.setSnakeHeadParams({snakeHeadCoordX:x,snakeHeadCoordY:y,snakeHeadStepX:0,snakeHeadStepY:1});catchFood();
  trail.update(units.getSnakeUnitPosition(),snake.getSnakeBodyCoord().length-1);
 }
 assert.equal(level.getCurrentLevel(),expected+1);assert(menu.getState().isVisible);assert(!timer.checkTimerWorking());
 menu.getState().toggleModal();interrupt.interruptGameEvent();assert(!interrupt.getInterruptGame());
 keyboard({code:'ArrowRight'});console.log('RESUME',level.getCurrentLevel(),'timer',timer.checkTimerWorking(),'head steps',snake.getSnakeHeadParams().snakeHeadStepX,snake.getSnakeHeadParams().snakeHeadStepY);
 assert(timer.checkTimerWorking());
}
console.log('PASS transitions 1->2->3->4 and direction/resume.');

}
{
const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict'),THREE=require('three');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,f);
global.innerWidth=1672;global.innerHeight=941;
const gradient={addColorStop(){}};const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:()=>({width:20})},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
global.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const arenaProperties=new Map();const style={setProperty:(key,value)=>arenaProperties.set(key,value)};const classes=()=>{const names=new Set();return {contains:name=>names.has(name),toggle:(name,enabled)=>enabled?names.add(name):names.delete(name),add:name=>names.add(name),remove:name=>names.delete(name)}};
const hudProperties = new Map();
const hudAttributes = new Map();
const hudStyle = {setProperty:(key,value)=>hudProperties.set(key,value),removeProperty:key=>hudProperties.delete(key)};
const handlers = new Map();
const mount={clientWidth:1672,clientHeight:941,style,classList:classes(),parentElement:{style:hudStyle,setAttribute:(key,value)=>hudAttributes.set(key,value),removeAttribute:key=>hudAttributes.delete(key)}};
const controlAttributes=new Map();
const handle={style,classList:classes(),setAttribute:(key,value)=>controlAttributes.set(key,value),querySelector:()=>({classList:classes()}),addEventListener:(name,callback)=>handlers.set(name,callback),setPointerCapture(){},hasPointerCapture:()=>false};
const size=new THREE.Vector2();let renders=0,lastRenderCamera;const renderer={capabilities:{getMaxAnisotropy:()=>4},shadowMap:{},setClearColor(){},setScissor(){},setScissorTest(){},clear(){},setSize:(w,h)=>size.set(w,h),getSize:out=>out.copy(size),render(scene,activeCamera){renders++;lastRenderCamera=activeCamera;assert.equal(activeCamera.view.width,size.x);assert.equal(activeCamera.view.height,size.y)}};
const camera=new THREE.PerspectiveCamera(38,1672/941,.1,240);
const {createTrainingArena}=require(process.cwd()+'/src/assets/trainingArena/createTrainingArena.ts');
const arena=createTrainingArena(renderer,camera,mount,handle);arena.render();const expected=size.clone(),projection=camera.projectionMatrix.toArray();
const fieldPivot=arena.gameplay.parent.parent;
assert(!arena.gameplay.parent.getObjectByName('apple-distance-arrows'));
const referenceBoards=fieldPivot.parent.children.filter(object=>object!==fieldPivot && object.visible);
assert.equal(referenceBoards.length,12);
assert.equal(hudAttributes.get('data-view-mode'),'normal');
assert.equal(hudAttributes.get('data-camera-mode'),'fixed');
assert.equal(controlAttributes.get('data-control-state'),'arrows');
// Reproduce R3F's response to a temporary in-flow menu fallback, without a window resize.
renderer.setSize(1000,300);camera.aspect=1000/300;camera.updateProjectionMatrix();arena.render();
assert.deepEqual(size.toArray(),expected.toArray());assert.deepEqual(camera.projectionMatrix.toArray(),projection);
// Container-only resize and a second independent resize must recover too.
mount.clientHeight=800;renderer.setSize(1672,800);camera.aspect=1672/800;camera.updateProjectionMatrix();arena.render();assert.deepEqual(size.toArray(),[1672,800]);assert.deepEqual(camera.projectionMatrix.toArray(),projection);
mount.clientHeight=941;arena.render();renderer.setSize(500,500);camera.aspect=1;camera.updateProjectionMatrix();arena.render();assert.deepEqual(camera.projectionMatrix.toArray(),projection);
assert.equal(renders,5);
assert.equal(parseFloat(hudProperties.get('--arena-gap-left')),0);
assert.equal(parseFloat(hudProperties.get('--arena-gap-right')),0);
// A wide viewport at minimum zoom exposes side gaps; panel widths must follow them.
global.innerWidth=2000;global.innerHeight=800;mount.clientWidth=2000;mount.clientHeight=800;arena.render();
const event=(x,y)=>({pointerId:1,pointerType:'mouse',button:0,clientX:x,clientY:y,preventDefault(){}});
handlers.get('pointerdown')(event(100,100));handlers.get('pointermove')(event(44,100));arena.render();
const gap=(innerWidth-parseFloat(arenaProperties.get('--reference-width')))/2;
assert(gap>200);
assert.equal(parseFloat(hudProperties.get('--arena-gap-left')),gap);
assert.equal(parseFloat(hudProperties.get('--arena-gap-right')),gap);
handlers.get('pointerup')(event(44,100));
// Growing back to the original scale removes the exposed areas.
handlers.get('pointerdown')(event(44,100));handlers.get('pointermove')(event(100,100));arena.render();
assert.equal(parseFloat(hudProperties.get('--arena-gap-left')),0);
assert.equal(parseFloat(hudProperties.get('--arena-gap-right')),0);
handlers.get('pointerup')(event(100,100));
// A taller viewport exposes top/bottom gaps at minimum scale.
global.innerWidth=1200;global.innerHeight=1000;mount.clientWidth=1200;mount.clientHeight=1000;arena.render();
handlers.get('pointerdown')(event(100,100));handlers.get('pointermove')(event(100,156));arena.render();
assert.equal(hudAttributes.get('data-info-layout'),'horizontal');
const verticalGap=(innerHeight-parseFloat(arenaProperties.get('--reference-height')))/2;assert(verticalGap>100);
assert.equal(parseFloat(hudProperties.get('--arena-gap-top')),verticalGap);
assert.equal(parseFloat(hudProperties.get('--arena-gap-bottom')),verticalGap);
handlers.get('pointerup')(event(100,156));
// Changing back to a wide viewport restores the side bars.
global.innerWidth=2000;global.innerHeight=800;mount.clientWidth=2000;mount.clientHeight=800;arena.render();
assert.equal(hudAttributes.get('data-info-layout'),'vertical');
// Portrait rotation must also rotate the HUD coordinate system.
global.innerWidth=600;global.innerHeight=1200;mount.clientWidth=1200;mount.clientHeight=600;arena.render();
assert.equal(hudAttributes.get('data-info-rotated'),'true');
assert.equal(hudAttributes.get('data-info-layout'),'vertical');
assert(parseFloat(hudProperties.get('--arena-gap-left'))>0);
global.innerWidth=2000;global.innerHeight=800;mount.clientWidth=2000;mount.clientHeight=800;arena.render();
assert.equal(hudAttributes.get('data-info-rotated'),'false');
const {getInfoLayout}=require(process.cwd()+'/src/assets/trainingArena/infoLayout.ts');
const portrait=getInfoLayout({viewportWidth:800,viewportHeight:1200,imageWidth:900,imageHeight:1600,panX:40,panY:-20,rotated:true});
assert.equal(portrait.orientation,'vertical');assert.equal(portrait.gaps.left,190);assert.equal(portrait.gaps.right,110);
assert.equal(portrait.screenGaps.top,190);assert.equal(portrait.screenGaps.bottom,110);
const covered=getInfoLayout({viewportWidth:1200,viewportHeight:1000,imageWidth:1600,imageHeight:1400,panX:0,panY:0,rotated:false},'horizontal');
assert.equal(covered.orientation,'vertical');
// Normal mode caps zoom at 160% and never switches camera or hides scene boards.
handlers.get('pointerdown')(event(100,100));handlers.get('pointermove')(event(1000,100));arena.render();
handlers.get('pointerup')(event(1000,100));
const normalWidth=parseFloat(arenaProperties.get('--reference-width'));
assert.equal(normalWidth,3200);
assert.equal(hudAttributes.get('data-camera-mode'),'fixed');
assert(referenceBoards.every(board=>board.visible));
assert.equal(controlAttributes.get('data-control-state'),'limit');
// Overshoot cannot accumulate: reversing by ten pixels immediately zooms out.
handlers.get('pointerdown')(event(100,100));handlers.get('pointermove')(event(200,100));
handlers.get('pointermove')(event(190,100));arena.render();
assert(parseFloat(arenaProperties.get('--reference-width'))<normalWidth);
assert.equal(controlAttributes.get('data-control-state'),'arrows');
handlers.get('pointermove')(event(210,100));handlers.get('pointerup')(event(210,100));arena.render();
assert.equal(controlAttributes.get('data-control-state'),'limit');
const savedPanX=arenaProperties.get('--pan-x'),savedPanY=arenaProperties.get('--pan-y');
const tap=(time,pointerType='mouse',x=200,y=100)=>{
  const value={...event(x,y),timeStamp:time,pointerType};
  handlers.get('pointerdown')(value);handlers.get('pointerup')(value);
};
// Close-up is explicit, begins at 400%, and still uses a screen-sized renderer.
const snakeState=require(process.cwd()+'/src/engine/snake/snake.ts');
snakeState.setSnakeHeadParams({snakeHeadCoordX:22,snakeHeadCoordY:12,snakeHeadStepX:1,snakeHeadStepY:0});
const visualSnake=require(process.cwd()+'/src/animations/snakeAnimation/bodyAnimations/snakeBodyProps.ts');
visualSnake.setSnakeUnitPosition([[0,0,0]]);
tap(1000);arena.render();
assert.equal(hudAttributes.get('data-view-mode'),'normal','single click on magnifier must not enter');
tap(1200);arena.render();
assert.equal(hudAttributes.get('data-view-mode'),'close-up');
assert.equal(controlAttributes.get('data-control-state'),'close-up');
assert.equal(parseFloat(arenaProperties.get('--reference-width')),8000);
assert(referenceBoards.every(board=>!board.visible));
handlers.get('pointerdown')(event(100,100));handlers.get('pointermove')(event(156,100));arena.render();
assert(parseFloat(arenaProperties.get('--reference-width'))>mount.clientWidth*2);
assert.deepEqual(size.toArray(),[mount.clientWidth,mount.clientHeight]);
assert.equal(hudAttributes.get('data-camera-mode'),'following');
assert(referenceBoards.every(board=>!board.visible));
assert(fieldPivot.visible,'field and gameplay remain visible');
handlers.get('pointerup')(event(156,100));
handlers.get('pointerdown')(event(156,100));handlers.get('pointermove')(event(100,100));
handlers.get('pointerup')(event(100,100));
assert.equal(hudAttributes.get('data-camera-mode'),'following');
tap(2000);arena.render();
assert.equal(hudAttributes.get('data-view-mode'),'close-up','single click on cross must not exit');
tap(2200);arena.render();
assert.equal(hudAttributes.get('data-view-mode'),'normal');
assert.equal(hudAttributes.get('data-camera-mode'),'fixed');
assert.equal(parseFloat(arenaProperties.get('--reference-width')),normalWidth);
assert.equal(arenaProperties.get('--pan-x'),savedPanX);
assert.equal(arenaProperties.get('--pan-y'),savedPanY);
assert.equal(arenaProperties.get('--camera-pan-x'),'0px');
assert(referenceBoards.every(board=>board.visible));
assert.equal(controlAttributes.get('data-control-state'),'limit');
// Touch requires double taps for both entry and exit, without click ghosts.
tap(3000,'touch');tap(3200,'touch');arena.render();
assert.equal(hudAttributes.get('data-view-mode'),'close-up');
tap(4000,'touch');arena.render();
assert.equal(hudAttributes.get('data-view-mode'),'close-up','single touch on cross must not exit');
tap(4200,'touch');arena.render();
assert.equal(hudAttributes.get('data-view-mode'),'normal');
assert.equal(parseFloat(arenaProperties.get('--reference-width')),normalWidth);
// Mode switches also preserve the rotated layout.
global.innerWidth=600;global.innerHeight=1200;mount.clientWidth=1200;mount.clientHeight=600;arena.render();
const portraitNormalWidth=arenaProperties.get('--reference-width');
arena.setCloseUpMode(true);arena.render();
assert.equal(hudAttributes.get('data-info-rotated'),'true');
assert.equal(hudAttributes.get('data-camera-mode'),'following');
assert(referenceBoards.every(board=>!board.visible));
arena.setCloseUpMode(false);arena.render();
assert.equal(arenaProperties.get('--reference-width'),portraitNormalWidth);
assert.equal(hudAttributes.get('data-camera-mode'),'fixed');
assert(referenceBoards.every(board=>board.visible));
arena.dispose();for(const side of ['left','right','top','bottom'])assert(!hudProperties.has(`--arena-gap-${side}`));
assert(!hudAttributes.has('data-info-layout'));assert(!hudAttributes.has('data-info-rotated'));
assert(!hudAttributes.has('data-view-mode'));
console.log('PASS: calibrated recovery; side/top/bottom gap coverage; automatic orientation both ways; rotated pan; side panels at full coverage and cleanup.');

}

{
// Drive the actual Game frame callback with controlled hook storage and timers.
// This specifically checks late callbacks, without depending on rendering speed.
const fs = require('fs'), ts = require('typescript'), assert = require('node:assert/strict');
let level = 1, interrupted = false, frame, cursor = 0, nextTimer = 0;
const slots = [], timers = new Map();
const hooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
  },
  useRef(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  },
  useEffect() {},
};
global.window = {
  setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
  clearTimeout(id) { timers.delete(id); },
};
const moduleValue = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/components/Game.tsx', 'utf8'), {
  fileName: 'Game.tsx', compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function dependency(name) {
  if (name === 'react') return hooks;
  if (name === 'react/jsx-runtime') return require(name);
  if (name === '@react-three/fiber') return { useFrame(callback) { frame = callback; } };
  if (name === './Scene') return { Scene() {} };
  if (name.includes('menuStore')) return { useMenuStore: select => select({ isVisible: false, titleMenu: 'start' }) };
  if (name.includes('interruptGameEvent')) return { getInterruptGame: () => interrupted };
  if (name.includes('currentLevel')) return { getCurrentLevel: () => level };
  if (name.includes('pauseEvent')) return { keyboardPauseEvent() {} };
  return { __esModule: true, default() {} };
}
new Function('require', 'exports', code)(dependency, moduleValue.exports);
function render() { cursor = 0; return moduleValue.exports.Game(); }
let scene = render(); assert.equal(scene.key, '1');
interrupted = true; frame(null, 1 / 60);
assert.equal(timers.size, 1);
const lateCallback = [...timers.values()][0];
level = 2; interrupted = false; frame(null, 1 / 60);
assert.equal(timers.size, 0); scene = render(); assert.equal(scene.key, '2');
lateCallback(); assert.equal(render().key, '2');
// A real end still hides the scene; subsequent continuation restores it.
interrupted = true; frame(null, 1 / 60);
const [timerId, finish] = [...timers.entries()][0]; timers.delete(timerId); finish();
assert.equal(render(), false);
interrupted = false; frame(null, 1 / 60); assert.equal(render().key, '2');
// A short same-level interruption also cancels its pending finish.
interrupted = true; frame(null, 1 / 60); assert.equal(timers.size, 1);
const cancelled = [...timers.values()][0]; interrupted = false; frame(null, 1 / 60);
assert.equal(timers.size, 0); cancelled(); assert.equal(render().key, '2');
console.log('PASS: Game scene keys, late finish callbacks, real finish, continuation, and same-level timeout cancellation.');
}
