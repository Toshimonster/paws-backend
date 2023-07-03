import { BaseMode } from "./BaseMode";
import { performance } from "perf_hooks";
import { BaseInterface } from "../Interfaces/BaseInterface";

/**
 * Represents an animated mode, and supplies animationFrame like features.
 */
export abstract class AnimatedMode extends BaseMode {
	protected animationActive = false;
	protected animationPromise: Promise<void>;
	protected frame = 0;
	protected constructor(name?: string) {
		super(name);
	}

	async onActive(subscribedInterfaces) {
		super.onActive(subscribedInterfaces);
		this.animationActive = true;
		this.animationLoop().catch(console.error);
	}

	async onInactive() {
		super.onInactive();
		await this.animationPromise; //Finish last frame
	}

	private async animationLoop(
		start = performance.now(),
		previous = performance.now()
	) {
		const t = start - performance.now();
		const dt = t - previous;
		this.frame++;

		this.animationPromise = this.animationFrame(this.interfaces, t, dt);
		await this.animationPromise;

		if (this.animationActive) setImmediate(this.animationLoop, start, t);
	}

	abstract animationFrame(
		interfaces: Map<string, BaseInterface>,
		t: number,
		dt: number
	): Promise<void>;
}
