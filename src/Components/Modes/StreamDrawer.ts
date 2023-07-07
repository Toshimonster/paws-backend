import { PixelDrawer, PixelDrawerOptions } from "./PixelDrawer.js";

export interface StreamDrawerOptions extends PixelDrawerOptions {}

export class StreamDrawer extends PixelDrawer {
	protected options: StreamDrawerOptions = {
		interfaces: [],
	};
	constructor(name?: string, options?: StreamDrawerOptions) {
		super(name, options);
	}
}
