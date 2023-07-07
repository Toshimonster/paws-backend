import Driver from "../../../Driver.js";
import BleHost, { GattServerService } from "ble-host";
import { PixelDrawer } from "../../Modes/PixelDrawer.js";
import { StreamDrawer } from "../../Modes/StreamDrawer.js";
import { uptime } from "os";
import {
	cpuTemperature,
	currentLoad,
	networkInterfaces,
} from "systeminformation";
import { StateHandler } from "../../Modes/States/StateHandler.js";

const { AttErrors } = BleHost;

type uuid = string;
export type GattUuidDef = {
	PAWS: {
		uuid: uuid;
		children: {
			STATES: uuid;
			STATE: uuid;
			TIMESTAMP: uuid;
			UPTIME: uuid;
			CPU_TEMP: uuid;
			CPU_LOAD: uuid;
			NETWORK: uuid;
		};
	};
	PAWS_EXTRA: {
		uuid: uuid;
		children: {
			PIXELDRAW_ENABLED: uuid;
			PIXELDRAW_INTERFACE: uuid;
			STREAM_ENABLED: uuid;
			STREAM_INTERFACE: uuid;
		};
	};
};

/**
 * The default server uuids used for all gatt services
 */
export const GattServerUUIDS: GattUuidDef = {
	PAWS: {
		uuid: "04f9d599-ce17-4397-a65d-cf769397551a",
		children: {
			STATES: "0694bc1c-0064-4bd7-9840-41fa65d7355e",
			STATE: "81a6a500-b85e-4951-b6ac-b63c8f97f678",
			TIMESTAMP: "fa7abfe6-af90-42bf-a154-c2bdb7eb336a",
			UPTIME: "97dcaa87-eaa8-4546-bb33-ad001fc3daf4",
			CPU_TEMP: "31b0159a-d4bd-4396-9e77-7ebb24db6df3",
			CPU_LOAD: "26414bca-7991-46e5-a559-376c7d515a1f",
			NETWORK: "4bb22157-34d4-481c-949f-18aaa00f45e4",
		},
	},
	PAWS_EXTRA: {
		uuid: "bacc1dbc-f1f3-42f2-b572-bd3e16923f28",
		children: {
			PIXELDRAW_ENABLED: "ea003779-e651-49e8-91ab-05b65e66b95f",
			PIXELDRAW_INTERFACE: "65a8fc81-2f01-47e4-b25d-b39b4a90718c",
			STREAM_ENABLED: "450c8fdb-9502-4b00-b488-cb2455ab842e",
			STREAM_INTERFACE: "21232f3e-fe85-4fda-b204-1d157d2f12c4",
		},
	},
};

