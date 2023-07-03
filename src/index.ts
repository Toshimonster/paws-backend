import Driver from "./Driver.js";
import { BaseInterface } from "./Components/Interfaces/BaseInterface.js";
import { TextLedInterface } from "./Components/Interfaces/TextLedInterface.js";
import { StateHandler } from "./Components/Modes/States/StateHandler.js";
import { PulserState } from "./Components/Modes/States/PulserState.js";
import { PixelDrawer } from "./Components/Modes/PixelDrawer.js";
import { GattServer } from "./Components/Controllers/GattServer.js";

import { fileURLToPath } from "url";

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
	states: {
		StateHandler,
		PulserState,
	},
	PixelDrawer,
};

export const controllers = {
	GattServer,
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	// Run by default
	const Paws = new Driver();
	Paws.addInterface(new TextLedInterface("TestInterface"));

	const StateHandler = Paws.addMode(
		new modes.states.StateHandler([new modes.states.PulserState()])
	);
	const PixelDrawer = Paws.addMode(new modes.PixelDrawer());

	Paws.addController(
		new controllers.GattServer({
			StateHandler,
			PixelDrawer,
		})
	);

	Paws.start().then(() => {
		console.log("Paws running!");
	});
}
