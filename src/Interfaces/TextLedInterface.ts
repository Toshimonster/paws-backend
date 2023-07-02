import chalk from "chalk";
import { BaseInterface } from "./BaseInterface";

/**
 * Options for the TextLedInterface
 */
interface TextLedInterfaceOptions {
	/**
	 * The width of the Text-LED matrix, default 64
	 */
	width?: number;
	/**
	 * The height of the Text-LED matrix, default 32
	 */
	height?: number;
	/**
	 * The Text symbol to represent an LED, default '!'
	 */
	symbol?: string;
}

/**
 * A class that represents a LED matrix, in console
 */
export class TextLedInterface extends BaseInterface {
	public readonly size: number;
	readonly options: TextLedInterfaceOptions = {
		width: 32,
		height: 64,
		symbol: "!",
	};

	constructor(name, options?: TextLedInterfaceOptions) {
		super(name);
		// Set defaults
		this.options = { ...this.options, ...options };
		this.size = this.options.width * this.options.height;
	}

	async setBuffer(buffer: Buffer): Promise<void> {
		//Set cursor to root
		await new Promise((resolve) => {
			process.stdout.cursorTo(0, 0, () => {
				resolve(true);
			});
		});

		const colors = buffer.subarray(0, this.size * 3);
		for (let y = 0; y < this.options.height; y++) {
			let line = "";
			for (let x = 0; x < this.options.width; x++) {
				line +=
					chalk.rgb(
						colors[(y * this.options.width + x) * 3],
						colors[(y * this.options.width + x) * 3 + 1],
						colors[(y * this.options.width + x) * 3 + 2]
					)(this.options.symbol || "*") + " ";
			}
			await new Promise((resolve) => {
				process.stdout.clearLine(0, () => {
					process.stdout.write(line + "\n", resolve);
				});
			});
		}
	}
}
