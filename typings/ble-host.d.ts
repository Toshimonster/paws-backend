declare module "ble-host" {
	let BleHost: BleHostParams;
	export default BleHost;

	import { EventEmitter } from "stream";

	interface BleHostParams {
		BleManager: {
			create(
				transport: Transport,
				options: BleManagerOptions,
				callback: (err: Error | null, manager?: BleManager) => void
			): void;
		};
		AdvertisingDataBuilder: Constructable<AdvertisingDataBuilder>;
		HciErrors: AttErrors;
		AttErrors: AttErrors;
	}

	interface Transport extends EventEmitter {
		write(buffer: Buffer): void;
		on(event: "data", listener: (data: Buffer) => void): this;
	}

	interface BleManagerOptions {
		staticRandomAddress?: string;
	}

	class BleManager {
		startScan(parameters: {
			activeScan?: boolean;
			scanWindow?: number;
			scanInterval?: number;
			filterDuplicates?: boolean;
			scanFilters?: any[];
		}): Scanner;

		gattDb: GattServerDb;

		setAdvertisingData(buffer: Buffer, callback?: () => void): void;
		startAdvertising(
			options?: {
				intervalMin?: number;
				intervalMax?: number;
				advertisingType?:
					| "ADV_IND"
					| "ADV_DIRECT_IND_HIGH_DUTY_CYCLE"
					| "ADV_SCAN_IND"
					| "ADV_NONCONN_IND"
					| "ADV_DIRECT_IND_LOW_DUTY_CYCLE";
				directedAddress?: {
					type?: "public" | "random";
					address?: string;
				};
				channelMap?: (37 | 38 | 39)[];
			},
			callback?: (status: 0, conn: Connection) => void
		): void;
	}

	class GattServerDb {
		setDeviceName(name: string): void;
		addServices(services: GattService): void;
	}

	interface GattService {}

	class Scanner {}

	class Connection extends EventEmitter {
		on(event: "disconnect", listener: () => void);
	}

	interface Constructable<T> {
		new (...args: any): T;
	}

	class AdvertisingDataBuilder {
		build(): Buffer;
		addFlags(
			flags: (
				| "leLimitedDiscoverableMode"
				| "leGeneralDiscoverableMode"
				| "brEdrNotSupported"
				| "simultaneousLeAndBdEdrToSameDeviceCapableController"
				| "simultaneousLeAndBrEdrToSameDeviceCapableHost"
			)[]
		): AdvertisingDataBuilder;
		addLocalName(isComplete: boolean, name: string): AdvertisingDataBuilder;
		add128BitServiceUUIDs(
			isComplete: boolean,
			uuids: string[]
		): AdvertisingDataBuilder;
		add16BitServiceUUIDs(
			isComplete: boolean,
			uuids: (string | number)[]
		): AdvertisingDataBuilder;
	}

	interface AttErrors {
		INVALID_HANDLE: 0x01;
		READ_NOT_PERMITTED: 0x02;
		WRITE_NOT_PERMITTED: 0x03;
		INVALID_PDU: 0x04;
		INSUFFICIENT_AUTHENTICATION: 0x05;
		REQUEST_NOT_SUPPORTED: 0x06;
		INVALID_OFFSET: 0x07;
		INSUFFICIENT_AUTHORIZATION: 0x08;
		PREPARE_QUEUE_FULL: 0x09;
		ATTRIBUTE_NOT_FOUND: 0x0a;
		ATTRIBUTE_NOT_LONG: 0x0b;
		INSUFFICIENT_ENCRYPTION_KEY_SIZE: 0x0c;
		INVALID_ATTRIBUTE_VALUE_LENGTH: 0x0d;
		UNLIKELY_ERROR: 0x0e;
		INSUFFICIENT_ENCRYPTION: 0x0f;
		UNSUPPORTED_GROUP_TYPE: 0x10;
		INSUFFICIENT_RESOURCES: 0x11;

		WRITE_REQUEST_REJECTED: 0xfc;
		CLIENT_CHARACTERISTIC_CONFIGURATION_DESCRIPTOR_IMPROPERLY_CONFIGURED: 0xfd;
		PROCEDURE_ALREADY_IN_PROGRESS: 0xfe;
		OUT_OF_RANGE: 0xff;

		SUCCESS: 0;
		RELIABLE_WRITE_RESPONSE_NOT_MATCHING: -1;
	}
}
