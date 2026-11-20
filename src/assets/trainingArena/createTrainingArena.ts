// @ts-nocheck
// Calibrated visual scene ported from Snake3DTrainingFacility (plain JavaScript source).
import * as THREE from "three";
import { getInfoLayout } from "./infoLayout";
import fieldSettings from "../../engine/field/arena.json";
import { isPlayableCell } from "../../engine/field/fieldGeometry";
import { getSnakeUnitPosition } from "../../animations/snakeAnimation/bodyAnimations/snakeBodyProps";
import { getCurrentLevel } from "../../engine/levels/currentLevel";
import { FollowingCamera } from "./followingCamera";
import { cropCameraToViewport } from "./viewportCamera";
import { createScreenRoundCorrection } from "../obstacleSymbols/screenRoundSymbols";
export function createTrainingArena(renderer, camera, mount, panHandle) {
const scene=new THREE.Scene();
const controller=new AbortController();
const signal=controller.signal;
const hudContainer=mount.parentElement;
const hudStyle=hudContainer?.style;
let infoOrientation='vertical';
function syncSidePanelWidths(width,height,panX=0,panY=0){
  if(!hudStyle)return;
  const rotated=mount.classList.contains('landscape-layout');
  const layout=getInfoLayout({viewportWidth:innerWidth,viewportHeight:innerHeight,
    imageWidth:width,imageHeight:height,panX,panY,
    rotated},infoOrientation);
  infoOrientation=layout.orientation;
  hudContainer.setAttribute?.('data-info-layout',infoOrientation);
  hudContainer.setAttribute?.('data-info-rotated',String(rotated));
  for(const [side,gap] of Object.entries(layout.gaps)){
    hudStyle.setProperty(`--arena-gap-${side}`, `${gap}px`);
  }
}
const REFERENCE_WIDTH=1672;
const REFERENCE_HEIGHT=941;
const REFERENCE_OBJECTS_OFFSET_Y=20;
const FIELD_SCREEN_WIDTH=586;
const FIELD_SCREEN_HEIGHT=251;
const FIELD_SAFE_MARGIN=1.5;
let closeUpMode=false;
let normalView={x:0,y:0};
let zoomLimitHint=false;
let lastTap=null;
const getMaxViewScale=()=>closeUpMode?4:1.6;
hudContainer?.setAttribute?.('data-view-mode','normal');
let viewScale=1;
function needsLandscapeLayout() {
  const coverScale=Math.max(innerWidth/REFERENCE_WIDTH,innerHeight/REFERENCE_HEIGHT);
  const compactScale=Math.min(
    innerWidth/(FIELD_SCREEN_WIDTH*FIELD_SAFE_MARGIN),
    innerHeight/(FIELD_SCREEN_HEIGHT*FIELD_SAFE_MARGIN),
  );
  return compactScale < coverScale;
}
function syncViewportMode() {
  mount.classList.toggle('landscape-layout', needsLandscapeLayout());
}
function getReferenceFit(){
  const viewportWidth=mount.clientWidth||innerWidth;
  const viewportHeight=mount.clientHeight||innerHeight;
  const coverScale=Math.max(viewportWidth/REFERENCE_WIDTH,viewportHeight/REFERENCE_HEIGHT);
  const containScale=Math.min(viewportWidth/REFERENCE_WIDTH,viewportHeight/REFERENCE_HEIGHT);
  const compactScale=Math.min(
    viewportWidth/(FIELD_SCREEN_WIDTH*FIELD_SAFE_MARGIN),
    viewportHeight/(FIELD_SCREEN_HEIGHT*FIELD_SAFE_MARGIN),
  );
  return {
    viewportWidth,viewportHeight,
    baseScale:needsLandscapeLayout() ? coverScale : Math.min(coverScale,compactScale),
    containScale,
  };
}
function getReferenceRenderSize(){
  const {baseScale}=getReferenceFit();
  const scale=baseScale*viewScale;
  return {width:Math.round(REFERENCE_WIDTH*scale),height:Math.round(REFERENCE_HEIGHT*scale)};
}
function syncReferenceSize({width,height}) {
  mount.style.setProperty('--reference-width', `${width}px`);
  mount.style.setProperty('--reference-height', `${height}px`);
  mount.style.setProperty('--objects-offset-y', `${REFERENCE_OBJECTS_OFFSET_Y*height/REFERENCE_HEIGHT}px`);
  syncSidePanelWidths(width,height);
}
syncViewportMode();


// Calibration uses a virtual full reference image; rendering crops it to the viewport.
const CAMERA_REFERENCE_ZOOM = .45;
const cameraDirection = new THREE.Vector3(0, .91, .414).normalize();
function positionCamera() {
  const {width,height}=getReferenceRenderSize();
  camera.aspect = width / height;
  const halfFov = THREE.MathUtils.degToRad(camera.fov * .5);
  const distanceForWidth = 62 / (2 * Math.tan(halfFov) * camera.aspect);
  const distanceForHeight = 36 / (2 * Math.tan(halfFov));
  const distance = Math.max(distanceForWidth, distanceForHeight) * 1.02;
  camera.position.copy(cameraDirection).multiplyScalar(distance);
  camera.lookAt(0, -1, 0);
  camera.zoom = CAMERA_REFERENCE_ZOOM;
  camera.updateProjectionMatrix();
  // OrbitControls used to do this before the board pivots were constructed.
  // Their world-space orientation depends on the camera's current matrix.
  camera.updateMatrixWorld(true);
}
positionCamera();

renderer.setClearColor(0x000000,0);
const initialRenderSize=getReferenceRenderSize();
syncReferenceSize(initialRenderSize);
renderer.setSize(mount.clientWidth,mount.clientHeight);
renderer.toneMappingExposure=1.12;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
// The move handle in the bottom-right corner is the sole pan control. Its short
// travel maps to the complete hidden extent of the image and Three.js layer.

const panArrows=Object.fromEntries(
  ['up','down','left','right'].map(direction=>[
    direction,panHandle.querySelector(`[data-pan-direction="${direction}"]`),
  ]),
);
const scaleArrows=Object.fromEntries(
  ['up','down','left','right'].map(direction=>[
    direction,panHandle.querySelector(`[data-scale-direction="${direction}"]`),
  ]),
);
const HANDLE_TRAVEL=56;
const pan={x:0,y:0};
let panBounds={x:0,y:0};
let panAxis='x';
let dragPointer=null;
function getMinViewScale(){
  const {baseScale,containScale}=getReferenceFit();
  return Math.min(1,containScale/baseScale);
}
function getScaleHandlePosition(){
  const range=viewScale>=1?getMaxViewScale()-1:1-getMinViewScale();
  return range?THREE.MathUtils.clamp((viewScale-1)/range*HANDLE_TRAVEL,-HANDLE_TRAVEL,HANDLE_TRAVEL):0;
}
function renderPan(){
  const controlState=closeUpMode?'close-up':zoomLimitHint?'limit':'arrows';
  const label=closeUpMode?'Двойной клик — вернуться к масштабу 160%':zoomLimitHint
    ?'Предел 160%. Двойной клик — крупный план; потяните назад для уменьшения'
    :'Голубые стрелки — перемещение; белые — масштаб';
  panHandle.setAttribute?.('data-control-state',controlState);
  panHandle.setAttribute?.('aria-label',label);
  panHandle.setAttribute?.('title',label);
  mount.style.setProperty('--pan-x',`${pan.x}px`);
  mount.style.setProperty('--pan-y',`${pan.y}px`);
  const localX=panBounds.x?pan.x/panBounds.x*HANDLE_TRAVEL:0;
  const localY=panBounds.y?pan.y/panBounds.y*HANDLE_TRAVEL:0;
  const rotated=mount.classList.contains('landscape-layout');
  const horizontalPan=rotated?panAxis==='y':panAxis==='x';
  const scaleHandlePosition=getScaleHandlePosition();
  panHandle.style.setProperty('--handle-x',`${(rotated?-localY:localX)+(horizontalPan?0:scaleHandlePosition)}px`);
  panHandle.style.setProperty('--handle-y',`${(rotated?localX:localY)+(horizontalPan?-scaleHandlePosition:0)}px`);
  const referenceSize=getReferenceRenderSize();
  syncSidePanelWidths(referenceSize.width,referenceSize.height,pan.x,pan.y);
  const screenX=rotated?-pan.y:pan.x;
  const screenY=rotated?pan.x:pan.y;
  const screenBoundX=rotated?panBounds.y:panBounds.x;
  const screenBoundY=rotated?panBounds.x:panBounds.y;
  const available={
    left:screenX>-screenBoundX+.5,
    right:screenX<screenBoundX-.5,
    up:screenY>-screenBoundY+.5,
    down:screenY<screenBoundY-.5,
  };
  // The button rotates with the arena; availability is still in screen axes.
  const screenDirection=direction=>rotated
    ? {up:'right',down:'left',left:'up',right:'down'}[direction]
    : direction;
  for(const [direction,arrow] of Object.entries(panArrows)){
    arrow.classList.toggle('is-hidden',!available[screenDirection(direction)]);
  }
  const canScaleIn=viewScale<getMaxViewScale()-.001;
  const canScaleOut=viewScale>getMinViewScale()+.001;
  const scaleAvailable=horizontalPan
    ? {up:canScaleIn,down:canScaleOut,left:false,right:false}
    : {up:false,down:false,left:canScaleOut,right:canScaleIn};
  for(const [direction,arrow] of Object.entries(scaleArrows)){
    arrow.classList.toggle('is-hidden',!scaleAvailable[screenDirection(direction)]);
  }
}
function syncPanBounds({width,height}){
  const {baseScale,viewportWidth,viewportHeight}=getReferenceFit();
  const overflowX=REFERENCE_WIDTH*baseScale-viewportWidth;
  const overflowY=REFERENCE_HEIGHT*baseScale-viewportHeight;
  panAxis=overflowX>=overflowY?'x':'y';
  panBounds={
    x:panAxis==='x'?Math.max(0,(width-mount.clientWidth)/2):0,
    y:panAxis==='y'?Math.max(0,(height-mount.clientHeight)/2):0,
  };
  pan.x=THREE.MathUtils.clamp(pan.x,-panBounds.x,panBounds.x);
  pan.y=THREE.MathUtils.clamp(pan.y,-panBounds.y,panBounds.y);
  renderPan();
}
syncPanBounds(initialRenderSize);
panHandle.addEventListener('pointerdown',event=>{
  if(dragPointer!==null || (event.pointerType==='mouse' && event.button!==0))return;
  dragPointer={
    id:event.pointerId,x:event.clientX,y:event.clientY,
    panX:pan.x,panY:pan.y,scalePosition:getScaleHandlePosition(),
    startX:event.clientX,startY:event.clientY,moved:false,
  };
  panHandle.setPointerCapture(event.pointerId);
  panHandle.classList.add('is-panning');
  event.preventDefault();
}, {signal});
panHandle.addEventListener('pointermove',event=>{
  if(dragPointer?.id!==event.pointerId)return;
  if(Math.hypot(event.clientX-dragPointer.startX,event.clientY-dragPointer.startY)>5){
    dragPointer.moved=true;
    lastTap=null;
  }
  if(closeUpMode){event.preventDefault();return;}
  const screenX=event.clientX-dragPointer.x;
  const screenY=event.clientY-dragPointer.y;
  const rotated=mount.classList.contains('landscape-layout');
  const localX=rotated?screenY:screenX;
  const localY=rotated?-screenX:screenY;
  const horizontalPan=rotated?panAxis==='y':panAxis==='x';
  const scaleDelta=horizontalPan?-screenY:screenX;
  const rawScalePosition=dragPointer.scalePosition+scaleDelta;
  const scalePosition=THREE.MathUtils.clamp(rawScalePosition,-HANDLE_TRAVEL,HANDLE_TRAVEL);
  if(rawScalePosition>HANDLE_TRAVEL+.5){
    zoomLimitHint=true;
    // Discard overshoot so reversing the drag immediately zooms out.
    dragPointer.scalePosition=HANDLE_TRAVEL;
    if(horizontalPan)dragPointer.y=event.clientY;else dragPointer.x=event.clientX;
  }else if(scalePosition<HANDLE_TRAVEL-.5){
    zoomLimitHint=false;
  }
  const minScale=getMinViewScale();
  const nextScale=1+(scalePosition/HANDLE_TRAVEL)*(scalePosition>=0?getMaxViewScale()-1:1-minScale);
  if(Math.abs(nextScale-viewScale)>.0001){
    viewScale=nextScale;
    syncViewLayout(false);
  }
  pan.x=THREE.MathUtils.clamp(dragPointer.panX+localX*panBounds.x/HANDLE_TRAVEL,-panBounds.x,panBounds.x);
  pan.y=THREE.MathUtils.clamp(dragPointer.panY+localY*panBounds.y/HANDLE_TRAVEL,-panBounds.y,panBounds.y);
  renderPan();
  event.preventDefault();
}, {signal});
function endPan(event,activate=false){
  if(dragPointer?.id!==event.pointerId)return;
  const tapped=!dragPointer.moved && Math.hypot(event.clientX-dragPointer.startX,event.clientY-dragPointer.startY)<=5;
  dragPointer=null;
  panHandle.classList.remove('is-panning');
  if(panHandle.hasPointerCapture(event.pointerId))panHandle.releasePointerCapture(event.pointerId);
  if(!activate || !tapped){lastTap=null;return;}
  if(!closeUpMode && !zoomLimitHint)return;
  const now=event.timeStamp??performance.now();
  if(lastTap && now>=lastTap.time && now-lastTap.time<=500 && Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<=20){
    setCloseUpMode(!closeUpMode);
  }else lastTap={time:now,x:event.clientX,y:event.clientY};
}
panHandle.addEventListener('pointerup',event=>endPan(event,true),{signal});
panHandle.addEventListener('pointercancel',endPan,{signal});
panHandle.addEventListener('lostpointercapture',endPan,{signal});
// Native keyboard/screen-reader button activation does not generate pointer taps.
panHandle.addEventListener('click',event=>{
  if(event.detail===0){
    if(closeUpMode)setCloseUpMode(false);
    else if(zoomLimitHint)setCloseUpMode(true);
  }
},{signal});

const arena = new THREE.Group();
// The old canvas used a .50 × .45 non-uniform CSS scale.  Its projection is
// now represented inside the scene, leaving the canvas free to cover the
// complete reference image and receive objects anywhere on that image.
// Camera zoom remains .45 vertically; scale the camera-horizontal X axis so
// the final horizontal reference scale is .50.
arena.scale.set(.5 / CAMERA_REFERENCE_ZOOM, .9, 1);
scene.add(arena);

const mat = (color, emissive = 0x000000, intensity = 0, metalness = .3, roughness = .45) =>
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, metalness, roughness });
const cyan = mat(0x72fff2, 0x21e9ff, 2.2, .15, .25);
const blue = mat(0x1784ff, 0x006dff, 3, .45, .2);
const darkMetal = mat(0x081526, 0x031024, .3, .85, .24);
const glass = new THREE.MeshPhysicalMaterial({ color:0x36b9d0, transmission:.38, transparent:true, opacity:.5, roughness:.1, metalness:.25, thickness:.25 });

