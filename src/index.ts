import * as fs from "fs";

export { Driver } from "./Driver.js";

export * as Interfaces from "./Components/Interfaces/index.js";
export * as Modes from "./Components/Modes/index.js";
export * as Controllers from "./Components/Controllers/index.js";

import { Driver } from "./Driver.js";

import * as Interfaces from "./Components/Interfaces/index.js";
import * as Modes from "./Components/Modes/index.js";
import * as Controllers from "./Components/Controllers/index.js";

import { fileURLToPath } from "url";
import * as path from "path";
import { BaseState } from "./Components/Modes/States/index.js";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	// Run by default
	const Paws = new Driver();

	/*const TestInterface = Paws.addInterface(
		new Interfaces.TextLedInterface("TestInterface")
	);*/

	const FrontP3 = Paws.addInterface(
		new Interfaces.RpiMatrixInterface("face", {
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
		new Interfaces.Ws281xInterface("circle", 61 * 2, {
			gpio: 21,
			stripType: "ws2812",
			brightness: 5,
		})
	);

	const stateAssetRoot = "/paws/ToshiProto/State Assets/";
	// const stateImgurPreviewCodeMap = "_previewImgurMap.json"

	// let stateImgurPreviewCodes: {any?: any} = {}
	// const stateImgurPath = path.join(stateAssetRoot, stateImgurPreviewCodeMap)
	// if (fs.existsSync(stateImgurPath)) {
	// 	stateImgurPreviewCodes = JSON.parse(
	// 		fs.readFileSync(path.join(stateAssetRoot, stateImgurPreviewCodeMap), 'utf8')
	// 	)
	// }

	const states: BaseState[] = [];
	fs.readdirSync(stateAssetRoot).forEach((state) => {
		console.log(state);
		let imgurCode: string = ""
		const stateRoot = path.join(stateAssetRoot, state);
		const stateTransitions = new Map<string, any[]>();
		const root: { file: string; interface: string; transformation: any }[] = [];

		fs.readdirSync(stateRoot).forEach((file) => {
			// Check for imgurCode
			if (file.toLowerCase() == "preview.link") {
				imgurCode = fs.readFileSync(path.join(stateRoot, file), 'utf8')
				console.log(`Found Preview Link Code ${imgurCode}`)
				return
			}

			const fileRoot = path.join(stateRoot, file);

			console.log("\t\t", fileRoot);
			const stateMatches = file.match(/\w+(?=\[\w+(_\w+)?\]\.gif$)/);
			const state =
				stateMatches === null ? undefined : stateMatches[0].slice(1);
			if (state != state) return; //File is not a valid gif definition file

			const transitions = file.match(/\w+(?=[-~])/g);
			const componentInterfaceMatches = file.match(
				/\[[^_\]]+(?=(_\w+)?\]\.gif$)/
			); //Remove prefix [
			const componentInterface =
				componentInterfaceMatches === null
					? undefined
					: componentInterfaceMatches[0].slice(1);
			if (!componentInterface) return;
			const transformationMatches = file.match(/_\w+(?=\]\.gif$)/);
			const transformation =
				transformationMatches === null
					? "normal"
					: transformationMatches[0].slice(1);

			console.log("\t\t", state);
			console.log("\t\t", transitions);
			console.log("\t\t", componentInterface);
			console.log("\t\t", transformation);

			const interfaceDefinition: {
				file: string;
				interface: string;
				transformation: string;
			} = {
				interface: componentInterface,
				file: fileRoot,
				transformation: transformation,
			};

			if (!transitions) {
				root.push(interfaceDefinition);
			} else {
				const tempTrans = transitions.join("-");
				if (!stateTransitions.has(tempTrans))
					stateTransitions.set(tempTrans, []);
				stateTransitions.get(tempTrans)?.push(interfaceDefinition);
			}
		});

		const transitions: { from: string[]; state: BaseState }[] = [];
		console.log("\tTransitions");
		stateTransitions.forEach((value, key) => {
			console.log("\t\t", key);
			console.log("\t\t", value);
			transitions.push({
				from: key.split("-"),
				state: new Modes.States.GifState(key + "~" + state, {
					interfaceDefinitions: value,
				}),
			});
		});

		// const rawImgurCode = stateImgurPreviewCodes[state as keyof typeof stateImgurPreviewCodes]
		// const imgurCode = typeof rawImgurCode == 'string' ? rawImgurCode : undefined

		states.push(
			new Modes.States.GifState(
				state,
				{ interfaceDefinitions: root },
				transitions,
				imgurCode
			)
		);
	});

	const StateHandler = Paws.addMode(
		new Modes.States.StateHandler("States", [
			new Modes.States.PulserState(),
			/*new Modes.States.GifState("Idle", {
				interfaceDefinitions: [
					{
						interface: "Front P3 Matrices",
						file: stateAssetRoot + "Idle/Idle[face_mirror].gif",
						transformation: "mirror",
					},
					{
						interface: "Ws2812b",
						file: stateAssetRoot + "Idle/Idle[circle_mirror].gif",
						transformation: "mirror",
					},
				],
			}),*/
			...states,
		])
	);

	const PixelDrawer = Paws.addMode(
		new Modes.PixelDrawer("PixelDrawer", {
			interfaces: [FrontP3],
		})
	);
	const StreamDrawer = Paws.addMode(
		new Modes.PixelDrawer("StreamDrawer", {
			interfaces: [FrontP3],
		})
	);

	const GattServer = Paws.addController(
		new Controllers.Gatt.GattServer("PAWS-T", {
			name: "PAWS-T",
			services: [
				Controllers.Gatt.Services.GattServices.PAWS_STATE(StateHandler),
				Controllers.Gatt.Services.GattServices.PAWS_EXTENDED()
			],
		})
	);

	Paws.start().then(() => {
		StateHandler.setState("Idle");
		console.log("Paws running!");
		GattServer.start(Paws);
	});
}
