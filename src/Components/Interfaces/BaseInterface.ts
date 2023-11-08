import { NamedComponent } from "../NamedComponent.js";

/**
 * Represents an interface, which is an abstraction of a device
 * that the PAWS server can interact with
 */
export abstract class BaseInterface extends NamedComponent {
	/**
	 * The expected size of the buffer for each update.
	 * If undefined, then any buffer size is allowed.
	 */
	public bufferSize?: number;

	protected constructor(name?: string) {
		super(name);
	}

	/**
	 * An asynchronous function communicating with the device,
	 * resulting in the complete execution of the result.
	 * @param buffer The buffer containing information about the movement
	 */
	protected abstract setBuffer(buffer: Buffer): Promise<void> | void;

	/**
	 * An asynchronous function communicating with the device,
	 * resulting in the complete execution of the result.
	 * Validates buffer size.
	 * @param buffer The buffer containing information about the movement
	 */
	public async supply(buffer: Buffer) {
		if (this.bufferSize && this.bufferSize !== buffer.length)
			console.error(
				`Invalid buffer size for ${this.name}: ${this.bufferSize} v ${buffer.length}`
			);
		console.log(buffer);
		return this.setBuffer(buffer);
	}
}