function roundedShape(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2); s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
  s.lineTo(w/2,h/2-r); s.quadraticCurveTo(w/2,h/2,w/2-r,h/2); s.lineTo(-w/2+r,h/2);
  s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r); s.lineTo(-w/2,-h/2+r); s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  return s;
}

function octagonalShape(w,h,cut){
  const s=new THREE.Shape();
  s.moveTo(-w/2+cut,-h/2);s.lineTo(w/2-cut,-h/2);s.lineTo(w/2,-h/2+cut);
  s.lineTo(w/2,h/2-cut);s.lineTo(w/2-cut,h/2);s.lineTo(-w/2+cut,h/2);
  s.lineTo(-w/2,h/2-cut);s.lineTo(-w/2,-h/2+cut);s.closePath();return s;
}

function createFieldTexture() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1280;
  const x = c.getContext('2d');
  x.fillStyle='#077A6B'; x.fillRect(0,0,c.width,c.height);
  // Draw actual gameplay cells, rather than a decorative grid unrelated to movement.
  const { columns, rows, cellSize, surface } = fieldSettings;
  const width=surface.width*surface.scaleX, depth=surface.depth*surface.scaleY;
  const pixelX=value=>(value/width+.5)*c.width;
  const pixelY=value=>(value/depth+.5)*c.height;
  x.strokeStyle='rgba(114,255,240,.62)';x.lineWidth=1.3;
  for(let column=1;column<=columns;column++) for(let row=1;row<=rows;row++){
    if(!isPlayableCell(column,row))continue;
    x.strokeRect(pixelX((column-1-columns/2)*cellSize),
      pixelY((rows/2-row)*cellSize),cellSize/width*c.width,cellSize/depth*c.height);
  }
  const texture = new THREE.CanvasTexture(c); texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
  return texture;
}

// Foundation, glowing play surface and layered rim
const foundation = new THREE.Mesh(new THREE.BoxGeometry(48,1.5,30),darkMetal); foundation.position.y=-1.35; foundation.receiveShadow=true; arena.add(foundation);
const fieldDepth=fieldSettings.surface.depth;
const nearEdgeZ=12.45;
const fieldGeo = new THREE.ShapeGeometry(octagonalShape(fieldSettings.surface.width,fieldDepth,fieldSettings.surface.cornerCut)); fieldGeo.rotateX(-Math.PI/2);
const fieldPos = fieldGeo.getAttribute('position');
const fieldUV = new Float32Array(fieldPos.count * 2);
for (let i = 0; i < fieldPos.count; i++) {
  fieldUV[i * 2] = (fieldPos.getX(i) + fieldSettings.surface.width/2) / fieldSettings.surface.width;
  fieldUV[i * 2 + 1] = (fieldDepth/2 - fieldPos.getZ(i)) / fieldDepth;
}
fieldGeo.setAttribute('uv', new THREE.BufferAttribute(fieldUV, 2));
const field = new THREE.Mesh(fieldGeo,new THREE.MeshBasicMaterial({map:createFieldTexture(),toneMapped:false}));
field.receiveShadow=true;
const fieldScale=.95;
const fieldWidthScale=fieldSettings.surface.scaleX;
const fieldDepthScale=fieldSettings.surface.scaleY;
field.scale.set(fieldWidthScale,fieldScale,fieldDepthScale);
const fieldPivot=new THREE.Group();
fieldPivot.position.set(0,-.54,nearEdgeZ);
fieldPivot.rotation.x=THREE.MathUtils.degToRad(9);
const fixedNearEdgeLocal=-fieldDepth/2+(fieldDepth/2)*fieldScale;
field.position.set(0,0,fixedNearEdgeLocal-(fieldDepth/2)*fieldDepthScale);
fieldPivot.add(field);arena.add(fieldPivot);

