import Block from './Block.js'

export default class MovableSolid extends Block {
    constructor(acidRes, density, blockName) {
        super(density, blockName)
        this.acidRes = acidRes
    }

    update(){
        
    }
}