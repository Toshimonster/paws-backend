import Driver from "../../Driver";
import { NamedComponent } from "../NamedComponent";

export abstract class BaseMode extends NamedComponent {
	public onActive(Paws: Driver, prevMode?: BaseMode): Promise<void> | void {
		return;
	}
	public onInactive(Paws: Driver, nextMode?: BaseMode): Promise<void> | void {
		return;
	}

	protected constructor(name?: string) {
		super(name);
	}
}