function roundedLoop(w,h,r,y,tube,material){
  const pts=[]; const n=18;
  const add=(cx,cz,start)=>{for(let i=0;i<=n;i++){const a=start+i*Math.PI/(2*n);pts.push(new THREE.Vector3(cx+Math.cos(a)*r,y,cz+Math.sin(a)*r))}};
  add(w/2-r,h/2-r,0);add(-w/2+r,h/2-r,Math.PI/2);add(-w/2+r,-h/2+r,Math.PI);add(w/2-r,-h/2+r,Math.PI*1.5);
  const curve=new THREE.CatmullRomCurve3(pts,true,'centripetal'); return new THREE.Mesh(new THREE.TubeGeometry(curve,220,tube,8,true),material);
}
arena.add(roundedLoop(46.5,28.5,2.7,-.22,.28,cyan));
arena.add(roundedLoop(49,31,3.3,-.28,.48,darkMetal));
arena.add(roundedLoop(49.2,31.2,3.4,.18,.1,blue));

// Glass rail sections and light pylons
for(const side of [-1,1]) for(let x=-18;x<=18;x+=6){
  const rail=new THREE.Mesh(new THREE.BoxGeometry(5.2,1.5,.18),glass); rail.position.set(x,.7,side*15.25);arena.add(rail);
  const post=new THREE.Mesh(new THREE.BoxGeometry(.16,1.75,.32),blue);post.position.set(x+2.8,.7,side*15.25);arena.add(post);
}
for(const side of [-1,1]) for(let z=-10;z<=10;z+=5){
  const rail=new THREE.Mesh(new THREE.BoxGeometry(.18,1.5,4.2),glass);rail.position.set(side*24.25,.7,z);arena.add(rail);
  const post=new THREE.Mesh(new THREE.BoxGeometry(.32,1.75,.16),blue);post.position.set(side*24.25,.7,z+2.3);arena.add(post);
}

// Stadium floor, corner structures and ambient light strips.
const stage=new THREE.Mesh(new THREE.CylinderGeometry(37,40,1.2,8),darkMetal);stage.scale.z=.72;stage.position.y=-2.6;stage.receiveShadow=true;scene.add(stage);
for(const side of [-1,1]) for(const z of [-12,12]){
  const tower=new THREE.Group();
  const base=new THREE.Mesh(new THREE.BoxGeometry(5,5,4),darkMetal);base.position.y=.2;tower.add(base);
  for(let i=-1;i<=1;i++){const strip=new THREE.Mesh(new THREE.BoxGeometry(.11,3.7,.09),blue);strip.position.set(i*1.65,.4,2.04);tower.add(strip)}
  tower.position.set(side*29,0,z);tower.rotation.y=side<0?.12:-.12;scene.add(tower);
}

// Stadium architecture surrounding the field.
const environment = new THREE.Group();
scene.add(environment);

const concourse = new THREE.Mesh(
  new THREE.PlaneGeometry(82, 58),
  new THREE.MeshStandardMaterial({ color:0x06101d, metalness:.78, roughness:.35 })
);
concourse.rotation.x = -Math.PI / 2;
concourse.position.y = -3.18;
concourse.receiveShadow = true;
environment.add(concourse);

for(const x of [-31.5,31.5]){
  const wing=new THREE.Mesh(new THREE.BoxGeometry(7.5,1.1,38),darkMetal);wing.position.set(x,-2.62,0);wing.receiveShadow=true;environment.add(wing);
  for(const z of [-14,-7,0,7,14]){
    const inset=new THREE.Mesh(new THREE.BoxGeometry(5.8,.08,4.8),mat(0x0a2138,0x031226,.4,.7,.28));inset.position.set(x,-2.02,z);environment.add(inset);
  }
}

// Subtle floor panel seams outside the arena.
const seamMat = mat(0x10273b, 0x041321, .4, .72, .32);
for (let x = -36; x <= 36; x += 6) {
  const seam = new THREE.Mesh(new THREE.BoxGeometry(.035,.018,56),seamMat);
  seam.position.set(x,-3.14,0); environment.add(seam);
}
for (let z = -26; z <= 26; z += 6) {
  const seam = new THREE.Mesh(new THREE.BoxGeometry(80,.018,.035),seamMat);
  seam.position.set(0,-3.14,z); environment.add(seam);
}

function signTexture({ title, subtitle='', lines=[], align='center', chart=false, icon=false, label='' }) {
  const c=document.createElement('canvas'); c.width=1024; c.height=512;
  const q=c.getContext('2d');
  const g=q.createLinearGradient(0,0,0,512);g.addColorStop(0,'#071b35');g.addColorStop(1,'#020a18');q.fillStyle=g;q.fillRect(0,0,1024,512);
  q.strokeStyle='#168dff';q.lineWidth=8;q.strokeRect(15,15,994,482);
  q.strokeStyle='rgba(53,221,255,.35)';q.lineWidth=2;q.strokeRect(33,33,958,446);
  q.textAlign=align;q.textBaseline='middle';const px=align==='left'?70:512;
  q.fillStyle='#9bdcff';q.font='700 49px Arial Narrow, Arial';q.fillText(title,px,80);
  q.fillStyle='#1bd9ff';q.fillRect(align==='left'?70:260,121,align==='left'?610:504,5);
  if(subtitle){q.fillStyle='#27b7ef';q.font='600 29px Arial';q.fillText(subtitle,px,160)}
  if(icon){q.strokeStyle='#a7f7ff';q.lineWidth=18;q.beginPath();q.arc(190,305,70,.35,Math.PI*1.75);q.stroke();q.fillStyle='#a7f7ff';q.font='700 82px Arial';q.textAlign='center';q.fillText('S',190,308)}
  if(chart){
    q.fillStyle='#ff2948';q.beginPath();q.arc(190,244,35,0,Math.PI*2);q.fill();
    [90,145,210,285,375].forEach((h,i)=>{q.fillStyle=i<3?'#14d9ff':'#3984ff';q.fillRect(340+i*92,420-h,52,h)});
  }
  q.textAlign=align;
  lines.forEach((line,i)=>{const y=230+i*65;q.fillStyle=i===0?'#d5f7ff':'#79b9df';q.font=`${i===0?'700':'600'} 31px Arial Narrow, Arial`;q.fillText(line,px,y)});
  if(label){
    q.fillStyle='rgba(6,33,66,.96)';q.fillRect(72,139,880,62);
    q.strokeStyle='#65f4ff';q.lineWidth=4;q.strokeRect(72,139,880,62);
    q.fillStyle='#e3ffff';q.font='700 44px Arial Narrow, Arial';q.textAlign='center';q.fillText(label,512,171);
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}

const INFORMATION_BOARD_COLOR='#081737';
function trainingInformationTexture(topLine='TRAINING',bottomLine='INFORMATION',background=INFORMATION_BOARD_COLOR){
  const c=document.createElement('canvas'); c.width=1024; c.height=512;
  const q=c.getContext('2d');
  q.fillStyle=background;q.fillRect(0,0,c.width,c.height);
  q.fillStyle='#e5ffff';q.textAlign='center';q.textBaseline='middle';
  q.font='700 92px Arial Narrow, Arial';
  q.fillText(topLine,512,215);
  q.fillText(bottomLine,512,310);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}

function transparentInformationTexture(topLine='TRAINING',bottomLine='INFORMATION'){
  const c=document.createElement('canvas'); c.width=1024; c.height=512;
  const q=c.getContext('2d');
  q.fillStyle='#e5ffff';q.textAlign='center';q.textBaseline='middle';
  q.font='700 128px Arial Narrow, Arial';
  q.fillText(topLine,512,175);
  q.fillText(bottomLine,512,337);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}

function worldLeagueTexture(){
  const c=document.createElement('canvas'); c.width=1536; c.height=384;
  const q=c.getContext('2d');
  q.fillStyle='#061b33';q.fillRect(0,0,c.width,c.height);
  q.fillStyle='#defdff';q.textAlign='center';q.textBaseline='middle';
  q.font='700 112px sans-serif';
  q.fillText('WORLD SNAKE LEAGUE',768,192);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}

function worldLeagueLabelTexture(){
  const c=document.createElement('canvas'); c.width=1536; c.height=384;
  const q=c.getContext('2d');
  q.fillStyle='#f0ffff';q.textAlign='center';q.textBaseline='middle';
  q.font='700 112px sans-serif';
  q.fillText('WORLD SNAKE LEAGUE',768,192);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}

function centralLeagueBoardTexture(){
  const c=document.createElement('canvas'); c.width=1024; c.height=512;
  const q=c.getContext('2d');
  q.fillStyle='#06233e';q.fillRect(0,0,c.width,c.height);
  q.strokeStyle='#39dfff';q.lineWidth=10;q.strokeRect(12,12,1000,488);
  q.fillStyle='#f2ffff';q.textAlign='center';q.textBaseline='middle';
  q.font='700 68px sans-serif';
  q.fillText('WORLD SNAKE LEAGUE',512,256);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}

function signBox(w,h,texture,x,y,z,rotationY=0){
  const group=new THREE.Group();
  const materials=[darkMetal,darkMetal,darkMetal,darkMetal,new THREE.MeshStandardMaterial({map:texture,emissive:0x083b65,emissiveIntensity:1.15,roughness:.32}),darkMetal];
  const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,.55),materials);box.castShadow=true;group.add(box);
  const top=new THREE.Mesh(new THREE.BoxGeometry(w+.35,.09,.76),blue);top.position.y=h/2+.08;group.add(top);
  group.position.set(x,y,z);group.rotation.y=rotationY;environment.add(group);
  return group;
}

// A single, continuous arena box: heavy metal tray, glass walls and integrated advertising.
const enclosure=new THREE.Group();
environment.add(enclosure);

