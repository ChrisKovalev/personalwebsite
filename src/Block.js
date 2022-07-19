export default class Block {
    constructor(density, blockName){
        this.hasUpdated = 0
        this.density = density
        this.blockName = blockName
    }

    update(){
        this.hasUpdated = 1
    }
}