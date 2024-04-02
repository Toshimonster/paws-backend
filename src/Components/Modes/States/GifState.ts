import { BaseState, TransitionInfo } from "./BaseState.js";
import { StateHandler } from "./StateHandler.js";
import { BaseInterface } from "../../Interfaces/index.js";
import { GifBinary, GifReader } from "omggif";
import { readFileSync } from "fs";

interface GifStateOptions {
	interfaceDefinitions: {
		interface: string;
		file: string;
		transformation: TransformationTypes;
	}[];
}

interface InterfaceGifFileDefinition {
	interface: string;
	definition: Gif;
}

type TransformationTypes = "normal" | "mirror" | "duplicate";

/**
 * Represents a gifState
 */
export class GifState extends BaseState {
	public readonly options: GifStateOptions;
	private readonly gifDefinitions: InterfaceGifFileDefinition[] = [];
	protected start?: number;

	constructor(
		name: string,
		options: GifStateOptions,
		transitions?: TransitionInfo[],
		imgurPreviewCode?: string
	) {
		super(name, transitions, imgurPreviewCode);
		this.options = options;
		console.log("Loading gifs...");
		this.load();
	}

	onActive(
		StateHandler: StateHandler,
		prevMode?: BaseState
	): Promise<void> | void {
		// reset
		this.start = undefined;
		return super.onActive(StateHandler, prevMode);
	}

	onTransition(
		StateHandler: StateHandler,
		prevState?: BaseState,
		thisState?: BaseState
	): Promise<void> | void {
		// reset
		this.start = undefined;
		return super.onTransition(StateHandler, prevState, thisState);
	}

	load() {
		this.options.interfaceDefinitions.forEach((definition) => {
			this.gifDefinitions.push({
				interface: definition.interface,
				definition: Gif.fromFile(definition.file, definition.transformation),
			});
			console.log(`Loaded Gif ${definition.file} for ${definition.interface}`);
		});
	}

	get length(): number {
		const lengths = this.gifDefinitions.map((val) => {
			return val.definition.length;
		});
		return Math.max(...lengths) * 10;
	}

	async executeFrame(
		subscribedInterfaces: Map<string, BaseInterface>,
		handler: StateHandler,
		t: number,
		dt: number
	): Promise<void> {
		let gifTime = 0;
		if (this.start === undefined) {
			this.start = t;
		} else {
			gifTime = t - this.start;
		}
		this.gifDefinitions.forEach((definition) => {
			const frame = definition.definition.getFrameFromDelay(gifTime);
			subscribedInterfaces.get(definition.interface)?.supply(frame.buffer);
		});
		return;
	}
}

/**
 * Represents a single frame of a given gif
 */
class GifFrame {
	index: number;
	frameInfo: any;
	rgbaData: any[];
	bufferData: Buffer = Buffer.allocUnsafe(0);
	private _height = 0;
	private _width = 0;
	public get height(): number {
		return this._height;
	}
	public get width(): number {
		return this._width;
	}

