import * as THREE from "three"
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import React, { Component }  from 'react';
import { getFCP } from "web-vitals";
import './App.css';

const _VS = `

varying vec3 v_Normal;
varying vec2 v_uv;

void main(){
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  v_Normal = normal;
  v_uv = uv;

}
`;

const _FS = `
uniform sampler2D v_texture;

varying vec3 v_Normal;
varying vec2 v_uv;

void main() {
  vec4 tex = texture2D(v_texture, v_uv);
  gl_FragColor = vec4(tex.xyz, 1);
}
`

const _BARVS = `
varying vec2 v_uv;

void main(){
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  v_uv = uv;

}
`

const _BARFS = `
varying vec2 v_uv;

void main() {
  vec2 adjustedCoords = v_uv;
  adjustedCoords.y = 2.0 * adjustedCoords.y;

  vec2 pointsOnLineSeg = vec2(clamp(adjustedCoords.x, 0.5, 1.0), clamp(adjustedCoords.y, 0.35, 1.65));
  float sdf = distance(adjustedCoords, pointsOnLineSeg) * 2.0 - 1.0;

  float borderSDF = sdf + 0.15;

  if(sdf > 0.0) discard;
  else{
    gl_FragColor = vec4(0, borderSDF,borderSDF, 0.975);
  }
}
`

const width = window.innerWidth
const height = window.innerHeight

const widthModifier = 0.25
const heightModifier = 0.25

const ArrayHeight = Math.floor(height * heightModifier)
const ArrayWidth = Math.floor(width * widthModifier)

//data texture for shader!
const size = ArrayHeight * ArrayWidth
const data = new Uint8Array(4 * size)
const color = new THREE.Color (0xffffff)

const r = Math.floor(color.r * 255)
const g = Math.floor(color.g * 255)
const b = Math.floor(color.b * 255)

let pointerToX = 0
let pointerToY = 0

for(let i = 0; i < size; i++){
  const stride = i * 4;
  data[stride] = 255//r * Math.random()
  data[stride + 1] = 255//g * Math.random()
  data[stride + 2] = 255//b * Math.random()
  data[stride + 3] = 255
}

const texture = new THREE.DataTexture(data, ArrayWidth, ArrayHeight, THREE.RGBAFormat)

const fontLoader = new FontLoader()

//console.log(texture)
texture.needsUpdate = true

//texture.repeat.set(1, 2)

//for mk1 press
let press = false


//colours
const sandColour = new THREE.Vector3(194, 178, 128)
const waterColour = new THREE.Vector3(35, 35, 255)
const woodColour = new THREE.Vector3(150, 105, 25)
const gasColour = new THREE.Vector3(100, 100, 100) 
const emptyColour = new THREE.Vector3(15, 27, 27)
const flameColour = new THREE.Vector3(255, 0, 0)
const gunpowderColour = new THREE.Vector3(55, 55, 55)
const acidColour = new THREE.Vector3(50, 205, 50)
const metalColour = new THREE.Vector3(176, 179, 183)

const red = new THREE.Vector3(245, 0, 0)
const yellow = new THREE.Vector3(245, 245, 0)
const orange = new THREE.Vector3(245, 165, 0)

//for mouse
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const scene = new THREE.Scene()

//for keyboard

//for threejs 
const camera = new THREE.OrthographicCamera(width / -(2 / widthModifier), width / (2 / widthModifier), height / (2 / heightModifier), height / -(2 / heightModifier), 0, 10)
const renderer = new THREE.WebGLRenderer()


//clock stuff
let clock = new THREE.Clock()
let delta = 0
let interval = 1/60

//extra stuff
let doItOnce = 0
const uiArray = []
let evenOdd = 0

//ui stuff
let bar, sand, water, gas, lava, acid, wood, metal, fire, gunpowder
let uiX = (ArrayWidth - 50) / 2
let uiY = 15 + (ArrayHeight - 100) / -2



