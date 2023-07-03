import { NamedComponent } from "../NamedComponent";
import { BaseInterface } from "../Interfaces/BaseInterface";

export abstract class BaseMode extends NamedComponent {
	protected interfaces?: Map<string, BaseInterface>;

	public onActive(
		subscribedInterfaces: Map<string, BaseInterface>,
		prevMode?: BaseMode
	): Promise<void> | void {
		this.interfaces = subscribedInterfaces;
	}
	public onInactive(nextMode?: BaseMode): Promise<void> | void {
		this.interfaces = undefined;
	}

	protected constructor(name?: string) {
		super(name);
	}
}
