import * as THREE from "three"

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

for(let i = 0; i < size; i++){
  const stride = i * 4;
  data[stride] = 255//r * Math.random()
  data[stride + 1] = 255//g * Math.random()
  data[stride + 2] = 255//b * Math.random()
  data[stride + 3] = 255
}

const texture = new THREE.DataTexture(data, ArrayWidth, ArrayHeight, THREE.RGBAFormat)

//console.log(texture)
texture.needsUpdate = true

//texture.repeat.set(1, 2)

//for mk1 press
let press = false


//colours
const sandColour = new THREE.Vector3(194, 178, 128)
const waterColour = new THREE.Vector3(35, 35, 255)

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

let evenOdd = 0

const waterBlock = {
  type: 2,
  hasUpdated: 0,
  velocityX: 1,
  velocityY: 1,
}

const sandBlock = {
  type: 1,
  hasUpdated: 0,
  velocityX: 1,
  velocityY: 1,
}

const emptyBlock = {
  type: 0,
  hasUpdated: 0,
  velocityX: 0,
  velocityY: 0,
}

let selectedBlock = emptyBlock

//set up info array
const blockArray = new Array(size)
for(let i = 0; i < size; i++){
  blockArray[i] = JSON.parse(JSON.stringify(selectedBlock))
}

console.log("width = " + Math.floor(width * widthModifier))
console.log("height = " + Math.floor(height * heightModifier))

init()

const App = () => {
  animate()
}

const getRndInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min)
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
scene.add(paintMap)

//test material
/*
const plane = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(ArrayWidth, ArrayHeight),
  new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture})
);

scene.add(plane)
*/
}

