import * as Matrix from "rpi-led-matrix";
import { BaseInterface } from "./BaseInterface.js";

/**
 * Represents a matrix interface. Based off the brilliant hzeller library, rpi-led-matrix.
 */
export class RpiMatrixInterface extends BaseInterface {
	private readonly Matrix: Matrix.LedMatrixInstance;
	private readonly Buffer: Buffer;

	constructor(
		name?: string,
		readonly options: {
			runtimeOpts: Partial<Matrix.MatrixOptions>;
			matrixOpts: Partial<Matrix.RuntimeOptions>;
		} = {
			runtimeOpts: {},
			matrixOpts: {},
		}
	) {
		super(name);
		this.Matrix = new Matrix.LedMatrix(
			{
				...RpiMatrixInterface.defaultMatrixOptions(),
				...options.matrixOpts,
			},
			{
				...RpiMatrixInterface.defaultRuntimeOptions(),
				...options.runtimeOpts,
			}
		);
		this.Buffer = Buffer.allocUnsafe(
			this.Matrix.height() * this.Matrix.width() * 3
		);
		this.bufferSize = this.Matrix.height() * this.Matrix.width() * 3;
	}

	async setBuffer(buffer: Buffer): Promise<void> {
		this.Matrix.drawBuffer(buffer);
		this.Matrix.sync();
	}

	static defaultMatrixOptions() {
		return Matrix.LedMatrix.defaultMatrixOptions();
	}

	static defaultRuntimeOptions() {
		return Matrix.LedMatrix.defaultRuntimeOptions();
	}
}
