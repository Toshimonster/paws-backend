import EventEmitter from "events";
export class BaseState extends EventEmitter {
    /*
    The base state

    Events:
        OnActive   => (data:any)
            Is called whenever the state is made active
        OnInactive => ()
            Is called whenever the state is made inactive
        OnTransition => ()
    */
    name;
    options = {};
    transitions;
    verbose(str) {
        if (this.options.verbose)
            console.log(`[VERBOSE] {${this.name}} ${str}`);
    }
    constructor(name, transitions) {
        super();
        this.name = name;
        this.transitions = transitions;
        this.on("OnActive", (from, data) => {
            this.verbose(`=> OnActive (from: ${from}, data: ${typeof data})`);
            if (this.transitions) {
                let transition = this.transitions.find((trans) => trans.from.includes(from));
                if (transition) {
                    this.verbose(`Running Transition ${transition.state.name}`);
                    this.currentTransitionState = transition.state;
                    this.currentTransitionState.emit("OnTransition", from, data);
                }
            }
        });
        this.on("OnTransition", (from, data) => {
            this.verbose(`=> OnTransition (from: ${from}, data: ${typeof data})`);
        });
        this.on("OnInactive", () => {
            this.verbose("=> OnInactive");
        });
    }
    currentTransitionState;
    currentTransitionUntil;
    executeFrame(driver, t, dt, ddt) {
        // Execute Transition if transition exists, and create time until end
        // Otherwise Execute this state.
        if (this.currentTransitionState) {
            if (t >= this.currentTransitionUntil) {
                this.currentTransitionState.verbose("Ending Transition");
                this.currentTransitionState = this.currentTransitionUntil = undefined;
            }
            else {
                if (!this.currentTransitionUntil) {
                    this.currentTransitionState.verbose("Starting Transition");
                    this.currentTransitionUntil = t + this.currentTransitionState.length;
                }
                return this.currentTransitionState.executeStateFrame(driver, t, dt, ddt);
            }
        }
        return this.executeStateFrame(driver, t, dt, ddt);
    }
}
//# sourceMappingURL=BaseState.js.map