const trayTop=new THREE.Mesh(new THREE.BoxGeometry(55.5,1.45,37),darkMetal);
trayTop.position.y=-1.95;trayTop.receiveShadow=true;trayTop.castShadow=true;enclosure.add(trayTop);
const trayInset=new THREE.Mesh(new THREE.BoxGeometry(51.7,.18,33.4),mat(0x102c3c,0x031d2e,.65,.72,.28));
trayInset.position.y=-1.16;enclosure.add(trayInset);

const fasciaMaterial=mat(0x071322,0x020817,.32,.88,.23);
for(const z of [-16.7,16.7]){
  const wall=new THREE.Mesh(new THREE.BoxGeometry(49.5,2.25,1.25),fasciaMaterial);wall.position.set(0,-.95,z);wall.castShadow=true;enclosure.add(wall);
}
for(const x of [-25.35,25.35]){
  const wall=new THREE.Mesh(new THREE.BoxGeometry(1.25,2.25,31.2),fasciaMaterial);wall.position.set(x,-.95,0);wall.castShadow=true;enclosure.add(wall);
}

// Bevelled armored corners make the tray read as one physical container.
for(const x of [-24.7,24.7]) for(const z of [-15.95,15.95]){
  const corner=new THREE.Mesh(new THREE.BoxGeometry(3.15,2.55,1.5),darkMetal);
  corner.position.set(x,-.75,z);corner.rotation.y=(x*z>0?1:-1)*Math.PI/4;corner.castShadow=true;enclosure.add(corner);
  const cornerLight=new THREE.Mesh(new THREE.BoxGeometry(2.15,.12,.18),blue);
  cornerLight.position.set(x,.38,z);cornerLight.rotation.y=corner.rotation.y;enclosure.add(cornerLight);
}

const arenaGlass=new THREE.MeshPhysicalMaterial({
  color:0x45d9ed,emissive:0x063f55,emissiveIntensity:1.35,transmission:.52,
  transparent:true,opacity:.34,roughness:.08,metalness:.12,thickness:.35,
  side:THREE.DoubleSide,depthWrite:false
});
const glassFrame=mat(0xa8ffff,0x14dfff,4.2,.2,.16);

function glassSection(w,h,x,y,z,rotationY=0){
  const g=new THREE.Group();
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),arenaGlass);g.add(pane);
  for(const yy of [-h/2,h/2]){const edge=new THREE.Mesh(new THREE.BoxGeometry(w+.16,.09,.13),glassFrame);edge.position.y=yy;g.add(edge)}
  for(const xx of [-w/2,w/2]){const post=new THREE.Mesh(new THREE.BoxGeometry(.11,h+.18,.16),glassFrame);post.position.x=xx;g.add(post)}
  g.position.set(x,y,z);g.rotation.y=rotationY;enclosure.add(g);
}
for(let x=-20.4;x<=20.4;x+=6.8){glassSection(6.15,2.4,x,1.25,-15.62,0);glassSection(6.15,2.4,x,1.25,15.62,Math.PI)}
for(let z=-10.2;z<=10.2;z+=6.8){glassSection(6.15,2.4,-24.62,1.25,z,Math.PI/2);glassSection(6.15,2.4,24.62,1.25,z,-Math.PI/2)}

function adPlane(w,h,texture,x,y,z,rotationY=0){
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,emissive:0x073c67,emissiveIntensity:1.5,roughness:.35,side:THREE.DoubleSide}));
  panel.position.set(x,y,z);panel.rotation.y=rotationY;enclosure.add(panel);return panel;
}
const leagueAd=signTexture({title:'WORLD SNAKE LEAGUE',subtitle:'TRAINING FACILITY'});
const logoAd=signTexture({title:'WSL',icon:true,label:'TRAINING INFORMATION'});
const lowerLogoAd=signTexture({title:'TRAINING INFORMATION',icon:true});
const trainingInfoTexture=trainingInformationTexture();
const centralInfoTexture=trainingInformationTexture('TRAINING','INFORMATION');
const lowerCentralTexture=trainingInformationTexture('TRAINING','INFORMATION');
const worldLeaguePanelTexture=worldLeagueTexture();
const worldLeagueLabelTextureMap=worldLeagueLabelTexture();
const centralLeagueTexture=trainingInformationTexture('WORLD SNAKE','LEAGUE');
const disciplineAd=signTexture({title:'DISCIPLINE',lines:['BUILDS CHAMPIONS'],align:'left'});
const futureAd=signTexture({title:'BETTER SNAKES',lines:['TOMORROW'],align:'left'});

// Ads are mounted directly onto the inner and outer faces of the box walls.
const fasciaAds=[
  signBox(15.4,3.15,leagueAd,0,-.55,17.35,0),
  signBox(7.1,3.15,disciplineAd,-19.5,-.55,17.35,0),
  signBox(7.1,3.15,futureAd,19.5,-.55,17.35,0),
  signBox(6.6,3.15,logoAd,-10.7,-.55,17.35,0),
  signBox(6.6,3.15,logoAd,10.7,-.55,17.35,0)
];
const sideAds=[
  adPlane(8.7,2.05,logoAd,-25.99,-.58,8.5,Math.PI/2),
  adPlane(8.7,2.05,logoAd,25.99,-.58,8.5,-Math.PI/2),
  adPlane(8.7,2.05,disciplineAd,-25.99,-.58,-5,Math.PI/2),
  adPlane(8.7,2.05,futureAd,25.99,-.58,-5,-Math.PI/2)
];
sideAds.forEach(panel=>panel.rotation.x=-.6);

// Continuous neon lines visually bind every wall segment together.
for(const z of [-17.38,17.38]){
  const rail=new THREE.Mesh(new THREE.BoxGeometry(48.5,.12,.16),blue);rail.position.set(0,.25,z);enclosure.add(rail);
}
for(const x of [-26.03,26.03]){
  const rail=new THREE.Mesh(new THREE.BoxGeometry(.16,.12,29.7),blue);rail.position.set(x,.25,0);enclosure.add(rail);
}

// Back wall: central league board, motivational panels and illuminated columns.
const backCenter=signBox(24,5.7,signTexture({title:'WORLD SNAKE LEAGUE',subtitle:'TRAINING FACILITY',icon:true}),0,3.7,-21.4,0);
const backLeft=signBox(9.5,5.7,signTexture({title:'PRACTICE',lines:['IMPROVE','EVOLVE'],align:'left'}),-18.5,3.7,-21.2,.04);
const backRight=signBox(9.5,5.7,signTexture({title:'SMALL MOVES',lines:['BIG PROGRESS'],align:'left'}),18.5,3.7,-21.2,-.04);
[backCenter,backLeft,backRight].forEach(board=>board.rotation.x=-.42);

for(const x of [-27,-13.2,13.2,27]){
  const column=new THREE.Mesh(new THREE.BoxGeometry(1.15,8.3,1.4),darkMetal);column.position.set(x,2.2,-21.2);column.castShadow=true;environment.add(column);
  const strip=new THREE.Mesh(new THREE.BoxGeometry(.16,6.7,1.46),blue);strip.position.set(x,2.2,-20.47);environment.add(strip);
  const cap=new THREE.Mesh(new THREE.BoxGeometry(1.6,.22,1.8),cyan);cap.position.set(x,6.25,-21.2);environment.add(cap);
}

// Angled side scoreboards, matching the reference arena wings.
const analysisTexture=trainingInfoTexture;
const analysisBoard=signBox(8.6,8.2,analysisTexture,-29.2,1.55,-3.5,0);
signBox(8.6,8.2,signTexture({title:'TRAINING DRILLS',lines:['› SPEED RUN','◎ PRECISION TURNS','∪ BONUS COLLECTION','↝ ROUTE MASTERY'],align:'left'}),29.2,1.55,-3.5,-.27);
const sideLeft=signBox(7.2,6.2,signTexture({title:'WSL',icon:true}),-30.8,.2,9.5,.2);
const sideRight=signBox(7.2,6.2,signTexture({title:'WSL',icon:true}),30.8,.2,9.5,-.2);
[sideLeft,sideRight].forEach(board=>board.rotation.x=-.22);

// Near-side fascia and logo panels.
// Repeating luminous strips around the upper and lower concourse.
for(const z of [-18.05,19.8]) for(let x=-28;x<=28;x+=4){
  const strip=new THREE.Mesh(new THREE.BoxGeometry(2.5,.1,.16),x%8===0?cyan:blue);strip.position.set(x,-2.72,z);environment.add(strip);
}
const warm=mat(0xffe3b0,0xffbd70,3.2,.18,.24);
for(const z of [-17.45,19.15]) for(let x=-24;x<=24;x+=8){
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(1.15,.12,.22),warm);lamp.position.set(x,-2.62,z);environment.add(lamp);
}

function plant(x,z,scale=1){
  const g=new THREE.Group();
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(.62,.48,1.15,18),mat(0xc6d3de,0x102a38,.18,.18,.32));pot.position.y=-1.95;g.add(pot);
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.08,18),mat(0x25170e));soil.position.y=-1.35;g.add(soil);
  const leafMat=mat(0x28a74e,0x0a632a,.9,.05,.45);
  for(let i=0;i<12;i++){
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),leafMat);leaf.scale.set(.7,3.4,.45);leaf.position.set(Math.sin(i*2.4)*.55,-.15+(i%4)*.42,Math.cos(i*2.4)*.55);leaf.rotation.z=(i%2?.45:-.45);leaf.rotation.y=i*2.4;g.add(leaf);
  }
  g.position.set(x,0,z);g.scale.setScalar(scale);environment.add(g);
}
plant(-24,-18.8,1.18);plant(24,-18.8,1.18);plant(-32,14,.88);plant(32,14,.88);

