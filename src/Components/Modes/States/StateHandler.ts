import { BaseState } from "./BaseState.js";
import { AnimatedMode } from "../AnimatedMode.js";

export class StateHandler extends AnimatedMode {
	private readonly states: Map<string, BaseState> = new Map();
	private activeState: BaseState;
	constructor(name: string | undefined, states: BaseState[] = []) {
		super(name);
		for (const state of states) {
			this.states.set(state.name, state);
		}
		this.activeState = states[0];
	}

	/**
	 * The active state, currently being shown on device
	 */
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
		const newState = this.states.get(name) as BaseState;

		if (this.activeState) await this.activeState.onInactive(this, newState);

		const lastState = this.activeState;
		this.activeState = newState;

		await newState.onActive(this, lastState);

		return true;
	}

	/**
	 * Runs the animation frame for the active state
	 * @param t
	 * @param dt
	 */
	async animationFrame(t: number, dt: number) {
		if (!this.interfaces) return; //Skip frame on mode change
		const transition = this.activeState.getTransitionInfo();
		if (transition.state) {
			// Handle transition
			if (transition.until && t >= transition.until) {
				// End transition & draw normal state
				this.activeState.endTransition();
			} else {
				// Transition active
				if (!transition.until) {
					// Start transition
					if (!transition.state.length)
						throw new Error(
							`Transition state ${transition.state.name} does not have a required length value set`
						);

					this.activeState.setTransitionUntil(t + transition.state.length);
				}
				// Draw transition and not normal state
				await transition.state.executeFrame(this.interfaces, this, t, dt);
				return;
			}
		}
		await this.activeState.executeFrame(this.interfaces, this, t, dt);
	}
}
