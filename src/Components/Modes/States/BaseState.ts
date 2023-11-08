import { NamedComponent } from "../../NamedComponent.js";
import { StateHandler } from "./StateHandler.js";
import { BaseInterface } from "../../Interfaces/index.js";

/**
 * Defines transition sub-states, of which when coming from a specific state, to use another
 */
export interface TransitionInfo {
	from: string[];
	state: BaseState;
}

/**
 * Defines the current transition info of the state
 */
export interface CurrentTransitionInfo {
	state?: BaseState;
	until?: number;
}

export interface BaseState {
	/**
	 * For a state to be used as a transition state, the length of the state must be defined.
	 * This is in seconds
	 */
	length?: number;
}

/**
 * A base state to be used by a state handler.
 * Transitions are accomplished via the names of states, of which
 * are required to be unique for true functionality
 */
export abstract class BaseState extends NamedComponent {
	private readonly transitions?: TransitionInfo[];
	private currentTransition: CurrentTransitionInfo = {};
	protected constructor(name?: string, transitions?: TransitionInfo[]) {
		super(name);
		this.transitions = transitions;
	}

	/**
	 * Runs when the state becomes active, just after it is set in the handler.
	 * Super handles transition switching
	 * @param StateHandler
	 * @param prevState
	 */
	public onActive(
		StateHandler: StateHandler,
		prevState?: BaseState
	): Promise<void> | void {
		if (!this.transitions || !prevState?.name) return;
		// Transition handler
		const transition = this.transitions.find((transitionInfo) =>
			transitionInfo.from.includes(prevState.name)
		);
		if (transition) {
			console.log(`Running transition ${transition.state.name}`);
			this.currentTransition.state = transition.state;
			this.currentTransition.state.onTransition(StateHandler, prevState, this);
		}
	}
	/**
	 * Runs when the state becomes inactive, just before it is reset in the handler.
	 * @param StateHandler
	 * @param nextMode
	 */
	public onInactive(
		StateHandler: StateHandler,
		nextMode?: BaseState
	): Promise<void> | void {
		return;
	}

	/**
	 * Runs when the state becomes a transition, just after a major state has become active.
	 * @param StateHandler
	 * @param prevState
	 * @param thisState
	 */
	public onTransition(
		StateHandler: StateHandler,
		prevState?: BaseState,
		thisState?: BaseState
	): Promise<void> | void {
		return;
	}

	/**
	 * Returns the transition info of the state
	 */
	public getTransitionInfo(): CurrentTransitionInfo {
		return this.currentTransition;
	}

	/**
	 * Ends the transition, if one is currently running on this state
	 */
	public endTransition() {
		this.currentTransition.state = this.currentTransition.until = undefined;
	}

	/**
	 * Sets the transition until value to the until specified
	 * @param until
	 */
	public setTransitionUntil(until: number) {
		this.currentTransition.until = until;
	}

	/**
	 * Runs when an animation frame appears.
	 * Used to display buffers to interfaces.
	 * @param subscribedInterfaces all the subscribed interfaces
	 * @param handler the handler
	 * @param t
	 * @param dt
	 */
	abstract executeFrame(
		subscribedInterfaces: Map<string, BaseInterface>,
		handler: StateHandler,
		t: number,
		dt: number
	): Promise<void> | void;
}