function floorSpot(x,z,rotation=0){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.25,.75,1.05),darkMetal);body.castShadow=true;g.add(body);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.27,.35,.12,18),new THREE.MeshStandardMaterial({color:0x9feeff,emissive:0x009dff,emissiveIntensity:4}));
  lens.rotation.x=Math.PI/2;lens.position.set(0,.12,.57);g.add(lens);
  g.position.set(x,-2.38,z);g.rotation.y=rotation;environment.add(g);
}
floorSpot(-25,-14,.15);floorSpot(25,-14,-.15);floorSpot(-27,15,.15);floorSpot(27,15,-.15);

// Technical benches and outer safety rails.
for(const x of [-31,31]) for(const z of [7,14]){
  const bench=new THREE.Mesh(new THREE.BoxGeometry(5,.35,1.2),darkMetal);bench.position.set(x,-2.15,z);bench.rotation.y=x<0?.12:-.12;environment.add(bench);
  for(const dx of [-1.8,1.8]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.18,1.25,.8),darkMetal);leg.position.set(x+dx,-2.65,z);environment.add(leg)}
}
const railMat=mat(0x1b344d,0x07182b,.45,.8,.25);
for(let x=-31;x<=31;x+=3.2){
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,2.2,8),railMat);post.position.set(x,-1.9,22.5);environment.add(post);
}
for(const y of [-1.1,-2.05]){const bar=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,64,8),railMat);bar.rotation.z=Math.PI/2;bar.position.set(0,y,22.5);environment.add(bar)}

// Warm architectural uplights break up the blue lighting like the reference.
for(const x of [-23,23]){
  const glow=new THREE.PointLight(0xffd39b,10,13,2);glow.position.set(x,3.8,-18.4);environment.add(glow);
}

scene.add(new THREE.HemisphereLight(0x4caaff,0x021013,1.25));
const key=new THREE.DirectionalLight(0xe5ffff,3.5);key.position.set(-12,30,15);key.castShadow=false;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-35;key.shadow.camera.right=35;key.shadow.camera.top=25;key.shadow.camera.bottom=-25;scene.add(key);
for(const [x,z,c] of [[-24,12,0x0088ff],[24,12,0x0088ff],[-20,-15,0x23e7ff],[20,-15,0x23e7ff]]){const l=new THREE.PointLight(c,18,20,2);l.position.set(x,5,z);scene.add(l)}

// The reference supplies the entire stadium. Only the clean field surface remains 3D.
// The left analysis screen replaces the matching card baked into the background.
analysisBoard.removeFromParent();
analysisBoard.clear();
const analysisSurface=new THREE.Mesh(
  new THREE.PlaneGeometry(8.6,8.2),
  new THREE.MeshBasicMaterial({map:analysisTexture,side:THREE.DoubleSide,toneMapped:false}),
);
// Scale from the lower-left corner, keeping the anchored edges in place.
analysisSurface.scale.set(.9722,1.1578,1);
analysisSurface.position.set(.903,.82,0);
analysisBoard.add(analysisSurface);
analysisBoard.scale.set(.95,1.55,1);
const analysisBoardWidth=8.6*analysisBoard.scale.x;
const analysisBoardHeight=8.2*analysisBoard.scale.y;
const analysisBoardPivot=new THREE.Group();
analysisBoardPivot.position.set(-21.90-analysisBoardWidth/2,7.2,-3.5);
analysisBoardPivot.quaternion.copy(camera.quaternion);
analysisBoardPivot.rotateZ(THREE.MathUtils.degToRad(43.86));
analysisBoardPivot.rotateY(THREE.MathUtils.degToRad(45));
const analysisBoardTiltPivot=new THREE.Group();
analysisBoardTiltPivot.position.set(analysisBoardWidth/2,analysisBoardHeight/2,-1.2);
analysisBoardTiltPivot.rotateX(THREE.MathUtils.degToRad(74.34));
analysisBoard.position.set(0,-analysisBoardHeight/2,0);
analysisBoard.quaternion.identity();
analysisBoardTiltPivot.add(analysisBoard);
analysisBoardPivot.add(analysisBoardTiltPivot);

// Mirror the panel across the arena centre: the right edge becomes its anchor
// and the horizontal/depth rotations are the exact inverse of the left panel.
const rightBoard=analysisBoard.clone();
const rightSurface=rightBoard.children[0];
rightSurface.position.x=-.903;
const rightBoardPivot=new THREE.Group();
rightBoardPivot.position.set(21.90+analysisBoardWidth/2,7.2,-3.5);
rightBoardPivot.quaternion.copy(camera.quaternion);
rightBoardPivot.rotateZ(THREE.MathUtils.degToRad(-44));
rightBoardPivot.rotateY(THREE.MathUtils.degToRad(-45));
const rightBoardTiltPivot=new THREE.Group();
rightBoardTiltPivot.position.set(-analysisBoardWidth/2,analysisBoardHeight/2,-1.2);
rightBoardTiltPivot.rotateX(THREE.MathUtils.degToRad(76));
rightBoard.position.set(0,-analysisBoardHeight/2,0);
rightBoard.quaternion.identity();
rightBoardTiltPivot.add(rightBoard);
rightBoardPivot.add(rightBoardTiltPivot);

// Smaller WSL panel below the left analysis display, retaining the exact pose.
const leftLogoPivot=analysisBoardPivot.clone(true);
leftLogoPivot.position.set(-55,-30,-3.5);
leftLogoPivot.scale.set(.52,.72,.65);
leftLogoPivot.traverse(object=>{
  if(object.isMesh) object.material=new THREE.MeshBasicMaterial({map:lowerLogoAd,side:THREE.DoubleSide,toneMapped:false});
});
// A dedicated centre pivot keeps yaw adjustments from translating the display.
analysisBoardPivot.updateMatrixWorld(true);
const analysisBoardBounds=new THREE.Box3().setFromObject(analysisBoardPivot);
const analysisBoardCentre=analysisBoardBounds.getCenter(new THREE.Vector3());
const analysisBoardCentrePivot=new THREE.Group();
analysisBoardCentrePivot.position.copy(analysisBoardCentre);
analysisBoardCentrePivot.position.x-=.32;
analysisBoardPivot.position.sub(analysisBoardCentre);
analysisBoardCentrePivot.add(analysisBoardPivot);
// Clockwise when observed from above.
analysisBoardCentrePivot.rotateY(THREE.MathUtils.degToRad(-4.25));
// Counterclockwise when observed from the left side of the display.
analysisBoardCentrePivot.rotateX(THREE.MathUtils.degToRad(0));
arena.add(analysisBoardCentrePivot);
arena.add(rightBoardPivot);
sideLeft.removeFromParent();
sideLeft.clear();
const sideLeftSurface=new THREE.Mesh(
  new THREE.PlaneGeometry(7.2,6.2),
  new THREE.MeshBasicMaterial({map:trainingInfoTexture,side:THREE.DoubleSide,toneMapped:false}),
);
const sideLeftTiltPivot=new THREE.Group();
// The pivot coincides with the actual upper edge, so tilting only lowers the bottom.
sideLeftTiltPivot.position.y=5.89;
sideLeftTiltPivot.rotation.x=THREE.MathUtils.degToRad(76);
// Keep the upper edge fixed while raising the lower edge by about 30 screen pixels.
// Narrow from the left: the local right edge remains anchored.
sideLeftSurface.scale.set(0.748,49/30,1);
sideLeftSurface.position.set(0.908,-(6.2*49/60),0);
sideLeftTiltPivot.add(sideLeftSurface);
sideLeft.add(sideLeftTiltPivot);
sideLeft.quaternion.copy(camera.quaternion);
sideLeft.rotateZ(THREE.MathUtils.degToRad(44));
sideLeft.rotateY(THREE.MathUtils.degToRad(45));
sideLeft.position.set(-23,2.5,9.5);
sideLeft.scale.set(1.1,1.2,1);
arena.add(sideLeft);

// Mirror the lower information panel across the arena centre, matching the pair above.
sideRight.removeFromParent();
sideRight.clear();
const sideRightSurface=new THREE.Mesh(
  new THREE.PlaneGeometry(7.2,6.2),
  new THREE.MeshBasicMaterial({map:trainingInfoTexture,side:THREE.DoubleSide,toneMapped:false}),
);
const sideRightTiltPivot=new THREE.Group();
sideRightTiltPivot.position.y=5.89;
sideRightTiltPivot.rotation.x=THREE.MathUtils.degToRad(76);
sideRightSurface.scale.set(0.748,49/30,1);
sideRightSurface.position.set(-0.908,-(6.2*49/60),0);
sideRightTiltPivot.add(sideRightSurface);
sideRight.add(sideRightTiltPivot);
sideRight.quaternion.copy(camera.quaternion);
sideRight.rotateZ(THREE.MathUtils.degToRad(-44));
sideRight.rotateY(THREE.MathUtils.degToRad(-45));
sideRight.position.set(23,2.5,9.5);
sideRight.scale.set(1.1,1.2,1);
arena.add(sideRight);

