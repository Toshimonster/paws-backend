const { performance } = require("perf_hooks");
const events = require("events");
export default class Driver extends events.EventEmitter {
    options;
    animationLoopCondition = false;
    animationLoopStart = 0;
    static fpsUpdateEveryXFrames = 100;
    frame = 0;
    verbose = (str) => {
        if (this.options?.verbose)
            console.log(`[VERBOSE] ${str}`);
    };
    animationLoop = async (driver, old_dt = 0) => {
        const t = performance.now();
        const dt = t - driver.animationLoopStart;
        const ddt = dt - old_dt;
        this.frame++;
        if (this.options?.showFPS && this.frame % Driver.fpsUpdateEveryXFrames === 0) {
            console.log(`FPS: ${1 / ddt * 1e3}`);
        }
        await driver._executeStateFrame(t, dt, ddt);
        if (this.animationLoopCondition)
            setImmediate(this.animationLoop, driver, dt);
    };
    startAnimationLoop = () => {
        this.verbose("Animation loop starting...");
        this.animationLoopCondition = true;
        return this.animationLoop(this);
    };
    stopAnimationLoop = () => {
        this.verbose("Animation loop stopping...");
        this.animationLoopCondition = false;
    };
    _activeState;
    _interfaces = new Map();
    _states = new Map();
    get state() {
        return this._activeState?.name;
    }
    get interfaces() {
        return Array.from(this._interfaces.keys());
    }
    get states() {
        return Array.from(this._states.keys());
    }
    constructor(options) {
        super();
        this.options = options;
        this.verbose("Constructed");
        this.emit("constructed");
    }
    addStates(states) {
        for (let state of states) {
            this._states.set(state.name, state);
            this.verbose(`Added state: ${state.name}`);
        }
    }
    addInterfaces(interfaces) {
        for (let driverInterface of interfaces) {
            this._interfaces.set(driverInterface.name, driverInterface);
            this.verbose(`Added interface: ${driverInterface.name}`);
        }
    }
    _modes = [];
    activeMode;
    start() {
        this.verbose("Starting...");
        this.emit("ready", this);
        this.startAnimationLoop();
    }
    hasState(state) {
        return this._states.has(state);
    }
    setState(state, data) {
        this.verbose(`Setting state to ${state}...`);
        if (!this.hasState(state)) {
            console.error(`Failed to set state:\nThe state ${state} does not exist`);
            return;
        }
        if (this.state) {
            this._activeState.emit("OnInactive", state);
        }
        let oldState = this.state;
        this.emit("stateChange");
        this._activeState = this._states.get(state);
        this._activeState.emit("OnActive", oldState, data);
    }
    getInterface(interfaceName) {
        return this._interfaces.get(interfaceName);
    }
    async _executeStateFrame(t, dt, ddt) {
        await this._activeState.executeFrame(this, t, dt, ddt);
    }
}
//# sourceMappingURL=Driver.js.map