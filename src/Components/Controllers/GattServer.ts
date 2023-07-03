import { PixelDrawer } from "../Modes/PixelDrawer.js";
import { StateHandler } from "../Modes/States/StateHandler.js";
import { BaseController } from "./BaseController.js";

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