// Screen-parallel central information board, positioned over the matching reference panel.
const centralInfoBoard=new THREE.Mesh(
  // The local origin is the panel centre for symmetric tilting.
  new THREE.PlaneGeometry(18,5),
  new THREE.MeshBasicMaterial({
    map:centralInfoTexture,side:THREE.DoubleSide,toneMapped:false,depthTest:false,depthWrite:false,
  }),
);
centralInfoBoard.renderOrder=100;
// Fixed, approved centre-display width.
centralInfoBoard.scale.x=.765;
centralInfoBoard.scale.y=.72;
const centralInfoPivot=new THREE.Group();
centralInfoPivot.position.set(0,22,-3.5);
centralInfoPivot.quaternion.copy(camera.quaternion);
// Preserve the current centre position while using it as the explicit pivot.
centralInfoPivot.translateY(1.175);
centralInfoPivot.add(centralInfoBoard);
arena.add(centralInfoPivot);
// Build the orientation in world space so arena's non-uniform scale cannot
// shear the panel. The central display faces the camera exactly; the other
// central displays retain their existing tilt.
arena.updateMatrixWorld(true);
const centralWorldCentre=centralInfoPivot.getWorldPosition(new THREE.Vector3());
const centralWorldUp=new THREE.Vector3(0,1,0).transformDirection(camera.matrixWorld);
const centralVisibleHeight=(2*Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*camera.position.distanceTo(new THREE.Vector3(0,-1,0)))/camera.zoom;
// Ten displayed pixels downward in the camera's coordinate system.
centralWorldCentre.addScaledVector(centralWorldUp,-10*centralVisibleHeight/initialRenderSize.height);
const centralFacing=new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().lookAt(camera.position,centralWorldCentre,centralWorldUp),
);
centralFacing.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),THREE.MathUtils.degToRad(25)));
const centralBasis=centralInfoPivot.matrixWorld.elements;
const centralWorldScale=new THREE.Vector3(
  new THREE.Vector3(centralBasis[0],centralBasis[1],centralBasis[2]).length(),
  new THREE.Vector3(centralBasis[4],centralBasis[5],centralBasis[6]).length(),1,
);
centralInfoPivot.matrixAutoUpdate=false;
centralInfoPivot.matrix.copy(arena.matrixWorld).invert().multiply(
  new THREE.Matrix4().compose(centralWorldCentre,camera.quaternion,centralWorldScale),
);

// Large display in the upper central bay, directly above the information row.
const upperCentralBoard=new THREE.Mesh(
  new THREE.PlaneGeometry(18,5),
  new THREE.MeshBasicMaterial({
    map:centralInfoTexture,side:THREE.DoubleSide,toneMapped:false,depthTest:false,depthWrite:false,
  }),
);
upperCentralBoard.renderOrder=101;
// Shrink the board by three screen pixels on every edge while keeping its centre fixed.
upperCentralBoard.scale.set(.937,1.064,1);
const upperCentralPivot=new THREE.Group();
upperCentralPivot.add(upperCentralBoard);
const upperCentralWorldCentre=centralWorldCentre.clone().addScaledVector(
  centralWorldUp,58*centralVisibleHeight/initialRenderSize.height,
);
upperCentralPivot.matrixAutoUpdate=false;
upperCentralPivot.matrix.copy(arena.matrixWorld).invert().multiply(
  new THREE.Matrix4().compose(upperCentralWorldCentre,camera.quaternion,centralWorldScale),
);
arena.add(upperCentralPivot);

// Compact display mounted in the uppermost suspended-screen bay.
const topCentralBoard=new THREE.Mesh(
  // Narrower top radius gives the suspended display a truncated-cone profile.
  // A front half only: no rear shell is rendered behind the inscription.
  new THREE.CylinderGeometry(5.76,4.92,3.6,32,1,true,-Math.PI/2,Math.PI),
  new THREE.MeshBasicMaterial({
    color:INFORMATION_BOARD_COLOR,side:THREE.DoubleSide,toneMapped:false,depthTest:false,depthWrite:false,
  }),
);
topCentralBoard.renderOrder=102;
const topCentralLabel=new THREE.Mesh(
  // Leave a visible margin inside the cone's narrow upper diameter.
  new THREE.PlaneGeometry(7.2,2.25),
  new THREE.MeshBasicMaterial({
    map:transparentInformationTexture(),transparent:true,side:THREE.DoubleSide,
    toneMapped:false,depthTest:false,depthWrite:false,
  }),
);
topCentralLabel.position.z=4.67;
topCentralLabel.renderOrder=103;
topCentralBoard.add(topCentralLabel);
const topCentralPivot=new THREE.Group();
topCentralPivot.add(topCentralBoard);
const topCentralWorldCentre=upperCentralWorldCentre.clone().addScaledVector(
  centralWorldUp,71.5*centralVisibleHeight/initialRenderSize.height,
);
topCentralPivot.matrixAutoUpdate=false;
topCentralPivot.matrix.copy(arena.matrixWorld).invert().multiply(
  new THREE.Matrix4().compose(topCentralWorldCentre,centralFacing,centralWorldScale),
);
arena.add(topCentralPivot);

// Compact central display fitted into the illuminated plinth below the field.
const lowerCentralBoard=new THREE.Mesh(
  new THREE.PlaneGeometry(18,5),
  new THREE.MeshBasicMaterial({
    map:lowerCentralTexture,side:THREE.DoubleSide,toneMapped:false,depthTest:false,depthWrite:false,
  }),
);
lowerCentralBoard.renderOrder=104;
// Reveal the reference's neon frame while preserving the existing lower edge.
lowerCentralBoard.scale.set(.567,.36,1);
const lowerCentralPivot=new THREE.Group();
lowerCentralPivot.add(lowerCentralBoard);
const lowerCentralWorldCentre=centralWorldCentre.clone().addScaledVector(
  centralWorldUp,-199.4*centralVisibleHeight/initialRenderSize.height,
);
const lowerCentralFacing=new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().lookAt(camera.position,lowerCentralWorldCentre,centralWorldUp),
);
lowerCentralFacing.multiply(new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1,0,0),THREE.MathUtils.degToRad(25),
));
lowerCentralPivot.matrixAutoUpdate=false;
lowerCentralPivot.matrix.copy(arena.matrixWorld).invert().multiply(
  new THREE.Matrix4().compose(lowerCentralWorldCentre,lowerCentralFacing,centralWorldScale),
);
arena.add(lowerCentralPivot);

// Two narrow displays occupy the outer bays of the lower plinth, leaving the
// WSL snake marks between them and the centre screen unobstructed.
function createLowerCompanion(offsetX) {
  const board=new THREE.Mesh(
    new THREE.PlaneGeometry(18,5),
    new THREE.MeshBasicMaterial({
      map:lowerCentralTexture,side:THREE.DoubleSide,toneMapped:false,depthTest:false,depthWrite:false,
    }),
  );
  board.renderOrder=104;
  board.scale.set(.178,.36,1);
  const pivot=new THREE.Group();
  pivot.add(board);
  const worldRight=new THREE.Vector3(1,0,0).transformDirection(camera.matrixWorld);
  const worldCentre=lowerCentralWorldCentre.clone().addScaledVector(worldRight,offsetX);
  const facing=new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().lookAt(camera.position,worldCentre,centralWorldUp),
  );
  facing.multiply(new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1,0,0),THREE.MathUtils.degToRad(25),
  ));
  pivot.matrixAutoUpdate=false;
  pivot.matrix.copy(arena.matrixWorld).invert().multiply(
    new THREE.Matrix4().compose(worldCentre,facing,centralWorldScale),
  );
  arena.add(pivot);
  return pivot;
}
const lowerLeftPivot=createLowerCompanion(-15.16);
const lowerRightPivot=createLowerCompanion(15.16);

// Fit the lower central display as a real rectangular plane. Its reference
// frame is wider at the top, so the upper edge must be closer to the camera.
arena.updateMatrixWorld(true);
camera.updateMatrixWorld(true);
const lowerFrame={topLeft:739,topRight:930,topY:666,bottomLeft:746,bottomRight:922,bottomY:695};
const lowerBoardDepth=-lowerCentralPivot.getWorldPosition(new THREE.Vector3())
  .applyMatrix4(camera.matrixWorldInverse).z;
const projectionX=camera.projectionMatrix.elements[0];
const projectionY=camera.projectionMatrix.elements[5];
const topWidthNdc=2*(lowerFrame.topRight-lowerFrame.topLeft)/REFERENCE_WIDTH;
const bottomWidthNdc=2*(lowerFrame.bottomRight-lowerFrame.bottomLeft)/REFERENCE_WIDTH;
const depthTilt=(topWidthNdc-bottomWidthNdc)/(topWidthNdc+bottomWidthNdc);
const halfWidthPerDepth=topWidthNdc*(1-depthTilt)/(2*projectionX);
const topCentreNdc=(lowerFrame.topLeft+lowerFrame.topRight)/REFERENCE_WIDTH-1;
const bottomCentreNdc=(lowerFrame.bottomLeft+lowerFrame.bottomRight)/REFERENCE_WIDTH-1;
const centreXPerDepth=(
  topCentreNdc*(1-depthTilt)+bottomCentreNdc*(1+depthTilt)
)/(2*projectionX);
const topNdcY=1-2*(lowerFrame.topY-REFERENCE_OBJECTS_OFFSET_Y)/REFERENCE_HEIGHT;
const bottomNdcY=1-2*(lowerFrame.bottomY-REFERENCE_OBJECTS_OFFSET_Y)/REFERENCE_HEIGHT;
const topHeightTerm=topNdcY*(1-depthTilt)/projectionY;
const bottomHeightTerm=bottomNdcY*(1+depthTilt)/projectionY;
const centreYPerDepth=(topHeightTerm+bottomHeightTerm)/2;
const heightTilt=(topHeightTerm-bottomHeightTerm)/2;
const lowerBoardTilt=Math.atan2(depthTilt,heightTilt);
lowerCentralBoard.scale.set(
  2*halfWidthPerDepth*lowerBoardDepth/18,
  2*Math.hypot(depthTilt,heightTilt)*lowerBoardDepth/5,
  1,
);
const lowerBoardWorldCentre=new THREE.Vector3(
  centreXPerDepth*lowerBoardDepth,centreYPerDepth*lowerBoardDepth,-lowerBoardDepth,
).applyMatrix4(camera.matrixWorld);
const lowerBoardFacing=camera.quaternion.clone().multiply(
  new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),lowerBoardTilt),
);
lowerCentralPivot.matrix.copy(arena.matrixWorld).invert().multiply(
  new THREE.Matrix4().compose(lowerBoardWorldCentre,lowerBoardFacing,new THREE.Vector3(1,1,1)),
);
const lowerBoardAnchorX=projectionX*centreXPerDepth;
const lowerBoardAnchorY=projectionY*centreYPerDepth;

