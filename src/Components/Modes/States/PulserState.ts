import { BaseState } from "./BaseState";
import { StateHandler } from "./StateHandler";
import { BaseInterface } from "../../Interfaces/BaseInterface";

export class PulserState extends BaseState {
	constructor() {
		super();
	}

	executeFrame(
		subscribedInterfaces: Map<string, BaseInterface>,
		handler: StateHandler,
		t: number,
		dt: number,
		ddt: number
	): Promise<void> | void {
		return undefined;
	}
}