const waterBlock = {
  type: 2,
  colour: waterColour,
  hasUpdated: 0,
  velocityX: 2,
  velocityY: 2,
  density: 3,
  spreadFactor: 4,
}

const sandBlock = {
  type: 1,
  colour: sandColour,
  hasUpdated: 0,
  velocityX: 2,
  velocityY: 2,
  density : 5,
  acidRes: 0.25,
}

const woodBlock = {
  type : 3, 
  colour: woodColour,
  hasUpdated: 0,
  velocityX: 0,
  velocityY: 0,
  density: 10,
  flammability: 0.20,
  acidRes: 0.02,
}

const gasBlock = {
  type : 4,
  colour : gasColour,
  hasUpdated: 0, 
  velocityX: 1, 
  velocityY: 1, 
  density: 2, 
  ttd: 50,
}

const flameBlock = {
  type :5, 
  colour: flameColour,
  hasUpdated: 0, 
  velocityX: 1,
  velocityY: 1,
  density: 2,
  ttd: 20,
}

const gunpowderBlock = {
  type : 6, 
  colour: gunpowderColour,
  hasUpdated: 0,
  velocityX: 2, 
  velocityY: 2,
  density: 5,
  flammability: 4.0,
  acidRes: 0.25,
}

const acidBlock = {
  type: 7,
  colour: acidColour,
  hasUpdated: 0,
  velocityX: 2,
  velocityY: 2,
  density: 4,
  spreadFactor: 3,
  flammability: 2.10,
}

const metalBlock = {
  type: 8,
  colour: metalColour,
  hasUpdated: 0, 
  velocityX: 0,
  velocityY: 0,
  density: 10,
  acidRes: 0.001
}

const emptyBlock = {
  type: 0,
  colour: emptyColour,
  hasUpdated: 0,
  velocityX: 0,
  velocityY: 0,
  density: 0,
}


let selectedBlock = emptyBlock
let colourVariance = 25


//set up info array
const blockArray = new Array(size)
for(let i = 0; i < size; i++){
  blockArray[i] = JSON.parse(JSON.stringify(selectedBlock))

  data[i * 4] = emptyColour.x
  data[i * 4 + 1] = emptyColour.y
  data[i * 4 + 2] = emptyColour.z
  data[i * 4 + 3] = 255
}

console.log("width = " + Math.floor(width * widthModifier))
console.log("height = " + Math.floor(height * heightModifier))

init()

const App = () => {
  animate()
  return(
    <>
      <div id = "sandInfo">Sand</div>
    </>
  );
}

const getRndInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min)
}

const brensehamLine = (x0, y0, x1, y1, directBlock) => {
  let dx = Math.abs(x1 - x0)
  let dy = -Math.abs(y1 - y0)
  let sx = (x0 < x1) ? 1 : -1
  let sy = (y0 < y1) ? 1 : -1
  let err = dx + dy

  let pixel = x0 + y0 * ArrayWidth
  let prevPixel = x0 + y0 * ArrayWidth

  while(true) {
    prevPixel = pixel
    //addBlock(prevPixel, gasBlock)
    if((x0 === x1) && (y0 === y1)){
      return prevPixel
    }
    let e2 = 2 * err
    if (e2 >= dy) {
      if(x0 === x1){
        return prevPixel
      }
      err += dy
      x0 += sx
    }
    if (e2 <= dx) {
      if(y0 === y1){
        return prevPixel
      }
      err += dx
      y0 += sy
    }

    pixel = x0 + y0 * ArrayWidth
    
    if(y0 <= 0){
      return prevPixel
    }

    if(directBlock.density <= blockArray[pixel].density){
      return prevPixel
    }
  }
}

