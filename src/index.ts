import Driver from "./Driver";
import { BaseInterface } from "./Components/Interfaces/BaseInterface";
import { TextLedInterface } from "./Components/Interfaces/TextLedInterface";
import { StateHandler } from "./Components/Modes/States/StateHandler";
import { PulserState } from "./Components/Modes/States/PulserState";
import { PixelDrawer } from "./Components/Modes/PixelDrawer";
import { GattServer } from "./Components/Controllers/GattServer";

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

if (require.main === module) {
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

	await Paws.start();
	console.log("Paws running!");
}
