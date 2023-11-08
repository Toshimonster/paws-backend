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
	/*const TestInterface = Paws.addInterface(
		new Interfaces.TextLedInterface("TestInterface")
	);*/

	const FrontP3 = Paws.addInterface(
		new Interfaces.RpiMatrixInterface("Front P3 Matrices", {
			matrixOpts: {
				rows: 32,
				cols: 64,
				chainLength: 2,
				pwmLsbNanoseconds: 450,
				pwmDitherBits: 1,
				pwmBits: 7,
			},
			runtimeOpts: {
				gpioSlowdown: 3,
				dropPrivileges: 0,
			},
		})
	);

	const Ws2812b = Paws.addInterface(
		new Interfaces.Ws281xInterface("Ws2812b", 61 * 2, {
			gpio: 21,
			stripType: "ws2812",
			brightness: 5,
		})
	);

	const stateAssetRoot = "/paws/ToshiProto/State Assets/";
	const StateHandler = Paws.addMode(
		new Modes.States.StateHandler("States", [
			new Modes.States.PulserState(),
			new Modes.States.GifState("Idle", {
				interfaceDefinitions: [
					{
						interface: "Front P3 Matrices",
						file: stateAssetRoot + "Idle/Idle[face_single].gif",
						transformation: "mirror",
					},
					{
						interface: "Ws2812b",
						file: stateAssetRoot + "Idle/Idle[circle_single].gif",
						transformation: "normal",
					},
				],
			}),
		])
	);

	const PixelDrawer = Paws.addMode(
		new Modes.PixelDrawer("PixelDrawer", {
			interfaces: [FrontP3, Ws2812b],
		})
	);
	const StreamDrawer = Paws.addMode(
		new Modes.StreamDrawer("StreamDrawer", {
			interfaces: [FrontP3],
		})
	);

	const GattServer = Paws.addController(
		new Controllers.Gatt.GattServer("PAWS-Toshi", {
			name: "PAWS-T",
			services: [
				Controllers.Gatt.Services.GattServices.PAWS_STATE(StateHandler),
				Controllers.Gatt.Services.GattServices.PAWS_EXTENDED(),
				Controllers.Gatt.Services.GattServices.PAWS_MODE(),
			],
		})
	);

	Paws.start().then(() => {
		console.log("Paws running!");
		GattServer.start(Paws);
	});
}