function init () {
  renderer.setSize(width, height)
  renderer.domElement.addEventListener( 'pointermove', onPointerMove)
  renderer.domElement.addEventListener( 'pointerdown', onPointerDown )
  renderer.domElement.addEventListener( 'pointerup', onPointerUp )

  document.body.appendChild(renderer.domElement)

  camera.position.z = 1

  //shader materials
  const paintMap = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(ArrayWidth , ArrayHeight),
    new THREE.ShaderMaterial({
      uniforms:{
        v_texture: {value: texture}
      },
      vertexShader: _VS,
      fragmentShader: _FS,
    })
);
paintMap.name = "Canvas"
scene.add(paintMap)

setupUI()

}

function setupUI() {
  bar = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(50 , 100),
    new THREE.ShaderMaterial({
      uniforms:{
      },
      vertexShader: _BARVS,
      fragmentShader: _BARFS,
    })
);

  bar.translateX(uiX)
  bar.translateY(uiY)
  bar.name = "sideBar"
  scene.add( bar );

  uiArray.push(bar)

  sand = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10), 
    new THREE.MeshBasicMaterial({color: 0xCCCC99})
  )

  sand.translateX(uiX - 10)
  sand.translateY(uiY + 35)
  sand.name = "Sand"
  scene.add(sand)

  uiArray.push(sand)

  /*
  loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {

    const sandText = new TextGeometry( 'Hello three.js!', {
      font: font,
      size: 80,
      height: 5,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 10,
      bevelSize: 8,
      bevelOffset: 0,
      bevelSegments: 5
    } );
  } );
  */

  water = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10), 
    new THREE.MeshBasicMaterial({color: 0x2323FF})
  )

  water.translateX(uiX + 10)
  water.translateY(uiY + 35)
  water.name = "Water"
  scene.add(water)

  uiArray.push(water)

  gas = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10), 
    new THREE.MeshBasicMaterial({color: 0x646464})
  )

  gas.translateX(uiX - 10)
  gas.translateY(uiY + 15)
  gas.name = "Gas"
  scene.add(gas)

  uiArray.push(gas)

  wood = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10), 
    new THREE.MeshBasicMaterial({color: 0x966919})
  )

  wood.translateX(uiX + 10)
  wood.translateY(uiY + 15)
  wood.name = "Wood"
  scene.add(wood)

  uiArray.push(wood)

  acid = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10), 
    new THREE.MeshBasicMaterial({color: 0x32CD32})
  )

  acid.translateX(uiX - 10)
  acid.translateY(uiY - 5)
  acid.name = "Acid"
  scene.add(acid)

  uiArray.push(acid)

  fire = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10), 
    new THREE.MeshBasicMaterial({color: 0xff0000})
  )

  fire.translateX(uiX + 10)
  fire.translateY(uiY - 5)
  fire.name = "Fire"
  scene.add(fire)

  uiArray.push(fire)

  metal = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10), 
    new THREE.MeshBasicMaterial({color: 0xB0B3B7})
  )

  metal.translateX(uiX - 10)
  metal.translateY(uiY - 25)
  metal.name = "Metal"
  scene.add(metal)

  uiArray.push(metal)

  gunpowder = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10), 
    new THREE.MeshBasicMaterial({color: 0x373737})
  )

  gunpowder.translateX(uiX + 10)
  gunpowder.translateY(uiY - 25)
  gunpowder.name = "Gunpowder"
  scene.add(gunpowder)

  uiArray.push(gunpowder)
}

function addBlock(position, block){
    //console.log(block)
    if(blockArray[position].density < block.density){
      blockArray[position] = JSON.parse(JSON.stringify(block))

      let ranR = getRndInteger(0, colourVariance)
      let ranG = getRndInteger(0, colourVariance)
      let ranB = getRndInteger(0, colourVariance)

      let randomR = ranR + block.colour.x > 255 ? 255 : ranR + block.colour.x
      let randomG = ranG + block.colour.y > 255 ? 255 : ranG + block.colour.y
      let randomB = ranB + block.colour.z > 255 ? 255 : ranB + block.colour.z

      data[position * 4] = randomR
      data[position * 4 + 1] = randomG
      data[position * 4 + 2] = randomB
      data[position * 4 + 3] = 255

      if(block.type === 4){
        block.ttd = getRndInteger(5, 150)
      }
      if(block.type === 5){
        block.ttd = getRndInteger(10, 40)
        block.colour = selectFireColour()
      }
    } else if (block.type === 0){
      blockArray[position] = JSON.parse(JSON.stringify(block))

      data[position * 4] = emptyColour.x
      data[position * 4 + 1] = emptyColour.y
      data[position * 4 + 2] = emptyColour.z
      data[position * 4 + 3] = 255
    }
}

