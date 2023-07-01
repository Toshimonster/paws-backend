import {BaseInterface} from "./BaseInterface";
import chalk from "chalk";

interface TextInterfaceOptions {
    x: number,
    y: number,
    symbol: string
}

export class TextInterface extends BaseInterface {
    public readonly size: number;

    constructor(name, readonly options:TextInterfaceOptions) {
        super(name);
        this.size = this.options.x * this.options.y
    }

    async setBuffer(buffer: Buffer): Promise<void> {
        await new Promise(resolve => {
            process.stdout.cursorTo(0, 0, () => {
                resolve(true)
            })
        })

        let colors = buffer.slice(0, this.size*3)
        for (let y = 0; y < this.options.y; y++) {
            let line = ""
            for (let x = 0; x < this.options.x; x++) {
                line += chalk.rgb(
                    colors[(y*this.options.x+x) * 3],
                    colors[(y*this.options.x+x) * 3 + 1],
                    colors[(y*this.options.x+x) * 3 + 2]
                )(this.options.symbol || "*") + " "
            }
            await new Promise(resolve => {
                process.stdout.clearLine(0, () => {
                    process.stdout.write(line + "\n", resolve)
                })
            })

        }

    }
}