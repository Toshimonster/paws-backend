import { PixelDrawer } from "../Modes/PixelDrawer";
import { StateHandler } from "../Modes/States/StateHandler";

interface GattServerOptions {
	StateHandler?: StateHandler;
	PixelDrawer?: PixelDrawer;
}

export class GattServer {
	readonly options: GattServerOptions = {};
	constructor(options: GattServerOptions) {
		this.options = { ...this.options, ...options };
	}
}
