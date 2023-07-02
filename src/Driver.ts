import { BaseInterface } from "./Components/Interfaces/BaseInterface";
import { BaseMode } from "./Components/Modes/BaseMode";
import { BaseController } from "./Components/Controllers/BaseController";
import { NamedComponent } from "./Components/NamedComponent";

/**
 * P.A.W.S Driver. Drives the entire operation
 */
class Driver {
	private interfaces: Map<string, BaseInterface>;
	private modes: Map<string, BaseMode>;
	private modesDefaultId: string | undefined;
	private controllers: Map<string, BaseController>;

	private activeMode: BaseMode | undefined;
	get mode() {
		return this.activeMode;
	}

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
		for (const mapKey in map) {
			promises.push(map[mapKey].init(this));
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
		if (!this.modesDefaultId) this.modesDefaultId = mode.name;
		this.addComponent(this.modes, mode);
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
	 * Starts the server, initialising and starting modes
	 */
	async start() {
		await this.initComponents(this.interfaces);
		await this.initComponents(this.modes);
		await this.initComponents(this.controllers);
	}
}

export default Driver;
