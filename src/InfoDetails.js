import React from "react";
import * as THREE from "three"

import {scrollY} from './Overhead'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( 0, 0 );
document.body.appendChild( renderer.domElement );
//renderer.setClearColor( 0xffffff, 0);

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {
	requestAnimationFrame( animate );
    renderer.render( scene, camera );
    if(scrollY > 14){
        renderer.setSize(window.innerWidth, window.innerHeight)
        console.log(cube)
        logic()
    } else {
        renderer.setSize(0,0)
    }
}

function logic(){
    if(scrollY >= 15){

    }
}

const InfoDetails = () => {
    animate() 
    return(
        <>
        </>
    );
  }

  export default InfoDetails