function logic(){
// ------------- pointer logic -------------
raycaster.setFromCamera(pointer, camera)

const intersects = raycaster.intersectObjects( uiArray );
if(intersects.length > 0){
  for(let i = 0; i < intersects.length; i++){
    if(intersects[i].object.name === "Sand") {

      addBlock(150 + ArrayWidth * 15, gasBlock)
    }
  }
}

if(press){
  //console.log("X = " + pointer.x + "         Y = " + pointer.y) 
  //scale 1
  /*
  addBlock(pointerToX + pointerToY * ArrayWidth, selectedBlock)
  */
  
  //scale 2
  addBlock(pointerToX + pointerToY * ArrayWidth, selectedBlock)

  addBlock((pointerToX + 1) + pointerToY * ArrayWidth, selectedBlock)
  addBlock((pointerToX - 1) + pointerToY * ArrayWidth, selectedBlock)
  addBlock(pointerToX + (pointerToY + 1) * ArrayWidth, selectedBlock)
  addBlock(pointerToX + (pointerToY - 1) * ArrayWidth, selectedBlock)

  addBlock((pointerToX + 1) + (pointerToY + 1) * ArrayWidth, selectedBlock)
  addBlock((pointerToX - 1) + (pointerToY - 1) * ArrayWidth, selectedBlock)
  addBlock((pointerToX - 1) + (pointerToY + 1) * ArrayWidth, selectedBlock)
  addBlock((pointerToX + 1) + (pointerToY - 1) * ArrayWidth, selectedBlock)

  addBlock((pointerToX + 2) + pointerToY * ArrayWidth, selectedBlock)
  addBlock((pointerToX - 2) + pointerToY * ArrayWidth, selectedBlock)
  addBlock(pointerToX + (pointerToY + 2) * ArrayWidth, selectedBlock)
  addBlock(pointerToX + (pointerToY - 2) * ArrayWidth, selectedBlock)
  
  /*
  blockArray[pointerToX + pointerToY * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))

  blockArray[(pointerToX + 1) + pointerToY * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))
  blockArray[(pointerToX - 1) + pointerToY * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))
  blockArray[pointerToX + (pointerToY + 1) * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))
  blockArray[pointerToX + (pointerToY - 1) * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))

  blockArray[(pointerToX + 1) + (pointerToY + 1) * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))
  blockArray[(pointerToX - 1) + (pointerToY - 1) * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))
  blockArray[(pointerToX - 1) + (pointerToY + 1) * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))
  blockArray[(pointerToX + 1) + (pointerToY - 1) * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))

  blockArray[(pointerToX + 2) + pointerToY * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))
  blockArray[(pointerToX - 2) + pointerToY * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))
  blockArray[pointerToX + (pointerToY + 2) * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))
  blockArray[pointerToX + (pointerToY - 2) * ArrayWidth] = JSON.parse(JSON.stringify(selectedBlock))

  */
  /*
  //scale 3
  blockArray[pointerToX + pointerToY * ArrayWidth].type = 1

  blockArray[(pointerToX + 1) + pointerToY * ArrayWidth].type = 1
  blockArray[(pointerToX - 1) + pointerToY * ArrayWidth].type = 1
  blockArray[pointerToX + (pointerToY + 1) * ArrayWidth].type = 1
  blockArray[pointerToX + (pointerToY - 1) * ArrayWidth].type = 1

  blockArray[(pointerToX + 1) + (pointerToY + 1) * ArrayWidth].type = 1
  blockArray[(pointerToX - 1) + (pointerToY + 1) * ArrayWidth].type = 1
  blockArray[(pointerToX + 1) + (pointerToY - 1) * ArrayWidth].type = 1
  blockArray[(pointerToX - 1) + (pointerToY - 1) * ArrayWidth].type = 1

  blockArray[(pointerToX + 1) + (pointerToY + 1) * ArrayWidth].type = 1
  blockArray[(pointerToX - 1) + (pointerToY + 1) * ArrayWidth].type = 1
  blockArray[(pointerToX + 1) + (pointerToY - 1) * ArrayWidth].type = 1
  blockArray[(pointerToX - 1) + (pointerToY - 1) * ArrayWidth].type = 1

  blockArray[(pointerToX + 2) + pointerToY * ArrayWidth].type = 1
  blockArray[(pointerToX - 2) + pointerToY * ArrayWidth].type = 1
  blockArray[pointerToX + (pointerToY + 2) * ArrayWidth].type = 1
  blockArray[pointerToX + (pointerToY - 2) * ArrayWidth].type = 1
  */
}

// ------------- update functions -------------


//evenOdd = getRndInteger(0,2)

if(evenOdd === 1){
  for(let y = 0; y < ArrayHeight; y++){
    for(let x = 0; x < ArrayWidth; x++){
      let point = x + y * ArrayWidth
      if(blockArray[point].type !== 0 && blockArray[point].hasUpdated === 0) {
        if(blockArray[point].type === 1){
          blockArray[point].hasUpdated = 1
          updateSand(x, y)
          continue
        }
        if(blockArray[point].type === 2){
          blockArray[point].hasUpdated = 1
          updateWater(x, y)  
          continue
        }
        if(blockArray[point].type === 4){
          blockArray[point].hasUpdated = 1
          updateGas(x,y)
          continue
        }
        if(blockArray[point].type === 5){
          blockArray[point].hasUpdated = 1
          updateFire(x, y)
          continue
        }
        if(blockArray[point].type === 6){
          blockArray[point].hasUpdated = 1
          updateSand(x, y)
          continue
        }
        if(blockArray[point].type === 7){
          blockArray[point].hasUpdated = 1
          updateAcid(x, y)
          continue
        }
      }
    }
  }
  evenOdd = 0
} 
else if(evenOdd === 0){
  for(let y = 0; y < ArrayHeight; y++){
    for(let x = ArrayWidth - 1; x >= 0; x--){
      let point = x + y * ArrayWidth
  
      if(blockArray[point].type !== 0 && blockArray[point].hasUpdated === 0) {
        if(blockArray[point].type === 1){
          blockArray[point].hasUpdated = 1
          updateSand(x, y)
          continue
        }
        if(blockArray[point].type === 2){
          blockArray[point].hasUpdated = 1
          updateWater(x , y)  
          continue
        }
        if(blockArray[point].type === 4){
          blockArray[point].hasUpdated = 1
          updateGas(x,y)
          continue
        }
        if(blockArray[point].type === 5){
          blockArray[point].hasUpdated = 1
          updateFire(x, y)
          continue
        }
        if(blockArray[point].type === 6){
          blockArray[point].hasUpdated = 1
          updateSand(x, y)
          continue
        }
        if(blockArray[point].type === 7){
          blockArray[point].hasUpdated = 1
          updateAcid(x, y)
          continue
        }
      }
    }
  }
  evenOdd = 1
}

//reset has Updated
for(let x = 0; x < size; x++){
  blockArray[x].hasUpdated = 0
}
texture.needsUpdate = true
}

