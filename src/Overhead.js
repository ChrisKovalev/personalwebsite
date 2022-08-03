import React from "react";
import App from './App';
import InfoDetails from './InfoDetails'

let scrollY = 0

export {scrollY}

class Overhead extends React.Component {
    constructor() {
        super()
        this.state = {
            hasUpdated: 0
        }
    }

    componentDidMount = () => {
        window.addEventListener("wheel", this.handleWheelScroll )
    }

    handleWheelScroll = (e) => {
        if(e.deltaY === 100){
            scrollY++
            this.updateHas()
        } 
        else if(e.deltaY === - 100){
            if(scrollY <= 0){
                scrollY = 0
            } else{
                scrollY--
                this.updateHas()
            }
        }
    }

    updateHas = () => {
        this.setState({
            hasUpdated: scrollY
        })
    }

    render() {
        return(
        <body style={{backgroundColor: "black"}}>
            {scrollY <= 14 && 
                <App></App>
            }
            {scrollY > 14 && 
                <InfoDetails></InfoDetails>
            }
        </body>
        );
    }
}

export default Overhead