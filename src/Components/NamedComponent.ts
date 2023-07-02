import Crypto from "crypto";
import Driver from "../Driver";

export abstract class NamedComponent {
	/**
	 * The name of the component. Must be unique.
	 */
	public readonly name: string;

	constructor(name?: string) {
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
