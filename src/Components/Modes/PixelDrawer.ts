import { BaseMode } from "./BaseMode.js";
import { BaseInterface } from "../Interfaces/BaseInterface.js";

export interface PixelDrawerOptions {
	/**
	 * Ordered list containing all interfaces to be included in the drawer
	 */
	interfaces: BaseInterface[] | undefined;
}
export class PixelDrawer extends BaseMode {
	protected options: PixelDrawerOptions = {
		interfaces: [],
	};
	protected state: Buffer;
	private updatePromise: Promise<unknown>;

	/**
	 * The buffer size expected for this drawer
	 */
	get bufferSize() {
		return this.state.length;
	}

	constructor(name?: string, options?: PixelDrawerOptions) {
		super(name);
		this.options = { ...this.options, ...options };
		// Get buffer size for all interfaces
		const bufferSize = this.options.interfaces.reduce(
			(a, cv) => a + (cv.bufferSize || 0),
			0
		);
		this.state = Buffer.alloc(bufferSize);
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
				pointer + devInterface.bufferSize
			);
			pointer += devInterface.bufferSize;
			await devInterface.supply(buffer);
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
