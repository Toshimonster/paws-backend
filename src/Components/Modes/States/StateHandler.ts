import { BaseMode } from "../BaseMode";
import { BaseState } from "./BaseState";

export class StateHandler extends BaseMode {
	private readonly states: Map<string, BaseState>;
	private activeState: BaseState;
	constructor(states: BaseState[] = []) {
		super();
		for (const state of states) {
			this.states.set(state.name, state);
		}
	}

	get state() {
		return this.activeState;
	}

	public listStates() {
		return Array.from(this.states.values());
	}

	public listStateNames() {
		return this.listStates().map((state) => state.name);
	}

	/**
	 * Sets a state
	 * @param name
	 * @return whether the change was successful
	 */
	public async setState(name: string) {
		if (!this.states.has(name)) return false;
		const newState = this.states.get(name);

		if (this.activeState) await this.activeState.onInactive(this, newState);

		const lastState = this.activeState;
		this.activeState = newState;

		await newState.onActive(this, lastState);

		return true;
	}

	//TODO animation frame
}
