import { BaseInterface } from "./Components/Interfaces/BaseInterface.js";
import { BaseMode } from "./Components/Modes/BaseMode.js";
import { BaseController } from "./Components/Controllers/BaseController.js";
import { NamedComponent } from "./Components/NamedComponent.js";

/**
 * P.A.W.S Driver. Drives the entire operation
 */
export class Driver {
	private interfaces: Map<string, BaseInterface> = new Map();
	private modes: Map<string, BaseMode> = new Map();
	private modesDefaultId: string | undefined;
	private controllers: Map<string, BaseController> = new Map();

	private activeMode: BaseMode | undefined;

	/**
	 * Adds a named component to a given map
	 * @param map The given map
	 * @param component The given component
	 * @protected
	 */
	protected addComponent<T extends NamedComponent>(
		map: Map<string, T>,
		component: T
	): T {
		if (map.has(component.name))
			console.warn(
				`Overwriting component ${component.name} - Are names unique?`
			);
		map.set(component.name, component);
		return component;
	}

	/**
	 * Adds an array of named components to a given map
	 * @param map The given map
	 * @param components The given components
	 * @protected
	 */
	protected addComponents<T extends NamedComponent>(
		map: Map<string, T>,
		components: T[]
	) {
		for (const component of components) {
			this.addComponent(map, component);
		}
		return components;
	}

	/**
	 * Initialises all named components in a map, by executing init with reference to the device.
	 * @param map The given map
	 * @protected
	 */
	protected async initComponents<T extends NamedComponent>(
		map: Map<string, T>
	) {
		const promises: Promise<void>[] = [];
		for (const [, comp] of map) {
			promises.push(comp.init(this));
		}
		return await Promise.all(promises);
	}

	/**
	 * Adds or overwrites an interface to the PAWS device, based on its name
	 * @param deviceInterface the interface
	 * @returns the interface inserted
	 */
	addInterface<T extends BaseInterface>(deviceInterface: T): T {
		this.addComponent(this.interfaces, deviceInterface);
		return deviceInterface;
	}

	/**
	 * Multiple helper function for addInterface
	 */
	addInterfaces<T extends BaseInterface>(deviceInterfaces: T[]): T[] {
		this.addComponents(this.interfaces, deviceInterfaces);
		return deviceInterfaces;
	}

	/**
	 * Adds or overwrites a mode to the PAWS device, based on its name.
	 * The first mode added will be defaulted.
	 * @param mode the mode
	 * @returns the mode inserted
	 */
	addMode<T extends BaseMode>(mode: T): T {
		// Set default
		this.addComponent(this.modes, mode);
		if (!this.modesDefaultId) this.setDefaultMode(mode.name);
		return mode;
	}

	/**
	 * Multiple helper function for addMode.
	 * The first mode in the array will be defaulted.
	 */
	addModes<T extends BaseMode>(modes: T[]): T[] {
		this.addComponents(this.modes, modes);
		return modes;
	}

	/**
	 * Adds or overwrites a controller to the PAWS device, based on its name
	 * @param controller the controller
	 * @returns the controller inserted
	 */
	addController<T extends BaseController>(controller: T): T {
		this.addComponent(this.controllers, controller);
		return controller;
	}

	/**
	 * Multiple helper function for addMode
	 */
	addControllers<T extends BaseController>(controllers: T[]): T[] {
		this.addComponents(this.controllers, controllers);
		return controllers;
	}

	/**
	 * Sets the default mode for the PAWS device, to be set to on initialisation.
	 * @param modeId
	 */
	setDefaultMode(modeId: string) {
		if (!this.modes.has(modeId))
			throw new Error(`Unknown mode '${modeId}' - has it been added yet?`);
		this.modesDefaultId = modeId;
	}

	/**
	 * Sets the mode for the given PAWS device, triggering callbacks
	 * @param modeId
	 * @return if successful
	 */
	public async setMode(modeId: string) {
		if (!this.modes.has(modeId)) {
			console.warn(`Unknown mode '${modeId}' - has it been added yet?`);
			return false;
		}
		if (this.activeMode?.name === modeId) return false;
		const newMode = this.modes.get(modeId);
		if (!newMode) return false;
		// run callbacks
		if (this.activeMode) await this.activeMode.onInactive(newMode);
		const prevMode = this.activeMode;
		this.activeMode = newMode;
		await this.activeMode.onActive(this.interfaces, prevMode);
	}

	getMode() {
		return this.activeMode;
	}

	getModes() {
		return this.modes;
	}

	getModeArray() {
		return Array.from(this.getModes().values());
	}

	/**
	 * Starts the server, initialising and starting modes
	 */
	async start() {
		await this.initComponents(this.interfaces);
		await this.initComponents(this.modes);
		await this.initComponents(this.controllers);
		await this.setMode(
			this.modesDefaultId || Array.from(this.modes.values())[0].name
		);
	}
}
