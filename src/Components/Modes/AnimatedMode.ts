import { BaseMode } from "./BaseMode.js";
import { performance } from "perf_hooks";

/**
 * Represents an animated mode, and supplies animationFrame like features.
 */
export abstract class AnimatedMode extends BaseMode {
	protected animationActive = false;
	protected animationPromise: Promise<void> | void;
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
		this.animationActive = false;
	}

	private async animationLoop(
		start = performance.now(),
		previous = performance.now()
	) {
		const t = performance.now() - start;
		const dt = t - previous;
		this.frame++;

		this.animationPromise = this.animationFrame(t, dt);
		await this.animationPromise;

		if (this.animationActive)
			setImmediate(this.animationLoop.bind(this), start, t);
	}

	abstract animationFrame(t: number, dt: number): Promise<void> | void;
}
