import { NamedComponent } from "../../NamedComponent.js";
import { StateHandler } from "./StateHandler.js";
import { BaseInterface } from "../../Interfaces/BaseInterface.js";

export abstract class BaseState extends NamedComponent {
	protected constructor(name?: string) {
		super(name);
	}

	/**
	 * Runs when the state becomes active, just after it is set in the handler.
	 * @param StateHandler
	 * @param prevMode
	 */
	public onActive(
		StateHandler: StateHandler,
		prevMode?: BaseState
	): Promise<void> | void {
		return;
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