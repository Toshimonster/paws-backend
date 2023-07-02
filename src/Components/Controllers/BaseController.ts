import { NamedComponent } from "../NamedComponent";

export abstract class BaseController extends NamedComponent {
	protected constructor(name?: string) {
		super(name);
	}
}