function animate() {
  requestAnimationFrame( animate );
  delta += clock.getDelta()
  if(delta > interval) {
    logic()
    renderer.render(scene, camera)
    delta = delta % interval
  }
  //drawUI()
}

function checkFireLike(accessPoint){
  if(blockArray[accessPoint].flammability !== 0)
  {
    if(getRndInteger(0, 1001) <= blockArray[accessPoint].flammability * 100)
    {
      burnBlock(accessPoint, flameBlock)
    }
  }
}

function checkAcidLike(accessPoint){
  if(blockArray[accessPoint].acidRes !== 0)
  {
    if(getRndInteger(0, 1001) <= blockArray[accessPoint].acidRes * 100)
    {
      addBlock(accessPoint, emptyBlock)
    }
  }
}

function selectFireColour(){
  let num = getRndInteger(0, 3)

  if(num === 0) {
    return red
  } else if (num === 1){
    return yellow
  } else if(num === 2){
    return orange
  }
}

function updateFire(x, y) {
  let point = x + y * ArrayWidth

  blockArray[point].ttd--
  if(blockArray[point].ttd <= 0){
    addBlock(point, emptyBlock)
    addBlock(point, gasBlock)
  }

  let accessPoint = point - ArrayWidth //below
  checkFireLike(accessPoint)
  
  accessPoint = point - ArrayWidth - 1 //below left
  checkFireLike(accessPoint)

  accessPoint = point - ArrayWidth + 1 //below right
  checkFireLike(accessPoint)

  accessPoint = point - 1 //left
  checkFireLike(accessPoint)

  accessPoint = point + 1 //right
  checkFireLike(accessPoint)

  accessPoint = point + ArrayWidth + 1 //up right
  checkFireLike(accessPoint)

  accessPoint = point + ArrayWidth - 1 //up left
  checkFireLike(accessPoint)

  accessPoint = point + ArrayWidth //up 
  checkFireLike(accessPoint)

  let temp = getRndInteger(0, 2)

  if(temp === 0)
  {
    if(blockArray[point + ArrayWidth].density < blockArray[point].density){
       switchBlocks(point, point + ArrayWidth,  blockArray[point].colour)
    }
  }

}

