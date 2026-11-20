const fs = require('fs'), ts = require('typescript'), assert = require('node:assert/strict'), THREE = require('three')
require.extensions['.ts'] = (module,file) => module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'), {
  compilerOptions:{module:ts.ModuleKind.CommonJS},
}).outputText,file)
const {createScreenRoundCorrection}=require('../src/assets/obstacleSymbols/screenRoundSymbols.ts')
const correct=createScreenRoundCorrection()
const root=new THREE.Group();root.scale.set(1.11,.9,1)
const plane=new THREE.Group();plane.rotation.x=-Math.PI/2+.157;root.add(plane)
const obstacle=new THREE.Group();plane.add(obstacle)
const correction=new THREE.Group();correction.name='screen-round-obstacle';correction.position.z=.025;obstacle.add(correction)
const spin=new THREE.Group();correction.add(spin)
const camera=new THREE.PerspectiveCamera(38,1,.1,240);camera.zoom=.45
for(const [width,height] of [[1672,941],[1200,600],[800,1200]]){
  camera.aspect=width/height;camera.updateProjectionMatrix()
  for(const position of [[0,0,0],[15,8,0],[-18,-9,0]]){
    obstacle.position.set(...position)
    for(const heading of [0,Math.PI/2,Math.PI,-Math.PI/2]){
      obstacle.rotation.z=heading
      for(const followX of [0,8]){
        camera.position.set(followX,50,25);camera.lookAt(followX,-1,0);camera.updateMatrixWorld(true)
        root.updateMatrixWorld(true);correct(root,camera,width,height)
        const centre=correction.getWorldPosition(new THREE.Vector3()).project(camera)
        for(const phase of [0,.7,2.3]){
          spin.rotation.z=phase;root.updateMatrixWorld(true)
          const radii=[]
          for(let i=0;i<64;i++){
            const angle=i*Math.PI/32
            const pixel=spin.localToWorld(new THREE.Vector3(.4*Math.cos(angle),.4*Math.sin(angle),0)).project(camera)
            radii.push(Math.hypot((pixel.x-centre.x)*width/2,(pixel.y-centre.y)*height/2))
          }
          assert(Math.max(...radii)/Math.min(...radii)<1.02,'ring remains round in projected pixels during rotation')
        }
        assert.deepEqual(obstacle.position.toArray(),position)
        assert.equal(obstacle.rotation.z,heading,'correction must not change glyph heading')
        assert.equal(correction.matrix.elements[2],0);assert.equal(correction.matrix.elements[6],0)
        const first=correction.matrix.toArray();root.updateMatrixWorld(true);correct(root,camera,width,height)
        assert.deepEqual(correction.matrix.toArray(),first,'correction must not accumulate')
      }
    }
  }
}
console.log('PASS: screen-round rings across positions, headings, camera tracking, viewport ratios and spin; floor plane/centres preserved; no accumulation.')
