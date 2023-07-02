import Driver from "../Driver";

export type ModeCallback = (Paws: Driver, prevMode?: BaseMode) => Promise<void>;

export abstract class BaseMode {
	/**
	 * The name of the mode. Must be unique.
	 */
	public readonly name: string;

	public onActive: ModeCallback;
	public onInactive: ModeCallback;
}
