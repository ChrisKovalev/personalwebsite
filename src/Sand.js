import MovableSolid from './MovableSolid.js'
import * as THREE from "three"
import * as MAIN from './App'

export default class Sand extends MovableSolid{
    constructor(velocityX, velocityY){
        super(0.25, 5, "Sand")
        this.colour = new THREE.Vector3(194, 178, 128)
        this.velocityX = velocityX
        this.velocityY = velocityY        
    }

    update(x, y){
        this.hasUpdated = 1
    }
}