function logic(){
// ------------- pointer logic -------------
raycaster.setFromCamera(pointer, camera)

let pointerToX = Math.floor(pointer.x + (width / (2 / widthModifier)))
let pointerToY = Math.floor(pointer.y + (height / (2 / heightModifier)))

if(press){
  
  /*
  //scale 1
  blockArray[pointerToX + pointerToY * ArrayWidth].type = 1
  */

  //scale 2
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
for(let x = 0; x < size; x++){
  if(blockArray[x].type !== 0 && blockArray[x].hasUpdated === 0)
  {
    if(blockArray[x].type === 1 && x > ArrayWidth){
      blockArray[x].hasUpdated = 1
      updateSand(x)
    }
    if(blockArray[x].type === 2 && x > ArrayWidth){
      blockArray[x].hasUpdated = 1
      updateWater(x)  
    }
  }
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
    if(evenOdd === 1){
      logic()
      evenOdd = 0
    } else {
      logic()
      evenOdd = 1
    }
    renderer.render(scene, camera)
    delta = delta % interval
  }
}

function updateWater(x) {

  if(blockArray[x - ArrayWidth].type === 0){
    switchBlocks(x, checkDown(x, waterBlock.velocityY), waterColour)
  } 
  else if(blockArray[x - ArrayWidth - 1].type === 0) {
    switchBlocks(x, checkDownLeft(x, waterBlock.velocityX, waterBlock.velocityY), waterColour)
  } 
  else if(blockArray[x - ArrayWidth + 1].type === 0) {
    switchBlocks(x, checkDownRight(x, waterBlock.velocityX, waterBlock.velocityY), waterColour)
  } 
  else if(blockArray[x - 1].type === 0){
    switchBlocks(x, checkLeft(x, waterBlock.velocityX), waterColour)
  } 
  else if(blockArray[x + 1].type === 0){
    switchBlocks(x, checkRight(x, waterBlock.velocityX), waterColour)
  } 
  /*
  if(blockArray[x - ArrayWidth].type === 0) {
    switchBlocks(x, x - ArrayWidth, waterColour) 
    return
  } 
  let rand = getRndInteger(0,2)
  if(rand === 0){
    if(blockArray[x - ArrayWidth - 1].type === 0) {
      switchBlocks(x, x - ArrayWidth - 1, waterColour) 
      return
    } else if(blockArray[x - ArrayWidth + 1].type === 0){
      switchBlocks(x, x - ArrayWidth + 1, waterColour) 
      return
    } 
  } else {
    if(blockArray[x - ArrayWidth + 1].type === 0) {
      switchBlocks(x, x - ArrayWidth + 1, waterColour) 
      return
    } else if(blockArray[x - ArrayWidth - 1].type === 0){
      switchBlocks(x, x - ArrayWidth - 1, waterColour) 
      return
    } 
  }
  if(rand === 0) {
    if(blockArray[x - 1].type === 0){
      switchBlocks(x, x - 1, waterColour)
    } else if(blockArray[x + 1].type === 0){
      switchBlocks(x, x + 1, waterColour)
    }
  } else {
    if(blockArray[x + 1].type === 0){
      switchBlocks(x, x + 1, waterColour)
    } else if(blockArray[x - 1].type === 0){
      switchBlocks(x, x - 1, waterColour)
    }
  }
}
*/

}

function checkDown(x, yVelocity){
  let latest = x
  yVelocity += 1
  for(let i = 1; i < yVelocity; i++){
    if(x - (ArrayWidth * i) <= ArrayWidth * 1){
      return latest
    }
    if(blockArray[x - (ArrayWidth * i)].type === 0){
      latest = x - (ArrayWidth * i)
    } else {
      return latest
    }
  }
  return latest
}

function checkLeft(x, xVelocity){
  let latest = x
  xVelocity += 1
  for(let i = 1; i < xVelocity; i++){
    if(x - i <= ArrayWidth * 1){
      return latest
    }
    if(blockArray[x - i].type === 0){
      latest = x - i
    } else {
      return latest
    }
  }
  return latest
}

function checkRight(x, xVelocity){
  let latest = x
  xVelocity += 1
  for(let i = 1; i < xVelocity; i++){
    if(x + i <= ArrayWidth * 1){
      return latest
    }
    if(blockArray[x + i].type === 0){
      latest = x + i
    } else {
      return latest
    }
  }
  return latest
}

function checkDownLeft(x, xVelocity, yVelocity){
  let latest = x
  xVelocity += 1
  yVelocity += 1

  let max = Math.max(yVelocity, xVelocity)

  xVelocity = xVelocity / max
  yVelocity = yVelocity / max

  let xVelocityStep = 0
  let yVelocityStep = 0
  //console.log("xVelocity = " + xVelocity  + "     yVelocity  = " + yVelocity)

  for(let i = 1; i < max; i++){
    xVelocityStep = Math.floor(xVelocity + xVelocityStep)
    yVelocityStep = Math.floor(yVelocity + yVelocityStep)

    //console.log("xVelocity = " + xVelocityStep  + "     yVelocity  = " + yVelocityStep)
    //console.log(x - (ArrayWidth * yVelocityStep) - xVelocityStep)
    if(x - (ArrayWidth * yVelocityStep) - xVelocityStep <= ArrayWidth * 1) {
      return latest
    }
    if(blockArray[x - (ArrayWidth * yVelocityStep) - xVelocityStep].type === 0){
      latest = x - (ArrayWidth * yVelocityStep) - xVelocityStep
    } else {
      return latest
    }
  }
  return latest
}

function checkDownRight(x, xVelocity, yVelocity){
  let latest = x
  xVelocity += 1
  yVelocity += 1

  let max = Math.max(yVelocity, xVelocity)

  xVelocity = xVelocity / max
  yVelocity = yVelocity / max

  let xVelocityStep = 0
  let yVelocityStep = 0
  //console.log("xVelocity = " + xVelocity  + "     yVelocity  = " + yVelocity)

  for(let i = 1; i < max; i++){
    xVelocityStep = Math.floor(xVelocity + xVelocityStep)
    yVelocityStep = Math.floor(yVelocity + yVelocityStep)

    //console.log("xVelocity = " + xVelocityStep  + "     yVelocity  = " + yVelocityStep)
    //console.log(x - (ArrayWidth * yVelocityStep) - xVelocityStep)
    if(x - (ArrayWidth * yVelocityStep) + xVelocityStep <= ArrayWidth * 1) {
      return latest
    }
    if(blockArray[x - (ArrayWidth * yVelocityStep) + xVelocityStep].type === 0){
      latest = x - (ArrayWidth * yVelocityStep) + xVelocityStep
    } else {
      return latest
    }
  }
  return latest
}

function updateSand(x){
  //console.log(checkDown(x, sandBlock.velocityY))
  if(blockArray[x - ArrayWidth].type === 0){
    switchBlocks(x, checkDown(x, sandBlock.velocityY), sandColour)
  } 
  else if(blockArray[x - ArrayWidth - 1].type === 0) {
    switchBlocks(x, checkDownLeft(x, sandBlock.velocityX, sandBlock.velocityY), sandColour)
  } 
  else if(blockArray[x - ArrayWidth + 1].type === 0) {
    switchBlocks(x, checkDownRight(x, sandBlock.velocityX, sandBlock.velocityY), sandColour)
  } 


  /*
  if(blockArray[x - ArrayWidth].type === 0) {
    switchBlocks(x, x - ArrayWidth, sandColour) 
    return
  }
  let rand = getRndInteger(0, 2)

  if(rand === 0){
    if(blockArray[x - ArrayWidth - 1].type === 0) {
      switchBlocks(x, x - ArrayWidth - 1, sandColour) 
    } else if(blockArray[x - ArrayWidth + 1].type === 0){
      switchBlocks(x, x - ArrayWidth + 1, sandColour) 
    }
  } else if (rand === 1) {
    if(blockArray[x - ArrayWidth + 1].type === 0) {
      switchBlocks(x, x - ArrayWidth + 1, sandColour) 
    } else if(blockArray[x - ArrayWidth - 1].type === 0){
      switchBlocks(x, x - ArrayWidth - 1, sandColour) 
    }
  }

}
*/
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

  data[(futureX) * 4] = colour.x
  data[(futureX) * 4 + 1] = colour.y
  data[(futureX) * 4 + 2] = colour.z
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
  /*
  console.log("x = " + Math.floor(pointer.x + (width / 8)) + "y = " + Math.floor(pointer.y + (height / 8)))
  //blockArray[Math.floor(pointer.x + (width / 8))][Math.floor(pointer.y + (height / 8))] = generateSand(pointer.x, pointer.y)

  blockArray[Math.floor(pointer.x + (width / 8))][Math.floor(pointer.y + (height / 8))] = generateSand(pointer.x, pointer.y)
  blockArray[Math.floor(pointer.x + (width / 8)) + 1][Math.floor(pointer.y + (height / 8))] = generateSand(pointer.x + 1, pointer.y)
  blockArray[Math.floor(pointer.x + (width / 8)) - 1][Math.floor(pointer.y + (height / 8))] = generateSand(pointer.x - 1, pointer.y)
  blockArray[Math.floor(pointer.x + (width / 8))][Math.floor(pointer.y + (height / 8)) + 1] = generateSand(pointer.x, pointer.y + 1)
  blockArray[Math.floor(pointer.x + (width / 8))][Math.floor(pointer.y + (height / 8)) - 1] = generateSand(pointer.x, pointer.y - 1)
  */
}

function onPointerUp(event) {
  press = false
}

function onPointerMove(event) {
	pointer.x = ( event.clientX / width ) * 2 - 1;
	pointer.y = - ( event.clientY / height ) * 2 + 1;

  pointer.x = Math.floor(pointer.x * width / (2 / widthModifier))
  pointer.y = Math.floor(pointer.y * height / (2 / heightModifier))
}

document.onkeydown = function (e) {
  if(e.key === '1'){
    selectedBlock = sandBlock
  } else if (e.key === '2') {
    selectedBlock = waterBlock
  } 
}

const brickArray = () => {

  for(let i = 0; i < width / 4; i++){
    let linePoints = []
    linePoints.push(new THREE.Vector3(width / -8 + i, height / 8, 0))
    linePoints.push(new THREE.Vector3(width / -8 + i, height / -8, 0))
    const lgeo = new THREE.BufferGeometry().setFromPoints(linePoints)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x111111 })
    const line = new THREE.Line(lgeo, lineMat)
    scene.add(line)

    let linePointsy = []
    linePointsy.push(new THREE.Vector3(width / 8 , height / -8 + i, 0))
    linePointsy.push(new THREE.Vector3(width / -8 , height / -8 + i, 0))
    const lygeo = new THREE.BufferGeometry().setFromPoints(linePointsy)
    const liney = new THREE.Line(lygeo, lineMat)
    scene.add(liney)
  }

  /*
  const negativeXpoints = []
  negativeXpoints.push(new THREE.Vector3(width / -8 + 1, height / 8 - 1, 0))
  negativeXpoints.push(new THREE.Vector3(width / -8 + 1, height / -8 + 1, 0))
  negativeXpoints.push(new THREE.Vector3(width / 8 - 1, height / -8 + 1, 0))
  negativeXpoints.push(new THREE.Vector3(width / 8 - 1, height / 8 - 1, 0))
  negativeXpoints.push(new THREE.Vector3(width / -8 + 1, height / 8 - 1, 0))

  const nxGeometry = new THREE.BufferGeometry().setFromPoints(negativeXpoints)
  const nxMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })
  const nxLine = new THREE.Line(nxGeometry, nxMaterial)
  scene.add(nxLine)
  */
}

