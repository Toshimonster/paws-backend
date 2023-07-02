/**
 * Represents an interface, which is an abstraction of a device
 * that the PAWS server can interact with
 */
export abstract class BaseInterface {
	/**
	 * The name of the interface. Must be unique.
	 */
	public readonly name: string;
	/**
	 * The expected size of the buffer for each update.
	 * If undefined, then any buffer size is allowed.
	 */
	public readonly bufferSize: number | undefined;

	protected constructor(name) {
		this.name = name;
	}

	/**
	 * An asynchronous function communicating with the device,
	 * resulting in the complete execution of the result.
	 * @param buffer The buffer containing information about the movement
	 */
	abstract setBuffer(buffer: Buffer): Promise<void> | void;
}