// The reference image and canvas share the same projected coordinate system.
// Lock these five distant boards to their approved positions in that image,
// rather than applying a breakpoint-dependent offset.  Keep each board's
// depth and orientation, moving only its projected centre as the viewport changes.
const referenceBoardAnchors=[
  [upperCentralPivot,0,.6564894824665987],
  [topCentralPivot,0,.9552475481510231],
  [lowerCentralPivot,lowerBoardAnchorX,lowerBoardAnchorY],
  [lowerLeftPivot,-.3022861641513817,-.4105047391636135],
  [lowerRightPivot,.3022861641513817,-.4105047391636135],
].map(([pivot,x,y])=>({pivot,x,y,base:pivot.matrix.clone()}));
function syncReferenceBoardAnchors(){
  camera.updateMatrixWorld(true);
  arena.updateMatrixWorld(true);
  const inverseArena=arena.matrixWorld.clone().invert();
  for(const {pivot,x,y,base} of referenceBoardAnchors){
    const worldMatrix=arena.matrixWorld.clone().multiply(base);
    const centre=new THREE.Vector3().setFromMatrixPosition(worldMatrix);
    const depth=centre.project(camera).z;
    worldMatrix.setPosition(new THREE.Vector3(x,y,depth).unproject(camera));
    pivot.matrix.copy(inverseArena).multiply(worldMatrix);
  }
}
syncReferenceBoardAnchors();

// Fit the suspended display to the marked trapezoid in the reference image.
// Retain each vertex's cylindrical depth, so the face wraps around its
// vertical axis while the projected side and lower edges follow the frame.
arena.updateMatrixWorld(true);
const inverseConeWorld=topCentralBoard.matrixWorld.clone().invert();
function conePointAtReferencePixel(imageX,imageY,localZ){
  const ndcX=2*imageX/REFERENCE_WIDTH-1;
  const ndcY=1-2*(imageY-REFERENCE_OBJECTS_OFFSET_Y)/REFERENCE_HEIGHT;
  const near=new THREE.Vector3(ndcX,ndcY,-1).unproject(camera).applyMatrix4(inverseConeWorld);
  const far=new THREE.Vector3(ndcX,ndcY,1).unproject(camera).applyMatrix4(inverseConeWorld);
  return near.lerp(far,(localZ-near.z)/(far.z-near.z));
}
const conePositions=topCentralBoard.geometry.getAttribute('position');
for(let i=0;i<conePositions.count;i++){
  const isTop=conePositions.getY(i)>0;
  const radius=isTop?5.76:4.92;
  const u=(Math.asin(THREE.MathUtils.clamp(conePositions.getX(i)/radius,-1,1))+Math.PI/2)/Math.PI;
  const bend=(2*u-1)**2;
  const imageX=isTop?746+180*u:760+154*u;
  const imageY=isTop?20+2*bend:84+6*bend;
  const point=conePointAtReferencePixel(imageX,imageY,conePositions.getZ(i));
  conePositions.setXYZ(i,point.x,point.y,point.z);
}
conePositions.needsUpdate=true;
topCentralBoard.geometry.computeBoundingBox();
topCentralBoard.geometry.computeBoundingSphere();
topCentralLabel.position.copy(conePointAtReferencePixel(836,52,5.5));

// Two companion displays fill the illuminated bays beside the central board.
// Keep both companion displays parallel to the camera-facing central board.
function createCentralCompanion(offsetX,facing) {
  const pivot=centralInfoPivot.clone(true);
  const surface=pivot.children[0];
  // Each side display is half the previous width; its position and tilt stay fixed.
  surface.scale.set(.231,.72,1);

  const worldRight=new THREE.Vector3(1,0,0).transformDirection(camera.matrixWorld);
  const worldCentre=centralWorldCentre.clone().addScaledVector(worldRight,offsetX);
  pivot.matrixAutoUpdate=false;
  pivot.matrix.copy(arena.matrixWorld).invert().multiply(
    new THREE.Matrix4().compose(worldCentre,facing,centralWorldScale),
  );
  arena.add(pivot);
  return pivot;
}
// Move the companion boards 30 displayed pixels away from the centre board.
const leftCentralInfoPivot=createCentralCompanion(-13.96,camera.quaternion);
const rightCentralInfoPivot=createCentralCompanion(13.96,camera.quaternion);

const referenceBoards=[analysisBoardCentrePivot,rightBoardPivot,sideLeft,sideRight,
  centralInfoPivot,upperCentralPivot,topCentralPivot,lowerCentralPivot,
  lowerLeftPivot,lowerRightPivot,leftCentralInfoPivot,rightCentralInfoPivot];
arena.children.forEach(object=>{object.visible=object===fieldPivot||referenceBoards.includes(object)});
scene.children.forEach(object=>{
  if(object!==arena && !object.isLight)object.visible=false;
});

// The reference's cyan bezels are not perfect projected rectangles. Keep each
// panel's 3D pose, but fit its four surface corners just inside the bezel.
// Clone the geometry first because the two panels initially share it.
function fitSurfaceToReferenceQuad(surface,corners,mapTextureToPlane=false){
  surface.geometry=surface.geometry.clone();
  arena.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  const inverseSurface=surface.matrixWorld.clone().invert();
  const positions=surface.geometry.getAttribute('position');
  const uv=surface.geometry.getAttribute('uv');
  const projectedPixels=[];
  for(let i=0;i<positions.count;i++){
    const u=uv.getX(i);
    const v=uv.getY(i);
    const imageX=THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(corners[3][0],corners[2][0],u),
      THREE.MathUtils.lerp(corners[0][0],corners[1][0],u),v,
    );
    const imageY=THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(corners[3][1],corners[2][1],u),
      THREE.MathUtils.lerp(corners[0][1],corners[1][1],u),v,
    );
    projectedPixels.push([imageX,imageY]);
    const ndcX=2*imageX/REFERENCE_WIDTH-1;
    const ndcY=1-2*(imageY-REFERENCE_OBJECTS_OFFSET_Y)/REFERENCE_HEIGHT;
    const near=new THREE.Vector3(ndcX,ndcY,-1).unproject(camera).applyMatrix4(inverseSurface);
    const far=new THREE.Vector3(ndcX,ndcY,1).unproject(camera).applyMatrix4(inverseSurface);
    const t=-near.z/(far.z-near.z);
    positions.setXYZ(i,near.x+(far.x-near.x)*t,near.y+(far.y-near.y)*t,0);
  }
  positions.needsUpdate=true;
  surface.geometry.computeBoundingBox();
  if(mapTextureToPlane==='screen'){
    // Texture coordinates follow the projected image grid. A subdivided
    // surface keeps the lettering straight without a detached text layer.
    const xs=corners.map(([x])=>x);
    const ys=corners.map(([,y])=>y);
    const left=Math.min(...xs),right=Math.max(...xs);
    const top=Math.min(...ys),bottom=Math.max(...ys);
    for(let i=0;i<uv.count;i++){
      const [imageX,imageY]=projectedPixels[i];
      uv.setXY(i,(imageX-left)/(right-left),(bottom-imageY)/(bottom-top));
    }
    uv.needsUpdate=true;
  }else if(mapTextureToPlane){
    // Use coordinates in the actual 3D plane for the texture. The original
    // rectangle UVs would stretch its lettering across the fitted corners.
    const {min,max}=surface.geometry.boundingBox;
    for(let i=0;i<uv.count;i++){
      uv.setXY(i,
        (positions.getX(i)-min.x)/(max.x-min.x),
        (positions.getY(i)-min.y)/(max.y-min.y),
      );
    }
    uv.needsUpdate=true;
  }
  surface.geometry.computeBoundingSphere();
}
fitSurfaceToReferenceQuad(analysisSurface,[
  [418,340], // upper left
  [507,313], // upper right
  [507,422], // lower right
  [421,455], // lower left
]);
fitSurfaceToReferenceQuad(rightSurface,[
  [1165,313], // upper left, mirrored from the left display
  [1252,340], // upper right: reveal the near-camera blue bezel
  [1249,455], // lower right
  [1165,422], // lower left
]);
fitSurfaceToReferenceQuad(centralInfoBoard,[
  [700,267], // upper left, below the upper cyan bezel
  [969,267], // upper right
  [969,315], // lower right
  [700,315], // lower left
]);
fitSurfaceToReferenceQuad(upperCentralBoard,[
  [693,129], // upper left, inside the large upper bezel
  [981,129], // upper right
  [980,229], // lower right
  [693,229], // lower left
]);
fitSurfaceToReferenceQuad(sideLeftSurface,[
  [430,521], // upper left, just below the reference's blue rail
  [487,494], // upper right, parallel to that rail
  [487,571], // lower right, just above the reference's lower edge
  [432,600], // lower left, aligned with the reference panel's lower edge
],true);
fitSurfaceToReferenceQuad(sideRightSurface,[
  [1185,494], // upper left, mirrored from the fitted lower-left display
  [1242,521], // upper right, below the reference's blue rail
  [1240,600], // lower right, clear of the foreground plant
  [1185,571], // lower left, above the reference's lower edge
],true);
const lowerLeftFasciaSurface=lowerLeftPivot.children[0];
lowerLeftFasciaSurface.geometry.dispose();
lowerLeftFasciaSurface.geometry=new THREE.PlaneGeometry(18,5,24,12);
fitSurfaceToReferenceQuad(lowerLeftFasciaSurface,[
  [551,666], // upper left, inside the left fascia bay
  [615,666], // upper right
  [612,697], // lower right, following the field's side edge
  [554,697], // lower left, following the opposite side edge
],'screen');
const lowerRightFasciaSurface=lowerRightPivot.children[0];
lowerRightFasciaSurface.geometry.dispose();
lowerRightFasciaSurface.geometry=new THREE.PlaneGeometry(18,5,24,12);
fitSurfaceToReferenceQuad(lowerRightFasciaSurface,[
  [1057,666], // upper left, mirrored from the left fascia bay
  [1121,666], // upper right
  [1118,697], // lower right
  [1060,697], // lower left
],'screen');


