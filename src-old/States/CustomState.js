import { BaseState } from "./BaseState";
export class CustomState extends BaseState {
    length = undefined;
    executeStateFrame;
    constructor(name, executeStateFrame) {
        super(name);
        this.executeStateFrame = executeStateFrame;
    }
}
//# sourceMappingURL=CustomState.js.map