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
		console.log("!!!");
		console.log(bufferSize);
		console.log(this.options.interfaces[0].bufferSize);
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
		if (this.potentialBufferLength === this.bufferSize) {
			console.log("!!!");
			await this.update(this.potentialBuffer);
		} else if (this.potentialBufferLength > this.bufferSize) {
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
				"Buffer size mis-match; ensure controller is giving correct updates!"
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
