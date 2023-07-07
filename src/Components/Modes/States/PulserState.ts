import { BaseState } from "./BaseState.js";
import { StateHandler } from "./StateHandler.js";
import { BaseInterface } from "../../Interfaces/BaseInterface.js";

class PulserLed {
	constructor(readonly n: number, readonly f: number) {}

	nextColor(t: number, intensity = 1, speed = 1): number {
		return (
			0xff & (Math.max(0, 255 * Math.sin((this.f * t) / 1000)) * intensity)
		);
	}
}

export class PulserState extends BaseState {
	private pulsers: Map<string, PulserLed[]> = new Map();
	constructor(name?: string) {
		super(name);
	}

	async executeFrame(
		subscribedInterfaces: Map<string, BaseInterface>,
		handler: StateHandler,
		t: number
	) {
		for (const [interfaceName, devInterface] of subscribedInterfaces) {
			if (!this.pulsers.has(interfaceName)) {
				const pulsers = [];
				for (let i = 0; i < (devInterface.bufferSize ?? 0) / 3; i++) {
					pulsers.push(new PulserLed(i, 5 * Math.random()));
				}
				this.pulsers.set(interfaceName, pulsers);
			}

			const pulsers = this.pulsers.get(interfaceName) as PulserLed[];

			const buffer = Buffer.allocUnsafe(devInterface.bufferSize ?? 0);
			for (const PulserLed of pulsers) {
				const c = PulserLed.nextColor(t, 1);
				buffer.writeUInt16BE(c | (c << 8), PulserLed.n * 3);
				buffer.writeUInt8(c, PulserLed.n * 3 + 2);
			}

			await devInterface.supply(buffer);
		}
	}
}
