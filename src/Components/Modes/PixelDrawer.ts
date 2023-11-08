import { BaseMode } from "./BaseMode.js";
import { BaseInterface } from "../Interfaces/BaseInterface.js";
import * as buffer from "buffer";

export interface PixelDrawerOptions {
	/**
	 * Ordered list containing all interfaces to be included in the drawer
	 */
	interfaces: BaseInterface[];
}
export class PixelDrawer extends BaseMode {
	protected options: PixelDrawerOptions = {
		interfaces: [],
	};
	protected state: Buffer;
	/**
	 * The buffer size expected for this drawer
	 */
	get bufferSize() {
		return this.state.length;
	}

	constructor(name?: string, options?: Partial<PixelDrawerOptions>) {
		super(name);
		this.options = { ...this.options, ...options };
		// Get buffer size for all interfaces
		const bufferSize = this.options.interfaces.reduce(
			(a, cv) => a + (cv.bufferSize || 0),
			0
		);
		this.state = Buffer.alloc(bufferSize);

		//potential
		this.potentialBuffer = Buffer.allocUnsafe(this.bufferSize);
	}

	/**
	 * Updates all interfaces of this.options.interfaces to the current value of this.state
	 * @protected
	 */
	protected async updateInterfaces() {
		// Set state to interfaces
		let pointer = 0;
		for (const devInterface of this.options.interfaces) {
			const buffer = this.state.subarray(
				pointer,
				pointer + (devInterface.bufferSize ?? 0)
			);
			pointer += devInterface.bufferSize ?? 0;
			await devInterface.supply(buffer);
		}
	}

	private readonly potentialBuffer;
	private potentialBufferLength = 0;
	public async potentialUpdate(buffer: Buffer) {
		if (buffer.readInt8() === 0 && buffer.length === 8) {
			// Start request
			this.potentialBufferLength = 0;
			return;
		}

		// Copy buffer
		buffer.copy(this.potentialBuffer, this.potentialBufferLength);
		this.potentialBufferLength += buffer.length;

		console.log(this.potentialBufferLength);
		if (this.potentialBufferLength === this.bufferSize / 2) {
			console.log("!!!");
			// Constructing update buffer
			const toSend = Buffer.allocUnsafe(this.bufferSize);
			// Assuming mirrored pixeldraw
			const rows = 32;
			const cols = 64;

			for (let c = 0; c < cols; c++) {
				for (let r = 0; r < rows; r++) {
					const pixelNum = c + r * cols;
					const red = this.potentialBuffer.readUInt8(pixelNum * 3);
					const green = this.potentialBuffer.readUInt8(pixelNum * 3 + 1);
					const blue = this.potentialBuffer.readUInt8(pixelNum * 3 + 2);

					const i = c + r * 64;
					console.log(i);
					const normal = 3 * (64 * ~~(i / 64) + i);
					const mirror = 3 * (3 * 64 * ~~(i / 64) + 2 * 64 - i - 1);

					let adjPixelNum = c + r * 2 * cols;
					adjPixelNum = normal;

					if (red == 255 && blue == 255 && green == 255)
						console.log(adjPixelNum);
					toSend.writeUInt8(red, adjPixelNum * 3);
					toSend.writeUInt8(green, adjPixelNum * 3 + 1);
					toSend.writeUInt8(blue, adjPixelNum * 3 + 2);
					// 0,0 -> 127
					// 0,2 -> 125
					// (1,0) 128 -> 255
					// (1,2) 130 -> 253
					let mirPixelNum = 64 + (63 - c) + r * 2 * cols;
					mirPixelNum = mirror;
					toSend.writeUInt8(red, mirPixelNum * 3);
					toSend.writeUInt8(green, mirPixelNum * 3 + 1);
					toSend.writeUInt8(blue, mirPixelNum * 3 + 2);
				}
			}
			await this.update(toSend);
		} else if (this.potentialBufferLength > this.bufferSize / 2) {
			console.error("BUFFER OVERFLOW");
			this.potentialBufferLength = 0;
		}
	}

	/**
	 * Updates the pixel drawer, and updates all interfaces if the mode is active.
	 * Only one instance of this function should be running across threads;
	 * It will resolve when the function is ready yet again.
	 * @param buffer A buffer containing the state; should be ordered by the interface array.
	 * @returns success; false if written to interfaces - iff mode is inactive.
	 */
	public async update(buffer: Buffer) {
		if (buffer.length !== this.bufferSize)
			throw new Error(
				`Buffer size mis-match; ensure controller is giving correct updates! ${buffer.length} != ${this.bufferSize}`
			);
		this.state = buffer;
		if (this.isActive()) {
			await this.updateInterfaces();
			return true;
		}
		return false;
	}

	async onActive(
		subscribedInterfaces: Map<string, BaseInterface>,
		prevMode?: BaseMode
	) {
		await this.updateInterfaces();
	}
}
