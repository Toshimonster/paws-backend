import Driver from "../Driver.js";
import * as Crypto from "crypto";

export abstract class NamedComponent {
	/**
	 * The name of the component. Must be unique.
	 */
	public readonly name: string;

	protected constructor(name?: string) {
		if (!name) {
			this.name = Crypto.randomUUID();
		} else {
			this.name = name;
		}
	}

	async init(device: Driver) {
		return;
	}
}
