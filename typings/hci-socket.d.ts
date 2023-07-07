declare module "hci-socket" {
	import { EventEmitter } from "stream";

	class HciSocket extends EventEmitter {
		write(data: Buffer): void;
	}
	export default HciSocket;
}
