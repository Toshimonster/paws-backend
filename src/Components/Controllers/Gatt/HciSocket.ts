/**
 * Handle of optional dependency for GATT, using a dummy
 * @ignore
 */

import EventEmitter from "events";
import { Transport } from "ble-host";

class socketClass extends EventEmitter {
	write() {
		throw new Error("hci-socket not installed!");
	}
}
let socket: new () => Transport;
try {
	const importedModule = await import("hci-socket");
	socket = importedModule.default;
} catch (e) {
	console.warn("Hci socket not installed");
	socket = socketClass;
}

export const HciSocket = socket;
