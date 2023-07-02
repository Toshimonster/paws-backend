import {BaseInterface} from "../../src/Interfaces/BaseInterface";
import * as Matrix from "rpi-led-matrix"
import { AssertionError } from "assert/strict";

export class RpiMatrixInterface extends BaseInterface {
    private readonly Matrix: Matrix.LedMatrixInstance
    private readonly Buffer: Buffer

    constructor(name, readonly options: { runtimeOpts: any; matrixOpts: any }) {
        super(name);
        this.Matrix = new Matrix.LedMatrix({
            ...Matrix.LedMatrix.defaultMatrixOptions(),
            ...options.matrixOpts
            }, {
            ...Matrix.LedMatrix.defaultRuntimeOptions(),
            ...options.runtimeOpts
            })
        this.Buffer = Buffer.allocUnsafe(this.Matrix.height() * this.Matrix.width() * 3)
    }

    async setBuffer(buffer: Buffer): Promise<void> {
        if (buffer.length !== this.Matrix.height() * this.Matrix.width() * 3) {
            let e = new AssertionError({
                message: `Interface ${this.name} failed. Buffer length mis-match.`,
                expected: this.Matrix.height() * this.Matrix.width() * 3,
                actual: buffer.length,
                operator: "setBuffer"
            })
            console.error(e)
            process.emit("uncaughtException", e)
            process.exit(1)
        }
        this.Matrix.drawBuffer(buffer)
        this.Matrix.sync()
    }

    static defaultMatrixOptions() {
        return Matrix.LedMatrix.defaultMatrixOptions()
    }

    static defaultRuntimeOptions() {
        return Matrix.LedMatrix.defaultRuntimeOptions()
    }
}