import Ws281x from "rpi-ws281x-native";
import { BaseInterface } from "./BaseInterface.js";

/**
 * Represents a ws281x interface. Based off the brilliant library, rpi-ws281x-native. Needs root.
 */
export class Ws281xInterface extends BaseInterface {
	private readonly Channel;
	private static cleanup(): void {
		console.log("\nCleaning up ws281x");
		Ws281x.reset();
		Ws281x.finalize();

		process.nextTick(function () {
			process.exit(0);
		});
	}

	constructor(name?: string, numLeds = 0, options?: object) {
		super(name);
		this.Channel = Ws281x(numLeds, options);

		// Catches kill event
		//process.on('beforeExit', Ws281xInterface.cleanup)
		// Catches Ctrl+C event
		process.on("SIGINT", Ws281xInterface.cleanup);
		// Catches kill pid events
		process.on("SIGUSR1", Ws281xInterface.cleanup);
		process.on("SIGUSR1", Ws281xInterface.cleanup);
		// Catches uncaught exceptions
		//process.on('uncaughtException', Ws281xInterface.cleanup)
		//this.bufferSize = numLeds * 3;
	}

	async setBuffer(buffer: Buffer): Promise<void> {
		const slicedBuffer = buffer.subarray(0, this.Channel.array.length * 3);
		for (let i = 0; i < this.Channel.array.length; i++) {
			const data = slicedBuffer.subarray(i * 3, (i + 1) * 3);
			this.Channel.array[i] = (data[0] << 16) | (data[1] << 8) | data[2];
		}
		Ws281x.render();
	}
}
