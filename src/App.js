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

const ArrayHeight = Math.floor(height / 4)
const ArrayWidth = Math.floor(width / 4)

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

console.log(texture)
texture.needsUpdate = true

//texture.repeat.set(1, 2)

//set up info array
const blockArray = new Array(size)
blockArray.fill(0)

console.log("width = " + Math.floor(width / 4))
console.log("height = " + Math.floor(height / 4))

//for mk1 press
let press = false

//for 
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const scene = new THREE.Scene()

const camera = new THREE.OrthographicCamera(width / - 8, width / 8, height / 8, height / -8, 0, 10)
const renderer = new THREE.WebGLRenderer()

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

//clock stuff
let clock = new THREE.Clock()
let delta = 0
let interval = 1/30



init()

const App = () => {
  animate()
}

function init () {
  renderer.setSize(width, height)
  renderer.domElement.addEventListener( 'pointermove', onPointerMove)
  renderer.domElement.addEventListener( 'pointerdown', onPointerDown )
  renderer.domElement.addEventListener( 'pointerup', onPointerUp )

  document.body.appendChild(renderer.domElement)

  camera.position.z = 1
}

function logic(){
// ------------- pointer logic -------------
raycaster.setFromCamera(pointer, camera)

let pointerToX = Math.floor(pointer.x + (width / 8))
let pointerToY = Math.floor(pointer.y + (height / 8))

if(press){
  blockArray[pointerToX + pointerToY * ArrayWidth] = 1

  data[(pointerToX + pointerToY * ArrayWidth) * 4] = 0
  data[(pointerToX + pointerToY * ArrayWidth) * 4 + 1] = 0
  data[(pointerToX + pointerToY * ArrayWidth) * 4 + 2] = 0
  data[(pointerToX + pointerToY * ArrayWidth) * 4 + 3] = 0
}

// ------------- update functions -------------
for(let x = size - 1; x > 0; x--){
  if(blockArray[x] !== 0)
  {
    let selected = blockArray[pointerToX + pointerToY * ArrayWidth]
    if(selected === 1 && x > ArrayWidth){
      updateSand(selected, x)
    }
  }
}
console.log(blockArray)
texture.needsUpdate = true
}

function animate() {
  requestAnimationFrame(animate)
  delta += clock.getDelta()
  if(delta > interval) {
    logic()
    renderer.render(scene, camera)
    delta = delta % interval
  }
}


function updateSand(selected, x){
  if(blockArray[x - ArrayWidth] === 0) {
    blockArray[x - ArrayWidth] = 1
    blockArray[x] = 0

    data[(x) * 4] = 255
    data[(x) * 4 + 1] = 255
    data[(x) * 4 + 2] = 255
    data[(x) * 4 + 3] = 255

    data[(x  - ArrayWidth) * 4] = 0
    data[(x  - ArrayWidth) * 4 + 1] = 0
    data[(x  - ArrayWidth) * 4 + 2] = 0
    data[(x - ArrayWidth) * 4 + 3] = 0

    console.log("pushed!")
  } 
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

  pointer.x = Math.floor(pointer.x * width / 8)
  pointer.y = Math.floor(pointer.y * height / 8)
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