function burnBlock(point, block){
    let densityLength = blockArray[point].density * 2.5

    blockArray[point] = JSON.parse(JSON.stringify(block))
    blockArray[point].colour = selectFireColour()

    let ranR = getRndInteger(0, colourVariance)
    let ranG = getRndInteger(0, colourVariance)
    let ranB = getRndInteger(0, colourVariance)

    let randomR = ranR + block.colour.x > 255 ? 255 : ranR + blockArray[point].colour.x
    let randomG = ranG + block.colour.y > 255 ? 255 : ranG + blockArray[point].colour.y
    let randomB = ranB + block.colour.z > 255 ? 255 : ranB + blockArray[point].colour.z

    data[point * 4] = randomR
    data[point * 4 + 1] = randomG
    data[point * 4 + 2] = randomB
    data[point * 4 + 3] = 2555

    blockArray[point].ttd = getRndInteger(10, 40)
    blockArray[point].ttd += densityLength
}

function updateAcid(x, y){
  let point = x + y * ArrayWidth
  let block = blockArray[point]

  let accessPoint = point - ArrayWidth //below
  checkAcidLike(accessPoint)

  accessPoint = point - 1 //left
  checkAcidLike(accessPoint)

  accessPoint = point + 1 //right
  checkAcidLike(accessPoint)

  accessPoint = point + ArrayWidth //up 
  checkAcidLike(accessPoint)

  if( y < 2){
    return
  }

  checkWaterLike(point, block, x, y)
}