const normalDirections = (xPosition, yPosition, zPosition) => {
  const xPoints = [];
  xPoints.push(new THREE.Vector3(xPosition, yPosition, zPosition))
  xPoints.push(new THREE.Vector3(10 + xPosition, yPosition, zPosition))
  const xGeometry = new THREE.BufferGeometry().setFromPoints(xPoints)
  const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 })
  const xLine = new THREE.Line(xGeometry, xMaterial)
  scene.add(xLine)

  const yPoints = [];
  yPoints.push(new THREE.Vector3(xPosition, yPosition, zPosition))
  yPoints.push(new THREE.Vector3(xPosition, 10 + yPosition, zPosition))
  const yGeometry = new THREE.BufferGeometry().setFromPoints(yPoints)
  const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 })
  const yLine = new THREE.Line(yGeometry, yMaterial)
  scene.add(yLine)

  const zPoints = [];
  zPoints.push(new THREE.Vector3(xPosition, yPosition, zPosition))
  zPoints.push(new THREE.Vector3(xPosition, yPosition, 10 + zPosition))
  const zGeometry = new THREE.BufferGeometry().setFromPoints(zPoints)
  const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff })
  const zLine = new THREE.Line(zGeometry, zMaterial)
  scene.add(zLine)
}

const generateSand = (xPos, yPos) => {
  /*
  const geometry = new THREE.PlaneGeometry(1, 1)
  const material = new THREE.MeshBasicMaterial({color: 0xd1c436, side: THREE.FrontSide })
  const sand = new THREE.Mesh(geometry, material)

  sand.translateX(xPos)
  sand.translateY(yPos)
  */
  return 1
}

export default App;
