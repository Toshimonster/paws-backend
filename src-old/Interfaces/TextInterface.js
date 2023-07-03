import { BaseInterface } from "../../src/Components/Interfaces/BaseInterface";
import chalk from "chalk";
export class TextInterface extends BaseInterface {
    options;
    size;
    constructor(name, options) {
        super(name);
        this.options = options;
        this.size = this.options.x * this.options.y;
    }
    async setBuffer(buffer) {
        await new Promise((resolve) => {
            process.stdout.cursorTo(0, 0, () => {
                resolve(true);
            });
        });
        let colors = buffer.subarray(0, this.size * 3);
        for (let y = 0; y < this.options.y; y++) {
            let line = "";
            for (let x = 0; x < this.options.x; x++) {
                line +=
                    chalk.rgb(colors[(y * this.options.x + x) * 3], colors[(y * this.options.x + x) * 3 + 1], colors[(y * this.options.x + x) * 3 + 2])(this.options.symbol || "*") + " ";
            }
            await new Promise((resolve) => {
                process.stdout.clearLine(0, () => {
                    process.stdout.write(line + "\n", resolve);
                });
            });
        }
    }
}
//# sourceMappingURL=TextInterface.js.map