function syncViewLayout(){
  syncViewportMode();
  viewScale=THREE.MathUtils.clamp(viewScale,getMinViewScale(),getMaxViewScale());
  const {width,height}=getReferenceRenderSize();
  syncReferenceSize({width,height});
  positionCamera();
  syncReferenceBoardAnchors();
  renderer.setSize(mount.clientWidth,mount.clientHeight);
  syncPanBounds({width,height});
}
const gameplay = new THREE.Group();
// Existing game uses XY with Z up; source arena uses XZ with Y up.
const gamePlane = new THREE.Group();
gamePlane.position.copy(field.position);
gamePlane.position.y += .025;
gamePlane.rotation.x=-Math.PI/2;
fieldPivot.add(gamePlane);
gamePlane.add(gameplay);
// Preserve the unlit field texture while allowing real model shadows over it.
const shadowSurface = new THREE.Mesh(fieldGeo.clone(), new THREE.ShadowMaterial({
  color: 0x001016, opacity: .48, transparent: true,
  depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
}));
shadowSurface.position.copy(field.position);
shadowSurface.scale.copy(field.scale);
shadowSurface.receiveShadow = true;
fieldPivot.add(shadowSurface);

// Parallel rays along the field normal keep an elevated apple's shadow in its cell.
const overhead = new THREE.DirectionalLight(0xe5ffff, 1.2);
overhead.position.set(0, 0, 60);
const overheadTarget = new THREE.Object3D();
gamePlane.add(overheadTarget);
overhead.target = overheadTarget;
overhead.castShadow = true;
overhead.shadow.mapSize.set(2048, 2048);
const shadowWidth = fieldSettings.surface.width * fieldSettings.surface.scaleX / 2 + 2;
const shadowDepth = fieldSettings.surface.depth * fieldSettings.surface.scaleY / 2 + 2;
overhead.shadow.camera.left = -shadowWidth;
overhead.shadow.camera.right = shadowWidth;
overhead.shadow.camera.top = shadowDepth;
overhead.shadow.camera.bottom = -shadowDepth;
overhead.shadow.camera.near = .1;
overhead.shadow.camera.far = 100;
overhead.shadow.bias = -.0001;
overhead.shadow.normalBias = .01;
gamePlane.add(overhead);

let previousWidth=0, previousHeight=0;
let previousMountWidth=0, previousMountHeight=0;
const rendererSize = new THREE.Vector2();
const following = new FollowingCamera();
const viewportCamera = new THREE.PerspectiveCamera();
const correctRoundSymbols=createScreenRoundCorrection();
const fieldOutline = Array.from({length:fieldPos.count},()=>new THREE.Vector3());
const headWorld = new THREE.Vector3();
const fieldCentre = new THREE.Vector3();
const fixedCentre = new THREE.Vector3();
const movingCentre = new THREE.Vector3();
let cameraLevel = getCurrentLevel();
function setCloseUpMode(enabled){
   if(closeUpMode===enabled)return;
   if(enabled)normalView={x:pan.x,y:pan.y};
   closeUpMode=enabled;
   viewScale=enabled?4:1.6;
   pan.x=enabled?0:normalView.x;
   pan.y=enabled?0:normalView.y;
   following.active=false;
   following.offset.set(0,0,0);
   dragPointer=null;
   lastTap=null;
   zoomLimitHint=!enabled;
   panHandle.classList.remove('is-panning');
   hudContainer?.setAttribute?.('data-view-mode',enabled?'close-up':'normal');
   for(const board of referenceBoards)board.visible=!enabled;
   syncViewLayout();
 }
return {
 gameplay,
 setCloseUpMode,
 render(delta=1/60){
   gameplay.scale.setScalar(fieldSettings.cellSize);
   const mountWidth=mount.clientWidth, mountHeight=mount.clientHeight;
   const expectedSize=getReferenceRenderSize();
   renderer.getSize(rendererSize);
   // R3F can resize its renderer/camera when a menu or other DOM layout changes,
   // even though the browser window has not changed. Restore the calibrated fit.
   if(previousWidth!==innerWidth || previousHeight!==innerHeight ||
      previousMountWidth!==mountWidth || previousMountHeight!==mountHeight ||
      rendererSize.x!==mountWidth || rendererSize.y!==mountHeight ||
      Math.abs(camera.aspect-expectedSize.width/expectedSize.height)>1e-6){
     previousWidth=innerWidth;previousHeight=innerHeight;
     previousMountWidth=mountWidth;previousMountHeight=mountHeight;
     syncViewLayout();
   }
   scene.updateMatrixWorld(true);
   for(let i=0;i<fieldPos.count;i++)fieldOutline[i].fromBufferAttribute(fieldPos,i).applyMatrix4(field.matrixWorld);
   const head=getSnakeUnitPosition()[0];
   if(head)headWorld.set(head[0],head[1],0).applyMatrix4(gameplay.matrixWorld);
   const level=getCurrentLevel();
   const activeCamera=closeUpMode?following.update(camera,fieldOutline,head?headWorld:null,{
     width:mountWidth,height:mountHeight,imageWidth:expectedSize.width,imageHeight:expectedSize.height,
     panX:pan.x,panY:pan.y+REFERENCE_OBJECTS_OFFSET_Y*expectedSize.height/REFERENCE_HEIGHT,
   },delta,level!==cameraLevel,true):camera;
   cameraLevel=level;
   hudContainer?.setAttribute?.('data-camera-mode',following.active?'following':'fixed');
   // Move the reference backdrop with the field rather than leaving it behind.
   field.getWorldPosition(fieldCentre);
   fixedCentre.copy(fieldCentre).project(camera);
   movingCentre.copy(fieldCentre).project(activeCamera);
   const backdropX=(movingCentre.x-fixedCentre.x)*expectedSize.width/2;
   const backdropY=-(movingCentre.y-fixedCentre.y)*expectedSize.height/2;
   mount.style.setProperty('--camera-pan-x',`${backdropX}px`);
   mount.style.setProperty('--camera-pan-y',`${backdropY}px`);
   syncSidePanelWidths(expectedSize.width,expectedSize.height,pan.x+backdropX,pan.y+backdropY);
   const imagePanY=pan.y+REFERENCE_OBJECTS_OFFSET_Y*expectedSize.height/REFERENCE_HEIGHT;
   cropCameraToViewport(viewportCamera,activeCamera,expectedSize.width,expectedSize.height,
     mountWidth,mountHeight,pan.x,imagePanY);
   correctRoundSymbols(gameplay,viewportCamera,mountWidth,mountHeight);
   // Preserve the old canvas boundary when the reference image is smaller than
   // the screen, without allocating pixels for its offscreen portion.
   const left=Math.max(0,(mountWidth-expectedSize.width)/2+pan.x);
   const right=Math.min(mountWidth,(mountWidth+expectedSize.width)/2+pan.x);
   const top=Math.max(0,(mountHeight-expectedSize.height)/2+imagePanY);
   const bottom=Math.min(mountHeight,(mountHeight+expectedSize.height)/2+imagePanY);
   renderer.setScissor(left,mountHeight-bottom,Math.max(0,right-left),Math.max(0,bottom-top));
   // Clear the whole viewport before clipping to avoid stale pixels after pan/zoom.
   renderer.setScissorTest(false);
   renderer.clear();
   renderer.setScissorTest(true);
   renderer.render(scene,viewportCamera);
   renderer.setScissorTest(false);
 },
 dispose(){
   controller.abort();
   for(const side of ['left','right','top','bottom'])hudStyle?.removeProperty(`--arena-gap-${side}`);
   hudContainer?.removeAttribute?.('data-info-layout');
   hudContainer?.removeAttribute?.('data-info-rotated');
   hudContainer?.removeAttribute?.('data-camera-mode');
   hudContainer?.removeAttribute?.('data-view-mode');
   mount.style.setProperty('--camera-pan-x','0px');
   mount.style.setProperty('--camera-pan-y','0px');
   const geometries=new Set(),materials=new Set(),textures=new Set();
   scene.traverse(object=>{
     if(object.geometry)geometries.add(object.geometry);
     if(object.material)for(const m of Array.isArray(object.material)?object.material:[object.material])materials.add(m);
   });
   materials.forEach(m=>{for(const value of Object.values(m))if(value?.isTexture)textures.add(value)});
   geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
   overhead.shadow.dispose();
   scene.clear();
 }
};
}
