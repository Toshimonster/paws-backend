import { PixelDrawer, PixelDrawerOptions } from "./PixelDrawer.js";

export type StreamDrawerOptions = PixelDrawerOptions;

export class StreamDrawer extends PixelDrawer {
	protected options: StreamDrawerOptions = {
		interfaces: [],
	};
	constructor(name?: string, options?: StreamDrawerOptions) {
		super(name, options);
	}
}