export const GattServices = {
	/**
	 * Defines the PAWS Api, based on a specific state handler.
	 * The base PAWS api assumes only one mode, the stateHandler, which is populated with all states for the object.
	 * @param stateHandler The state mode
	 * @param uuids The default BLE characteristic and service uuids
	 * @constructor
	 */
	PAWS:
		(stateHandler: StateHandler, uuids: GattUuidDef = GattServerUUIDS) =>
		(): GattServerService => {
			return {
				//P.A.W.S Service
				uuid: uuids.PAWS.uuid,
				characteristics: [
					{
						// PAWS state list
						uuid: uuids.PAWS.children.STATES,
						properties: ["read"],
						onRead: (connection, callback) => {
							callback(
								AttErrors.SUCCESS,
								stateHandler.listStateNames().join(", ")
							);
						},
					},
					{
						// PAWS Raw State Read and Write
						uuid: uuids.PAWS.children.STATE,
						properties: ["read", "write"],
						onRead: (connection, callback) => {
							callback(AttErrors.SUCCESS, stateHandler.state.name);
						},
						onWrite: async (connection, needsResponse, value, callback) => {
							const stateChange = value.toString().replace(/\0/g, "");
							if (await stateHandler.setState(stateChange)) {
								callback(AttErrors.SUCCESS);
							} else {
								callback(AttErrors.OUT_OF_RANGE);
							}
						},
					},
					{
						// Current Timestamp as String
						uuid: uuids.PAWS.children.TIMESTAMP,
						properties: ["read"],
						onRead: (connection, callback) => {
							callback(AttErrors.SUCCESS, new Date().toString());
						},
					},
					{
						// Current Uptime as FloatLE
						uuid: uuids.PAWS.children.UPTIME,
						properties: ["read"],
						onRead: (connection, callback) => {
							const buffer = Buffer.allocUnsafe(4);
							buffer.writeFloatLE(uptime());
							callback(AttErrors.SUCCESS, buffer);
						},
					},
					{
						// CPU temp
						uuid: uuids.PAWS.children.CPU_TEMP,
						properties: ["read"],
						onRead: (connection, callback) => {
							cpuTemperature()
								.then((data) => {
									const buffer = Buffer.allocUnsafe(4);
									buffer.writeFloatLE(data.max);
									callback(AttErrors.SUCCESS, buffer);
								})
								.catch(() => {
									callback(AttErrors.UNLIKELY_ERROR, Buffer.allocUnsafe(0));
								});
						},
					},
					{
						// CPU load
						uuid: uuids.PAWS.children.CPU_LOAD,
						properties: ["read"],
						onRead: (connection, callback) => {
							currentLoad()
								.then((data) => {
									const buffer = Buffer.allocUnsafe(4);
									buffer.writeFloatLE(data.avgLoad);
									callback(AttErrors.SUCCESS, buffer);
								})
								.catch(() => {
									callback(AttErrors.UNLIKELY_ERROR, Buffer.allocUnsafe(0));
								});
						},
					},
					{
						// Network Addresses
						uuid: uuids.PAWS.children.NETWORK,
						properties: ["read"],
						onRead: (connection, callback) => {
							networkInterfaces()
								.then((data) => {
									const interfaces = data instanceof Array ? data : [data];
									const value = interfaces
										.map((value) => {
											return `${value.ifaceName}:${value.ip4}`;
										})
										.join(",");
									callback(AttErrors.SUCCESS, value);
								})
								.catch((err) => {
									console.error(err);
									callback(AttErrors.UNLIKELY_ERROR, Buffer.allocUnsafe(0));
								});
						},
					},
				],
			};
		},

	/**
	 * Defines the PAWS EXTENDED Api.
	 * This defines mode and handling for PIXELDRAW modes, and STREAMDRAW modes.
	 * Note, that this requires the specified mode to be active, unlike the PAWS api.
	 * As such, multiple PIXELDRAW and STREAMDRAW modes can co-exist.
	 * @param uuids The default BLE characteristic and service uuids
	 * @constructor
	 */
	PAWS_EXTENDED:
		(uuids: GattUuidDef = GattServerUUIDS) =>
		(driver: Driver): GattServerService => {
			return {
				/*
                PAWS Additional service; pixel drawing
                 */
				uuid: uuids.PAWS_EXTRA.uuid,
				isSecondaryService: true,
				characteristics: [
					{
						// PixelDraw Enabled service
						uuid: uuids.PAWS_EXTRA.children.PIXELDRAW_ENABLED,
						properties: ["read"],
						onRead: (connection, callback) => {
							const buffer = Buffer.allocUnsafe(1);
							buffer.writeUInt8(
								driver.getMode() instanceof PixelDrawer ? 1 : 0
							);
							callback(AttErrors.SUCCESS, buffer);
						},
						onAuthorizeRead: (connection, callback) => {
							callback(AttErrors.SUCCESS);
						},
					},
					{
						// PixelDraw interface service
						uuid: uuids.PAWS_EXTRA.children.PIXELDRAW_INTERFACE,
						properties: ["write"],
						onWrite: async (
							connection,
							needsResponse,
							value: Buffer,
							callback
						) => {
							const mode = driver.getMode();
							if (mode instanceof PixelDrawer) {
								if (mode.bufferSize === value.length) {
									callback(AttErrors.INVALID_ATTRIBUTE_VALUE_LENGTH);
								} else {
									await mode.update(value);
									callback(AttErrors.SUCCESS);
								}
							} else {
								callback(AttErrors.WRITE_REQUEST_REJECTED);
							}
						},
					},
					{
						// StreamDraw Enabled service
						uuid: uuids.PAWS_EXTRA.children.STREAM_ENABLED,
						properties: ["read"],
						onRead: (connection, callback) => {
							const buffer = Buffer.allocUnsafe(1);
							buffer.writeUInt8(
								driver.getMode() instanceof StreamDrawer ? 1 : 0
							);
							callback(AttErrors.SUCCESS, buffer);
						},
					},
					{
						// StreamDraw interface service
						uuid: uuids.PAWS_EXTRA.children.STREAM_INTERFACE,
						properties: ["write"],
						onWrite: async (
							connection,
							needsResponse,
							value: Buffer,
							callback
						) => {
							const mode = driver.getMode();
							if (mode instanceof StreamDrawer) {
								if (mode.bufferSize === value.length) {
									callback(AttErrors.INVALID_ATTRIBUTE_VALUE_LENGTH);
								} else {
									await mode.update(value);
									callback(AttErrors.SUCCESS);
								}
							} else {
								callback(AttErrors.WRITE_REQUEST_REJECTED);
							}
						},
					},
				],
			};
		},
};
