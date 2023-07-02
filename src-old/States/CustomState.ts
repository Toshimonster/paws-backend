import {BaseState} from "./BaseState";
import Driver from "../Driver";

export class CustomState extends BaseState {
    length: number = undefined;

    executeStateFrame:(driver: Driver, t: number, dt: number, ddt: number) => Promise<any>;
    
    constructor(name: string, executeStateFrame: (driver: Driver, t: number, dt: number, ddt: number) => Promise<any>) {
        super(name);
        this.executeStateFrame = executeStateFrame
    }
}