import { NamedComponent } from "../NamedComponent.js";
import { BaseInterface } from "../Interfaces/BaseInterface.js";

export abstract class BaseMode extends NamedComponent {
	protected interfaces?: Map<string, BaseInterface>;

	/**
	 * Runs when the mode becomes active, just after it is set in the driver.
	 * @param subscribedInterfaces
	 * @param prevMode
	 */
	public onActive(
		subscribedInterfaces: Map<string, BaseInterface>,
		prevMode?: BaseMode
	): Promise<void> | void {
		this.interfaces = subscribedInterfaces;
	}

	/**
	 * Runs when the mode becomes inactive, just before it is set in the driver.
	 * @param nextMode
	 */
	public onInactive(nextMode?: BaseMode): Promise<void> | void {
		this.interfaces = undefined;
	}

	protected constructor(name?: string) {
		super(name);
	}
}
