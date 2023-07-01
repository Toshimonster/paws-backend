import EventEmitter from "events";
import Driver from "../Driver";

export interface BaseStateOptions {
    verbose?: boolean
}

export interface TransitionInfo {
    from: string[],
    state: BaseState
}

export declare interface BaseState {
    /*
    All BaseState Events
    */
    on(event: 'OnActive', listener: (previous: string, data: any) => void): this;
    on(event: 'OnInactive', listener: (next: string) => void): this;
    on(event: 'OnTransition', listener: (previous: string, data: any) => void): this;


    emit(event: 'OnActive', previous: string, data:any): boolean;
    emit(event: 'OnInactive', next: string): boolean;
    emit(event: 'OnTransition', previous: string, data:any): boolean;
}

export abstract class BaseState extends EventEmitter {
    /*
    The base state

    Events:
        OnActive   => (data:any)
            Is called whenever the state is made active
        OnInactive => ()
            Is called whenever the state is made inactive
        OnTransition => ()
    */
    readonly name: string;
    protected options: BaseStateOptions = {}
    protected transitions: TransitionInfo[]

    protected verbose(str) {
        if (this.options.verbose) console.log(`[VERBOSE] {${this.name}} ${str}`)
    }

    protected constructor(name, transitions?: TransitionInfo[]) {
        super();
        this.name = name
        this.transitions = transitions
        this.on("OnActive", (from, data) => {
            this.verbose(`=> OnActive (from: ${from}, data: ${typeof data})`)
            if (this.transitions) {
                let transition = this.transitions.find((trans) => trans.from.includes(from))
                if (transition) {
                    this.verbose(`Running Transition ${transition.state.name}`)
                    this.currentTransitionState = transition.state
                    this.currentTransitionState.emit("OnTransition", from, data)
                }
            }
        })
        this.on("OnTransition", (from, data) => {
            this.verbose(`=> OnTransition (from: ${from}, data: ${typeof data})`)
        })
        this.on("OnInactive", () => {
            this.verbose("=> OnInactive")
        })
    }

    protected currentTransitionState: BaseState
    protected currentTransitionUntil: number

    executeFrame(driver: Driver, t: number, dt: number, ddt: number): Promise<any> {
        // Execute Transition if transition exists, and create time until end
        // Otherwise Execute this state.
        if (this.currentTransitionState) {
            if (t >= this.currentTransitionUntil) {
                this.currentTransitionState.verbose("Ending Transition")
                this.currentTransitionState = this.currentTransitionUntil = undefined
            } else {
                if (!this.currentTransitionUntil) {
                    this.currentTransitionState.verbose("Starting Transition")
                    this.currentTransitionUntil = t + this.currentTransitionState.length
                }
                return this.currentTransitionState.executeStateFrame(driver, t, dt, ddt)
            }
        }
        return this.executeStateFrame(driver, t, dt, ddt)
    }

    abstract length: number | undefined
    protected abstract executeStateFrame(driver: Driver, t: number, dt: number, ddt: number): Promise<any>
}