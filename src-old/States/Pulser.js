import { BaseState } from "./BaseState";
class PulserLed {
    n;
    f;
    constructor(n, f) {
        this.n = n;
        this.f = f;
    }
    nextColor(t, intensity = 1, speed = 1) {
        return 0xFF & Math.max(0, 255 * (Math.sin(this.f * t / 1000))) * intensity;
    }
}
export class Pulser extends BaseState {
    length = undefined;
    options;
    pulsers = [];
    buffer;
    constructor(name, options) {
        super(name);
        this.options = options;
        for (let i = 0; i < (this.options.number || 100); i++) {
            this.pulsers.push(new PulserLed(i, 5 * Math.random() * (this.options.speed || 1)));
        }
        this.buffer = Buffer.allocUnsafe((this.options.number || 100) * 3);
    }
    async executeStateFrame(driver, t, dt, ddt) {
        for (let PulserLed of this.pulsers) {
            let c = PulserLed.nextColor(t, this.options.intensity || 1);
            this.buffer.writeUInt16BE(c | c << 8, PulserLed.n * 3);
            this.buffer.writeUInt8(c, PulserLed.n * 3 + 2);
        }
        let Promises = [];
        for (let DriverInterface of this.options.interfaces) {
            Promises.push(driver.getInterface(DriverInterface).setBuffer(this.buffer));
        }
        return Promise.all(Promises);
    }
}
//# sourceMappingURL=Pulser.js.map