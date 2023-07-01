import * as Interfaces from './Interfaces'
import * as States from './States'
import Driver from "./Driver";
import {GattServer} from "./Server";

const Paws = {
    States: States,
    Interfaces: Interfaces,
    Driver: Driver
}

export default Paws

if (require.main === module) {
    const stateAssetRoot = "/paws/ToshiProto/State Assets/"

    const Proto = new Paws.Driver({
        showFPS: true,
        verbose: true
    })

    const srv = new GattServer(Proto, "T")

    Proto.addInterfaces([
        new Paws.Interfaces.TextInterface(
            "TestInterface",
            {
                y: 10,
                x: 10,
                symbol: "!"
            }
        ),

        new Paws.Interfaces.RpiMatrixInterface(
            "Front P3 Matrices",
            {
                matrixOpts: {
                    ...Paws.Interfaces.RpiMatrixInterface.defaultMatrixOptions(),
                    rows: 32,
                    cols: 64,
                    chainLength: 2,
                    pwmLsbNanoseconds: 450, //TEMP FIX
                    pwmDitherBits: 1,
                    pwmBits: 7
                },
                runtimeOpts: {
                    ...Paws.Interfaces.RpiMatrixInterface.defaultRuntimeOptions(),
                    gpioSlowdown: 3,
                    dropPrivileges: 0,
                }
            }
        ),

        new Paws.Interfaces.Ws281xInterface(
            "Ws2812b", 61*2, {
                gpio: 21,
                stripType: 'ws2812',
                brightness: 5
            }
        )
    ])

    Proto.addStates([
        /*
     ____        _               _____         _
    |  _ \ _   _| |___  ___ _ __|  ___|_ _ ___| |_
    | |_) | | | | / __|/ _ \ '__| |_ / _` / __| __|
    |  __/| |_| | \__ \  __/ |  |  _| (_| \__ \ |_
    |_|    \__,_|_|___/\___|_|  |_|  \__,_|___/\__|

        */
        new Paws.States.Pulser(
            "PulserFast",
            {
                interfaces: [
                    "Front P3 Matrices",
                    "Ws2812b",
                ],
                number: 4096,
                intensity: 0.8,
                speed: 5
            }
        ),
        /*
     ____        _               ____  _
    |  _ \ _   _| |___  ___ _ __/ ___|| | _____      __
    | |_) | | | | / __|/ _ \ '__\___ \| |/ _ \ \ /\ / /
    |  __/| |_| | \__ \  __/ |   ___) | | (_) \ V  V /
    |_|    \__,_|_|___/\___|_|  |____/|_|\___/ \_/\_/

        */
        new Paws.States.Pulser(
            "PulserSlow",
            {
                interfaces: [
                    "Front P3 Matrices",
                    "Ws2812b",
                ],
                number: 4096,
                intensity: 1,
                speed: 1
            }
        ),
        /*
     ___    _ _
    |_ _|__| | | ___
     | |/ _` | |/ _ \
     | | (_| | |  __/
    |___\__,_|_|\___|

        */
        new Paws.States.GifState(
            "Idle",
            {
                verbose: true,
                interfaceDefinitions: [
                    {
                        interface: "Front P3 Matrices",
                        file: stateAssetRoot + "Idle/Idle[face_single].gif",
                        transformation: "mirror"
                    },
                    {
                        interface: "Ws2812b",
                        file: stateAssetRoot + "Idle/Idle[circle_single].gif",
                        transformation: "normal"
                    }
                ]
            }
        ),
        /*
      ____
     / ___|_ __ _   _
    | |   | '__| | | |
    | |___| |  | |_| |
     \____|_|   \__, |
                |___/

        */
        new Paws.States.GifState(
            "Cry",
            {
                verbose: true,
                interfaceDefinitions: [
                    {
                        interface: "Front P3 Matrices",
                        file: stateAssetRoot + "Cry/Cry[face_single].gif",
                        transformation: "mirror"
                    }
                ]
            },
            [
                {
                    from: ["Idle"],
                    state: new Paws.States.GifState(
                        "Idle-Cry",
                        {
                            verbose: true,
                            interfaceDefinitions: [
                                {
                                    interface: "Front P3 Matrices",
                                    file: stateAssetRoot + "Cry/Idle-Cry[face_single].gif",
                                    transformation: "mirror"
                                }
                            ]
                        }
                    )
                }
            ]
        ),
        /*
        _
       / \   _ __   __ _ _ __ _   _
      / _ \ | '_ \ / _` | '__| | | |
     / ___ \| | | | (_| | |  | |_| |
    /_/   \_\_| |_|\__, |_|   \__, |
                   |___/      |___/

        */
        new Paws.States.GifState(
            "Angry",
            {
                verbose: true,
                interfaceDefinitions: [
                    {
                        interface: "Front P3 Matrices",
                        file: stateAssetRoot + "Angry/Angry[face_single].gif",
                        transformation: "mirror"
                    },
                    /*{
                        interface: "Ws2812b",
                        file: stateAssetRoot + "Idle/Idle[circle_single].gif",
                        transformation: "normal"
                    }*/
                ]
            },
            [
                {
                    from: ["Idle", "Cry"],
                    state: new Paws.States.GifState(
                        "Idle-Angry",
                        {
                            verbose: true,
                            interfaceDefinitions: [
                                {
                                    interface: "Front P3 Matrices",
                                    file: stateAssetRoot + "Angry/Idle-Angry[face_single].gif",
                                    transformation: "mirror"
                                },
                                /*{
                                    interface: "Ws2812b",
                                    file: stateAssetRoot + "Angry/Angry[circle_single].gif",
                                    transformation: "normal"
                                }*/
                            ]
                        }
                    )
                }
            ]
        ),
        /*
     ____  _
    | __ )| |_   _  ___  ___  ___ _ __ ___  ___ _ __
    |  _ \| | | | |/ _ \/ __|/ __| '__/ _ \/ _ \ '_ \
    | |_) | | |_| |  __/\__ \ (__| | |  __/  __/ | | |
    |____/|_|\__,_|\___||___/\___|_|  \___|\___|_| |_|

        */
        new Paws.States.GifState(
            "Bluescreen",
            {
                verbose: true,
                interfaceDefinitions: [
                    {
                        interface: "Front P3 Matrices",
                        file: stateAssetRoot + "Bluescreen/Bluescreen[face_single].gif",
                        transformation: "normal"
                    },
                    /*{
                        interface: "Ws2812b",
                        file: stateAssetRoot + "Bluescreen/Bluescreen[circle_single].gif",
                        transformation: "normal"
                    }*/
                ]
            },
            [
                {
                    from: ["Idle", "Cry"],
                    state: new Paws.States.GifState(
                        "Idle-Bluescreen",
                        {
                            verbose: true,
                            interfaceDefinitions: [
                                {
                                    interface: "Front P3 Matrices",
                                    file: stateAssetRoot + "Bluescreen/Idle-Bluescreen[face_single].gif",
                                    transformation: "normal"
                                },
                                /*{
                                    interface: "Ws2812b",
                                    file: stateAssetRoot + "Bluescreen/Bluescreen[circle_single].gif",
                                    transformation: "normal"
                                }*/
                            ]
                        }
                    )
                }
            ]
        )
    ])

    Proto.setState("Idle")

    Proto.on('ready', (driver) => {
        console.log("Ready!")
    })

    Proto.start()
}
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