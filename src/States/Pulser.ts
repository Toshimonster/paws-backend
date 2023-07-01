import {BaseState, BaseStateOptions} from "./BaseState";
import Driver from "../Driver";

interface PulserOptions extends BaseStateOptions {
    interfaces: string[],
    number?: number,
    intensity?: number,
    speed?: number
}

class PulserLed {
    constructor(
        readonly n: number,
        readonly f: number
    ) {}

    nextColor(t: number, intensity: number = 1, speed: number = 1): number {
        return 0xFF & Math.max(0, 255 * (Math.sin(this.f * t / 1000))) * intensity
    }
}

export class Pulser extends BaseState {
    readonly length: number = undefined;

    public readonly options: PulserOptions
    private pulsers: PulserLed[] = []
    private readonly buffer: Buffer

    constructor(name:string, options:PulserOptions) {
        super(name);
        this.options = options

        for (let i=0; i < (this.options.number || 100); i++) {
            this.pulsers.push(
                new PulserLed(i, 5 * Math.random() * (this.options.speed || 1))
            )
        }

        this.buffer = Buffer.allocUnsafe((this.options.number || 100)*3)
    }

    async executeStateFrame(driver: Driver, t: number, dt: number, ddt: number): Promise<void[]> {
        for (let PulserLed of this.pulsers) {
            let c = PulserLed.nextColor(t, this.options.intensity || 1)
            this.buffer.writeUInt16BE(c | c << 8, PulserLed.n*3)
            this.buffer.writeUInt8(c, PulserLed.n*3+2)
        }

        let Promises:(Promise<void>|void)[] = []

        for (let DriverInterface of this.options.interfaces) {
            Promises.push(driver.getInterface(DriverInterface).setBuffer(this.buffer))
        }
        return Promise.all(Promises);
    }
}