	constructor(gif: Gif, frame: number, transform: TransformationTypes) {
		const f = gif.frameData(frame);
		this.index = frame;
		this.frameInfo = f.frameInfo;
		this.rgbaData = f.rgbaData;
		switch (transform) {
			case "normal":
				this.constructNormal(gif);
				break;
			case "mirror":
				this.constructMirror(gif);
				break;
			case "duplicate":
				this.constructDuplicate(gif);
				break;
		}
	}
	constructNormal(gif: Gif) {
		this.bufferData = Buffer.allocUnsafe(gif.width * gif.height * 3);
		for (let i = 0; i < gif.width * gif.height; i++) {
			const pixelData = this.rgbaData.slice(i * 4, (i + 1) * 4);
			this.bufferData.writeUInt8(pixelData[0] * (pixelData[3] / 255), i * 3);
			this.bufferData.writeUInt8(
				pixelData[1] * (pixelData[3] / 255),
				i * 3 + 1
			);
			this.bufferData.writeUInt8(
				pixelData[2] * (pixelData[3] / 255),
				i * 3 + 2
			);
		}
		this._height = gif.height;
		this._width = gif.width;
		return;
	}
	constructMirror(gif: Gif) {
		this.bufferData = Buffer.allocUnsafe(gif.width * gif.height * 3 * 2);
		for (let i = 0; i < gif.width * gif.height; i++) {
			const pixelData = this.rgbaData.slice(i * 4, (i + 1) * 4);
			const normal = 3 * (gif.width * ~~(i / gif.width) + i);
			const mirror =
				3 * (3 * gif.width * ~~(i / gif.width) + 2 * gif.width - i - 1);
			this.bufferData.writeUInt8(pixelData[0] * (pixelData[3] / 255), normal);
			this.bufferData.writeUInt8(
				pixelData[1] * (pixelData[3] / 255),
				normal + 1
			);
			this.bufferData.writeUInt8(
				pixelData[2] * (pixelData[3] / 255),
				normal + 2
			);
			this.bufferData.writeUInt8(pixelData[0] * (pixelData[3] / 255), mirror);
			this.bufferData.writeUInt8(
				pixelData[1] * (pixelData[3] / 255),
				mirror + 1
			);
			this.bufferData.writeUInt8(
				pixelData[2] * (pixelData[3] / 255),
				mirror + 2
			);
		}
		this._height = gif.height;
		this._width = gif.width;
		return;
	}
	constructDuplicate(gif: Gif) {
		this.bufferData = Buffer.allocUnsafe(gif.width * gif.height * 3 * 2);
		for (let i = 0; i < gif.width * gif.height; i++) {
			const pixelData = this.rgbaData.slice(i * 4, (i + 1) * 4);
			const normal = 3 * (gif.width * ~~(i / gif.width) + i);
			const duplicate = normal + gif.width * 3;
			this.bufferData.writeUInt8(pixelData[0] * (pixelData[3] / 255), normal);
			this.bufferData.writeUInt8(
				pixelData[1] * (pixelData[3] / 255),
				normal + 1
			);
			this.bufferData.writeUInt8(
				pixelData[2] * (pixelData[3] / 255),
				normal + 2
			);
			this.bufferData.writeUInt8(
				pixelData[0] * (pixelData[3] / 255),
				duplicate
			);
			this.bufferData.writeUInt8(
				pixelData[1] * (pixelData[3] / 255),
				duplicate + 1
			);
			this.bufferData.writeUInt8(
				pixelData[2] * (pixelData[3] / 255),
				duplicate + 2
			);
		}
		this._height = gif.height;
		this._width = gif.width;
		return;
	}
	get delay() {
		return this.frameInfo.delay;
	}
	get buffer() {
		return this.bufferData;
	}
	getPixel(x: number, y: number) {
		return {
			x: x,
			y: y,
			Color: {
				r: this.bufferData[3 * (y * this.width + x)],
				g: this.bufferData[3 * (y * this.width + x) + 1],
				b: this.bufferData[3 * (y * this.width + x) + 2],
			},
		};
	}
}

/**
 * Represents a gif file
 */
class Gif {
	frames: GifFrame[] = [];
	delays: any[] = [];
	gifReader: GifReader;
	transform: TransformationTypes;

	constructor(gifReader: GifReader, transform: TransformationTypes = "normal") {
		this.gifReader = gifReader;
		this.transform = transform;
		for (let f = 0; f < this.gifReader.numFrames(); f++) {
			this.frames[f] = new GifFrame(this, f, transform);
			this.delays[f] = this.frames[f].delay + (this.delays[f - 1] | 0);
		}
	}
	get width() {
		return this.gifReader.width;
	}
	get height() {
		return this.gifReader.height;
	}
	get length() {
		return this.delays[this.delays.length - 1];
	}
	frameData(frame: number) {
		const temp: number[] = [];
		this.gifReader.decodeAndBlitFrameRGBA(frame, temp);
		return {
			frameInfo: this.gifReader.frameInfo(frame),
			rgbaData: temp,
		};
	}
	getFrame(frame: number) {
		return this.frames[frame];
	}
	getFrameFromDelay(delay: number) {
		delay = (delay / 10) % this.length; //gif delay is 100th of second
		if (!delay) return this.frames[0];
		let i = 0;
		while (i < 1000000) {
			if (delay < this.delays[i]) {
				return this.frames[i];
			}
			i++;
		}
		throw new Error("Infinite loop detected");
	}
	static fromDataBuffer(
		buffer: GifBinary,
		transform: TransformationTypes = "normal"
	): Gif {
		return new Gif(new GifReader(buffer), transform);
	}
	static fromFile(
		file: string | Buffer | URL | number,
		transform: TransformationTypes = "normal"
	): Gif {
		return Gif.fromDataBuffer(readFileSync(file), transform);
	}
}
