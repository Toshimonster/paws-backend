export { Driver } from "./Driver.js";

export * as Interfaces from "./Components/Interfaces/index.js";
export * as Modes from "./Components/Modes/index.js";
export * as Controllers from "./Components/Controllers/index.js";

import { Driver } from "./Driver.js";

import * as Interfaces from "./Components/Interfaces/index.js";
import * as Modes from "./Components/Modes/index.js";
import * as Controllers from "./Components/Controllers/index.js";

import { fileURLToPath } from "url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	// Run by default
	const Paws = new Driver();
	const TestInterface = Paws.addInterface(
		new Interfaces.TextLedInterface("TestInterface")
	);

	const StateHandler = Paws.addMode(
		new Modes.States.StateHandler("States", [new Modes.States.PulserState()])
	);
	const PixelDrawer = Paws.addMode(
		new Modes.PixelDrawer("PixelDrawer", {
			interfaces: [TestInterface],
		})
	);

	Paws.addControllers([
		new Controllers.Gatt.GattServer("Toshi", {
			name: "Toshi",
			services: [
				Controllers.Gatt.Services.GattServices.PAWS(StateHandler),
				Controllers.Gatt.Services.GattServices.PAWS_EXTENDED(),
			],
		}),
		new Controllers.RandomController(),
	]);

	Paws.start().then(() => {
		console.log("Paws running!");
	});
}
