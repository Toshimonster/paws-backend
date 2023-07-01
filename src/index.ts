import * as Interfaces from './Interfaces'
import * as States from './States'
import Driver from "./Driver";

const Paws = {
    States: States,
    Interfaces: Interfaces,
    Driver: Driver
}

export = Paws


/*Object.defineProperty(Driver, "Interfaces", {
    configurable: false,
    enumerable: false,
    value: Interfaces
})

Object.defineProperty(Driver, "States", {
    configurable: false,
    enumerable: false,
    value: States
})

Driver.default = Driver
export = Paws*/