function checkWaterLike(point, block, x, y){
  if(getRndInteger(0,2) === 1){
    if(block.density > blockArray[point - ArrayWidth].density){
      switchBlocks(point, brensehamLine(x, y, x, y - block.velocityY, block), block.colour )
    } 
    else if(block.density > blockArray[point - ArrayWidth - 1].density ) {
      switchBlocks(point, brensehamLine(x, y, x - block.velocityX, y - block.velocityY, block), block.colour )
    } 
    else if(block.density > blockArray[point - ArrayWidth + 1].density) {
      switchBlocks(point, brensehamLine(x, y, x + block.velocityX, y - block.velocityY, block), block.colour )
    } 
    else if(block.density > blockArray[point - 1].density) {
      switchBlocks(point, brensehamLine(x, y, x - block.velocityX - block.spreadFactor, y, block), block.colour )
    } 
    else if(block.density > blockArray[point + 1].density) {
      switchBlocks(point, brensehamLine(x, y, x + block.velocityX + block.spreadFactor, y, block), block.colour )
    } 
  } else {
    if(block.density > blockArray[point - ArrayWidth].density){
      switchBlocks(point, brensehamLine(x, y, x, y - block.velocityY, block), block.colour )
    } 
    else if(block.density > blockArray[point - ArrayWidth + 1].density ) {
      switchBlocks(point, brensehamLine(x, y, x + block.velocityX, y - block.velocityY, block), block.colour )
    } 
    else if(block.density > blockArray[point - ArrayWidth - 1].density) {
      switchBlocks(point, brensehamLine(x, y, x - block.velocityX, y - block.velocityY, block), block.colour )
    } 
    else if(block.density > blockArray[point + 1].density) {
      switchBlocks(point, brensehamLine(x, y, x + block.velocityX + block.spreadFactor, y, block), block.colour )
    } 
    else if(block.density > blockArray[point - 1].density) {
      switchBlocks(point, brensehamLine(x, y, x - block.velocityX - block.spreadFactor, y, block), block.colour )
    } 
  }
  
}

function updateWater(x, y) {
  let point = x + y * ArrayWidth
  let block = blockArray[point]

  if( y < 2){
    return
  }

  checkWaterLike(point, block, x, y)
}

function checkGasLike(point, block, x, y){
  if(block.density > blockArray[point + ArrayWidth].density){
    switchBlocks(point, brensehamLine(x, y, x, y + block.velocityY, block), block.colour )
  } 
  else if(block.density > blockArray[point + ArrayWidth - 1].density ) {
    switchBlocks(point, brensehamLine(x, y, x - block.velocityX, y + block.velocityY, block), block.colour )
  } 
  else if(block.density > blockArray[point + ArrayWidth + 1].density) {
    switchBlocks(point, brensehamLine(x, y, x + block.velocityX , y + block.velocityY, block), block.colour )
  } 
}

function updateGas(x, y) {
  let point = x + y * ArrayWidth

  blockArray[point].ttd--
  if(blockArray[point].ttd <= 0){
    addBlock(point, emptyBlock )
  }

  let block = blockArray[point]


  if(y >= ArrayHeight - 1){
    return
  }

  checkGasLike(point, block, x, y)

  /*
  if(blockArray[x + ArrayWidth].density < blockArray[x].density){
    switchBlocks(x, checkUp(x, gasBlock.velocityY), gasColour)
  } 
  else if(blockArray[x + ArrayWidth - 1].density < selectedDensity) {
    switchBlocks(x, checkUpLeft(x, gasBlock.velocityX, gasBlock.velocityY), gasColour)
  } 
  else if(blockArray[x + ArrayWidth + 1].density < selectedDensity) {
    switchBlocks(x, checkUpRight(x, gasBlock.velocityX, gasBlock.velocityY), gasColour)
  } 
  */
}

function checkSandLike(point, block, x, y){
  if(block.density > blockArray[point - ArrayWidth].density){
    switchBlocks(point, brensehamLine(x, y, x, y - block.velocityY, block), block.colour )
  } 
  else if(block.density > blockArray[point - ArrayWidth - 1].density ) {
    switchBlocks(point, brensehamLine(x, y, x - block.velocityX, y - block.velocityY, block), block.colour )
  } 
  else if(block.density > blockArray[point - ArrayWidth + 1].density) {
    switchBlocks(point, brensehamLine(x, y, x + block.velocityX , y - block.velocityY, block), block.colour )
  } 
  
}
function updateSand(x, y){
  if(y <= 1){
    return
  }

  let point = x + y * ArrayWidth
  let block = blockArray[point]

  checkSandLike(point, block, x, y)
}

