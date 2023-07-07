import Driver from "../../../Driver.js";
import BleHost, { GattServerService } from "ble-host";
import { PixelDrawer } from "../../Modes/PixelDrawer.js";
import { StreamDrawer } from "../../Modes/StreamDrawer.js";
import { GattUuidDef } from "./GattServer.js";

const { AttErrors } = BleHost;
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
