import { NamedComponent } from "../NamedComponent";

/**
 * Represents an interface, which is an abstraction of a device
 * that the PAWS server can interact with
 */
export abstract class BaseInterface extends NamedComponent {
	/**
	 * The expected size of the buffer for each update.
	 * If undefined, then any buffer size is allowed.
	 */
	public readonly bufferSize: number | undefined;

	protected constructor(name?: string) {
		super(name);
	}

	/**
	 * An asynchronous function communicating with the device,
	 * resulting in the complete execution of the result.
	 * @param buffer The buffer containing information about the movement
	 */
	abstract setBuffer(buffer: Buffer): Promise<void> | void;
}
