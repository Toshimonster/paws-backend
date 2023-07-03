import { NamedComponent } from "../NamedComponent.js";

export abstract class BaseController extends NamedComponent {
	protected constructor(name?: string) {
		super(name);
	}
}
