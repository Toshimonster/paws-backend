import {BaseState} from "./BaseState";
import Driver from "../Driver";
import { GifReader } from "omggif";
import { readFileSync } from "fs";
import { BaseStateOptions, TransitionInfo } from ".";

interface GifStateOptions extends BaseStateOptions {
    interfaceDefinitions: {
        interface: string,
        file: string,
        transformation: TransformationTypes
    }[]
}

interface InterfaceGifFileDefinition {
    interface: string,
    definition: Gif
}

type TransformationTypes = 'normal' | 'mirror' | 'duplicate'

export class GifState extends BaseState {
    public readonly options: GifStateOptions
    private readonly gifDefinitions: InterfaceGifFileDefinition[] = []
    protected start: number

    constructor(name: string, options: GifStateOptions, transitions?: TransitionInfo[]) {
        super(name, transitions);
        this.options = options
        this.verbose("Loading gifs...")
        this.load()
        //Reset animation on active or transition
        this.on("OnActive", () => {
            this.start = undefined
        })
        this.on("OnTransition", () => {
            this.start = undefined
        })
    }

    load() {
        this.options.interfaceDefinitions.forEach(definition => {
            this.gifDefinitions.push({
                interface: definition.interface,
                definition: Gif.fromFile(definition.file, definition.transformation)
            })
            this.verbose(`Loaded Gif ${definition.file} for ${definition.interface}`)
        })
    }

    executeStateFrame(driver: Driver, t: number, dt: number, ddt: number): Promise<any> {
        let gifTime = 0
        if (this.start === undefined) {
            this.start = t
        } else {
            gifTime = t - this.start
        }
        this.gifDefinitions.forEach(definition => {
            let frame = definition.definition.getFrameFromDelay(gifTime);
            driver.getInterface(definition.interface).setBuffer(frame.buffer);
        });
        return;
    }

    get length():number {
        let lengths = this.gifDefinitions.map((val) => {return val.definition.length})
        return Math.max(...lengths) * 10
    }
}

class GifFrame {
    index: number;
    frameInfo: any;
    rgbaData: any[];
    bufferData: Buffer;
    private _height: number;
    private _width: number;
    public get height():number {return this._height};
    public get width():number {return this._height};
    
    constructor(gif: Gif, frame: number, transform: TransformationTypes) {
        
        let f = gif.frameData(frame);
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
    constructNormal(gif) {
        this.bufferData = Buffer.allocUnsafe(gif.width * gif.height * 3);
        for (let i = 0; i < gif.width * gif.height; i++) {
            let pixelData = this.rgbaData.slice(i * 4, (i + 1) * 4);
            this.bufferData.writeUInt8(pixelData[0] * (pixelData[3] / 255), (i * 3));
            this.bufferData.writeUInt8(pixelData[1] * (pixelData[3] / 255), (i * 3) + 1);
            this.bufferData.writeUInt8(pixelData[2] * (pixelData[3] / 255), (i * 3) + 2);
        }
        this._height = gif.height;
        this._width = gif.width;
        return;
    }
    constructMirror(gif) {
        this.bufferData = Buffer.allocUnsafe(gif.width * gif.height * 3 * 2);
        for (let i = 0; i < gif.width * gif.height; i++) {
            let pixelData = this.rgbaData.slice(i * 4, (i + 1) * 4);
            let normal = 3 * (gif.width * (~~(i / gif.width)) + i);
            let mirror = 3 * ((3 * gif.width * (~~(i / gif.width))) + (2 * gif.width) - i - 1);
            this.bufferData.writeUInt8(pixelData[0] * (pixelData[3] / 255), normal);
            this.bufferData.writeUInt8(pixelData[1] * (pixelData[3] / 255), normal + 1);
            this.bufferData.writeUInt8(pixelData[2] * (pixelData[3] / 255), normal + 2);
            this.bufferData.writeUInt8(pixelData[0] * (pixelData[3] / 255), mirror);
            this.bufferData.writeUInt8(pixelData[1] * (pixelData[3] / 255), mirror + 1);
            this.bufferData.writeUInt8(pixelData[2] * (pixelData[3] / 255), mirror + 2);
        }
        this._height = gif.height;
        this._width = gif.width;
        return;
    }
    constructDuplicate(gif) {
        this.bufferData = Buffer.allocUnsafe(gif.width * gif.height * 3 * 2);
        for (let i = 0; i < gif.width * gif.height; i++) {
            let pixelData = this.rgbaData.slice(i * 4, (i + 1) * 4);
            let normal = 3 * (gif.width * (~~(i / gif.width)) + i);
            let duplicate = normal + gif.width * 3;
            this.bufferData.writeUInt8(pixelData[0] * (pixelData[3] / 255), normal);
            this.bufferData.writeUInt8(pixelData[1] * (pixelData[3] / 255), normal + 1);
            this.bufferData.writeUInt8(pixelData[2] * (pixelData[3] / 255), normal + 2);
            this.bufferData.writeUInt8(pixelData[0] * (pixelData[3] / 255), duplicate);
            this.bufferData.writeUInt8(pixelData[1] * (pixelData[3] / 255), duplicate + 1);
            this.bufferData.writeUInt8(pixelData[2] * (pixelData[3] / 255), duplicate + 2);
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
    getPixel(x, y) {
        return {
            x: x,
            y: y,
            Color: {
                r: this.bufferData[3 * ((y * this.width) + x)],
                g: this.bufferData[3 * ((y * this.width) + x) + 1],
                b: this.bufferData[3 * ((y * this.width) + x) + 2]
            }
        };
    }
}

class Gif {
    frames: GifFrame[] = []
    delays: any[] = []
    gifReader: GifReader
    transform: TransformationTypes

    constructor(gifReader, transform: TransformationTypes = 'normal') {
        this.gifReader = gifReader;
        this.transform = transform;
        for (let f = 0; f < this.gifReader.numFrames(); f++) {
            this.frames[f] = new GifFrame(this, f, transform);
            this.delays[f] = (this.frames[f].delay) + (this.delays[f - 1] | 0);
        }
    }
    get width() {
        return this.gifReader.width;
    }
    get height() {
        return this.gifReader.height;
    }
    get length() {
        return this.delays[this.delays.length - 1]
    }
    frameData(frame) {
        let temp = [];
        this.gifReader.decodeAndBlitFrameRGBA(frame, temp);
        return {
            frameInfo: this.gifReader.frameInfo(frame),
            rgbaData: temp
        };
    }
    getFrame(frame) {
        return this.frames[frame];
    }
    getFrameFromDelay(delay) {
        delay = (delay / 10) % this.length; //gif delay is 100th of second
        if (!delay)
            return this.frames[0];
        let i = 0;
        while (i < 1000000) {
            if (delay < this.delays[i]) {
                return this.frames[i];
            }
            i++;
        }
        console.error(new Error("Infinite loop detected"));
    }
    static fromDataBuffer(buffer, transform: TransformationTypes = 'normal'): Gif {
        return new Gif(new GifReader(buffer), transform);
    }
    static fromFile(file, transform: TransformationTypes = 'normal'): Gif {
        return Gif.fromDataBuffer(readFileSync(file), transform)
    }
}