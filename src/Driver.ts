import {BaseState} from "./States";
import {BaseInterface} from "./Interfaces";

const {performance} = require("perf_hooks")
const events = require("events")

interface driverOptions {
    showFPS?: boolean,
    verbose?: boolean
}

export default class Driver extends events.EventEmitter {

    private animationLoopCondition: boolean = false
    private animationLoopStart: number = 0
    private static readonly fpsUpdateEveryXFrames: number = 100
    private frame: number = 0

    private readonly verbose = (str) => {
        if (this.options?.verbose) console.log(`[VERBOSE] ${str}`);
    }

    private readonly animationLoop = async (driver: Driver, old_dt = 0) => {
        const t = performance.now()
        const dt = t - driver.animationLoopStart
        const ddt = dt - old_dt
        this.frame ++

        if (this.options?.showFPS && this.frame % Driver.fpsUpdateEveryXFrames === 0) {
            console.log(`FPS: ${1 / ddt * 1e3}`);
        }

        await driver._executeStateFrame(t, dt, ddt)

        if (this.animationLoopCondition) setImmediate(this.animationLoop, driver, dt);
    }
    private startAnimationLoop = (): Promise<void> => {
        this.verbose("Animation loop starting...")
        this.animationLoopCondition = true
        return this.animationLoop(this)
    }
    private stopAnimationLoop = () => {
        this.verbose("Animation loop stopping...")
        this.animationLoopCondition = false
    }

    private _activeState: BaseState
    private _interfaces: Map<string, BaseInterface> = new Map<string, BaseInterface>()
    private _states: Map<string, BaseState> = new Map<string, BaseState>()
    get state(): string {
        return this._activeState?.name
    }
    get interfaces(): string[] {
        return Array.from(this._interfaces.keys())
    }
    get states(): string[] {
        return Array.from(this._states.keys())
    }

    constructor(readonly options?:driverOptions) {
        super();
        this.verbose("Constructed")
        this.emit("constructed")
    }

    addStates(states:BaseState[]) {
        for (let state of states) {
            this._states.set(state.name, state)
            this.verbose(`Added state: ${state.name}`)
        }
    }

    addInterfaces(interfaces:BaseInterface[]) {
        for (let driverInterface of interfaces) {
            this._interfaces.set(driverInterface.name, driverInterface)
            this.verbose(`Added interface: ${driverInterface.name}`)
        }
    }

    start() {
        this.verbose("Starting...")
        this.emit("ready", this)
        this.startAnimationLoop()
    }

    hasState(state: string) {
        return this._states.has(state)
    }

    setState(state: string, data?: any) {
        this.verbose(`Setting state to ${state}...`)
        if (!this.hasState(state)) {
            console.error(`Failed to set state:\nThe state ${state} does not exist`)
            return;
        }
        if (this.state) {
            this._activeState.emit("OnInactive", state)
        }
        let oldState = this.state
        this.emit("stateChange")
        this._activeState = this._states.get(state)
        this._activeState.emit("OnActive", oldState, data)
    }

    getInterface(interfaceName: string): BaseInterface {
        return this._interfaces.get(interfaceName)
    }

    private async _executeStateFrame(t: number, dt: number, ddt: number) {
        await this._activeState.executeFrame(this, t, dt, ddt)
    }
}