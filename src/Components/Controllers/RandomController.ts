import { BaseController } from "./BaseController.js";
import { Driver } from "../../Driver.js";

/**
 * A debug controller, that randomly chooses modes if and when they appear
 */
export class RandomController extends BaseController {
	constructor() {
		super();
	}

	async init(device: Driver): Promise<void> {
		setImmediate(this.randomSeq.bind(this), device);
	}

	async randomSeq(device: Driver) {
		const modes = device.getModeArray();
		const choice = modes[Math.floor(modes.length * Math.random())];
		await device.setMode(choice.name);
		setTimeout(this.randomSeq.bind(this), 1000 + Math.random() * 10000, device);
	}
}
