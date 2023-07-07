import Driver from "./Driver.js";
import { BaseInterface } from "./Components/Interfaces/BaseInterface.js";
import { TextLedInterface } from "./Components/Interfaces/TextLedInterface.js";
import { StateHandler } from "./Components/Modes/States/StateHandler.js";
import { PulserState } from "./Components/Modes/States/PulserState.js";
import { PixelDrawer } from "./Components/Modes/PixelDrawer.js";
import { GattServer } from "./Components/Controllers/Gatt/GattServer.js";

import { fileURLToPath } from "url";
import { RandomController } from "./Components/Controllers/RandomController.js";
import { BaseMode } from "./Components/Modes/BaseMode.js";
import { BaseController } from "./Components/Controllers/BaseController.js";
import { BaseState } from "./Components/Modes/States/BaseState.js";
import {
	GattServerUUIDS,
	GattServices,
} from "./Components/Controllers/Gatt/GattServices.js";

export default Driver;

/**
 * Gives different interfaces that can be utilized by PAWS
 */
export const interfaces = {
	BaseInterface,
	TextLedInterface,
};

/**
 * Gives different modes that can be utilized by PAWS
 */
export const modes = {
	/**
	 * Gives a mode that can control multiple different states, given by StateHandler,
	 * defined with multiple State classes
	 */
	BaseMode,
	states: {
		StateHandler,

		BaseState,
		PulserState,
	},
	PixelDrawer,
};

export const controllers = {
	BaseController,
	gatt: {
		GattServer,

		GattServices,
		GattServerUUIDS,
	},
	RandomController,
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	// Run by default
	const Paws = new Driver();
	const TestInterface = Paws.addInterface(
		new TextLedInterface("TestInterface")
	);

	const StateHandler = Paws.addMode(
		new modes.states.StateHandler("States", [new modes.states.PulserState()])
	);
	const PixelDrawer = Paws.addMode(
		new modes.PixelDrawer("PixelDrawer", {
			interfaces: [TestInterface],
		})
	);

	Paws.addControllers([
		new controllers.gatt.GattServer("Toshi", {
			StateHandler,
			PixelDrawer,
			services: [controllers.gatt.GattServices.PAWS_EXTENDED()],
		}),
		new controllers.RandomController(),
	]);

	Paws.start().then(() => {
		console.log("Paws running!");
	});
}