function switchBlocks(x, futureX, colour) { 
  if(x === futureX){ //if theres no reason to switch blocks :///
    return
  }

  let tempBlock = blockArray[x]
  blockArray[x] = blockArray[futureX]
  blockArray[futureX] = tempBlock


  let tempRGB = new THREE.Vector3(data[futureX * 4], data[futureX * 4 + 1], data[futureX * 4 + 2])

  data[(x) * 4] = tempRGB.x
  data[(x) * 4 + 1] = tempRGB.y
  data[(x) * 4 + 2] = tempRGB.z
  data[(x) * 4 + 3] = 255

  let ranR = getRndInteger(0, colourVariance)
  let ranG = getRndInteger(0, colourVariance)
  let ranB = getRndInteger(0, colourVariance)

  let randomR = ranR + colour.x > 255 ? 255 : ranR + colour.x
  let randomG = ranG + colour.y > 255 ? 255 : ranG + colour.y
  let randomB = ranB + colour.z > 255 ? 255 : ranB + colour.z


  data[(futureX) * 4] = randomR
  data[(futureX) * 4 + 1] = randomG
  data[(futureX) * 4 + 2] = randomB
  data[(futureX) * 4 + 3] = 255

  /*
  let tempBlock = blockArray[x]
  switch(direction){
    case 0: //up
      blockArray[x] = blockArray[x + ArrayWidth]
      blockArray[x + ArrayWidth] = tempBlock
      break;
    case 1: //upright
      blockArray[x] = blockArray[x + ArrayWidth + 1]
      blockArray[x + ArrayWidth + 1] = tempBlock
      break;
    case 2: //right
      blockArray[x] = blockArray[x + 1]
      blockArray[x + 1] = tempBlock
      break;
    case 3: //downright
      blockArray[x] = blockArray[x - ArrayWidth + 1]
      blockArray[x - ArrayWidth + 1] = tempBlock
      break;
    case 4: //down
      blockArray[x] = blockArray[x - ArrayWidth]
      blockArray[x - ArrayWidth] = tempBlock
      break;
    case 5: //downleft
      blockArray[x] = blockArray[x - ArrayWidth - 1]
      blockArray[x - ArrayWidth - 1] = tempBlock
      break;
    case 6: //left
      blockArray[x] = blockArray[x - 1]
      blockArray[x - 1] = tempBlock
      break;
    case 7: //upleft
      blockArray[x] = blockArray[x + ArrayWidth - 1]
      blockArray[x + ArrayWidth - 1] = tempBlock
      break;
  }
  */

}

function onPointerDown(event) {
  press = true
  

}

function onPointerUp(event) {
  press = false
}

function onPointerMove(event) {
	pointer.x = ( event.clientX / width ) * 2 - 1;
	pointer.y = - ( event.clientY / height ) * 2 + 1;

  pointer.x = Math.floor(pointer.x * width / (2 / widthModifier))
  pointer.y = Math.floor(pointer.y * height / (2 / heightModifier))

  pointerToX = Math.floor(pointer.x + (width / (2 / widthModifier)))
  pointerToY = Math.floor(pointer.y + (height / (2 / heightModifier)))

  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

document.onkeydown = function (e) {
  if(e.key === '1'){
    selectedBlock = sandBlock
  } else if (e.key === '2') {
    selectedBlock = waterBlock
  } else if (e.key === '3') {
    selectedBlock = woodBlock
  } else if (e.key === '0') {
    selectedBlock = emptyBlock
  } else if (e.key === '4') {
    selectedBlock = gasBlock
  } else if (e.key === '5') {
    selectedBlock = flameBlock
  } else if (e.key === '6') {
    selectedBlock = gunpowderBlock
  } else if (e.key === '7') {
    selectedBlock = acidBlock
  } else if (e.key === '8') {
    selectedBlock = metalBlock
  }
}

export default App;
