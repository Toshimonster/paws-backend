import { PixelDrawer } from "../Modes/PixelDrawer";
import { StateHandler } from "../Modes/States/StateHandler";
import { BaseController } from "./BaseController";

interface GattServerOptions {
	StateHandler?: StateHandler;
	PixelDrawer?: PixelDrawer;
}

export class GattServer extends BaseController {
	readonly options: GattServerOptions = {};
	constructor(options: GattServerOptions) {
		super();
		this.options = { ...this.options, ...options };
	}
}
