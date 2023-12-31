import { BaseController } from "../BaseController.js";
import BleHost, { GattServerService, Transport } from "ble-host";
import { Driver } from "../../../Driver.js";
import { optionalImport } from "../../Helper/index.js";
const HciSocket: new () => Transport = await optionalImport(
	async () => (await import("hci-socket")).default
);

const { BleManager, AdvertisingDataBuilder, HciErrors } = BleHost;

export interface GattServerOptions {
	name: string;
	services: ServiceDefs[];
}

/**
 * Should return a server service, upon an instance of the driver
 */
export type ServiceDefs = (driver: Driver) => GattServerService;

/**
 * @ignore
 */
export const GattServerOptionsDefault: GattServerOptions = {
	/**
	 * The name to be displayed on the GATT advertising data
	 */
	name: "GATT",
	/**
	 * The services to actualise upon
	 */
	services: [],
};

/**
 * A controller that represents the PAWS device as a BLE GATT server
 * Note that only the first 128 bit UUID service will be advertised
 */
export class GattServer extends BaseController {
	private readonly options: GattServerOptions = GattServerOptionsDefault;
	private transport?: Transport;

	/**
	 * Creates a GattServer Controller
	 * @param name The name of the controller. Will define options, if left undefined
	 * @param options The options for the gatt server
	 */
	constructor(name?: string, options: Partial<GattServerOptions> = {}) {
		super(name);
		if (!options.name) options.name = name;
		this.options = { ...this.options, ...options };
	}

	/**
	 * Starts the GATT server, given a driver
	 * @param driver The PAWS driver
	 */
	start(driver: Driver) {
		try {
			this.transport = new HciSocket();
		} catch (error) {
			if (error.code === "EPERM") {
				console.error(
					"Gatt Server Controller requires root access. Please run with sudo."
				);
			} else if (error.code === "EBUSY") {
				console.error(
					"Gatt Server Controller cannot find a free bluetooth device. Please check settings."
				);
			} else if (error.code === "ENODEV") {
				console.error(
					"Gatt Server Controller cannot find any bluetooth devices."
				);
			} else {
				throw error;
			}
			process.exit(1);
		}

		console.log("Creating BLE");
		BleManager.create(this.transport, {}, (err, manager) => {
			// err is either null or an Error object
			// if err is null, manager contains a fully initialized BleManager object
			if (err) {
				console.error(err);
				return;
			}

			// remove manditory services (?)

			// set services and option names
			console.log(`Setting device name to ${this.options.name}`);
			manager.gattDb.setDeviceName(this.options.name);
			const services = this.options.services.map((serviceFun) =>
				serviceFun(driver)
			);
			manager.gattDb.addServices(services);

			const ServiceUUIDS = services.map((service) => service.uuid);
			const { _128UUIDS, _16UUIDS } = ServiceUUIDS.reduce(
				(result, item) => {
					if (typeof item === "string") {
						result._128UUIDS.push(item);
					} else {
						result._16UUIDS.push(item);
					}
					return result;
				},
				{ _128UUIDS: [], _16UUIDS: [] } as {
					_128UUIDS: string[];
					_16UUIDS: number[];
				}
			);

			const advDataBuffer = new AdvertisingDataBuilder()
				.addFlags(["leGeneralDiscoverableMode", "brEdrNotSupported"])
				.addLocalName(/*isComplete*/ true, this.options.name)
				.add128BitServiceUUIDs(/*isComplete*/ true, [_128UUIDS[0]])
				//.add16BitServiceUUIDs(/*isComplete*/ true, _16UUIDS)
				.build();
			manager.setAdvertisingData(advDataBuffer);
			// call manager.setScanResponseData(...) if scan response data is desired too
			const startAdv = () => {
				manager.startAdvertising(
					{
						/*options*/
					},
					(status, conn) => {
						if (status != HciErrors.SUCCESS) {
							// Advertising could not be started for some controller-specific reason, try again after 10 seconds
							setTimeout(startAdv, 10000);
							console.log("Cannot start advertising.. restarting");
							return;
						}
						console.log("Connected to device! - " + conn.peerAddress);
						conn.on("disconnect", startAdv); // restart advertising after disconnect
					}
				);
			};
			startAdv();
		});
	}
}
