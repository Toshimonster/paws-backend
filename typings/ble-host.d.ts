declare module "ble-host" {
	let BleHost: BleHostParams;
	export default BleHost;

	import { EventEmitter } from "stream";

	interface BleHostParams {
		BleManager: {
			create(
				transport: Transport,
				options: BleManagerOptions,
				callback: (err: Error | null, manager: BleManager) => void
			): void;
		};
		AdvertisingDataBuilder: new () => AdvertisingDataBuilder;
		HciErrors: AttErrors;
		AttErrors: AttErrors;
	}

	export interface Transport extends EventEmitter {
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
			scanFilters?: never[];
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
		addServices(services: GattServerService[]): void;
	}

	export interface GattServerService {
		uuid: string | number;
		isSecondaryService?: boolean;
		includedServices?: GattServerService[];
		startHandle?: number;
		endHandle?: number;
		characteristics?: GattServerCharacteristic[];
	}

	export interface GattServerDescriptor {
		uuid: string | number;
		properties?: (
			| "broadcast"
			| "read"
			| "write-without-response"
			| "write"
			| "notify"
			| "indicate"
			| "authenticated-signed-writes"
			| "reliable-write"
			| "writable-auxiliaries"
		)[];
		maxLength?: number;
		readPerm?:
			| "not-permitted"
			| "open"
			| "encrypted"
			| "encrypted-mitm"
			| "encrypted-mitm-sc"
			| "custom";
		writePerm?:
			| "not-permitted"
			| "open"
			| "encrypted"
			| "encrypted-mitm"
			| "encrypted-mitm-sc"
			| "custom";
		value?: Buffer | string;
		onAuthorizeRead?: (
			connection: Connection,
			callback: (
				err:
					| AttErrors["SUCCESS"]
					| AttErrors["READ_NOT_PERMITTED"]
					| AttErrors["INSUFFICIENT_ENCRYPTION"]
					| AttErrors["INSUFFICIENT_ENCRYPTION_KEY_SIZE"]
					| AttErrors["INSUFFICIENT_AUTHENTICATION"]
					| AttErrors["INSUFFICIENT_AUTHORIZATION"]
					| ApplicationErrors
			) => void
		) => void;
		onRead?: (
			connection: Connection,
			callback: (
				err:
					| AttErrors["SUCCESS"]
					| AttErrors["UNLIKELY_ERROR"]
					| AttErrors["INSUFFICIENT_RESOURCES"]
					| AttErrors["PROCEDURE_ALREADY_IN_PROGRESS"]
					| ApplicationErrors,
				value: Buffer | string | undefined
			) => void
		) => void;
		onPartialRead?: (
			connection: Connection,
			offset: number,
			callback: (
				err:
					| AttErrors["SUCCESS"]
					| AttErrors["INVALID_OFFSET"]
					| AttErrors["ATTRIBUTE_NOT_LONG"]
					| AttErrors["UNLIKELY_ERROR"]
					| AttErrors["INSUFFICIENT_RESOURCES"]
					| AttErrors["PROCEDURE_ALREADY_IN_PROGRESS"]
					| ApplicationErrors,
				value: Buffer | string | undefined
			) => void
		) => void;
		onAuthorizeWrite?: (
			connection: Connection,
			callback: (
				err:
					| AttErrors["SUCCESS"]
					| AttErrors["WRITE_NOT_PERMITTED"]
					| AttErrors["INSUFFICIENT_ENCRYPTION"]
					| AttErrors["INSUFFICIENT_ENCRYPTION_KEY_SIZE"]
					| AttErrors["INSUFFICIENT_AUTHENTICATION"]
					| AttErrors["INSUFFICIENT_AUTHORIZATION"]
					| ApplicationErrors
			) => void
		) => void;
		onWrite?: (
			connection: Connection,
			needsResponse: boolean,
			value: Buffer,
			callback: (
				err:
					| AttErrors["SUCCESS"]
					| AttErrors["INVALID_OFFSET"]
					| AttErrors["INVALID_ATTRIBUTE_VALUE_LENGTH"]
					| AttErrors["UNLIKELY_ERROR"]
					| AttErrors["INSUFFICIENT_RESOURCES"]
					| AttErrors["PROCEDURE_ALREADY_IN_PROGRESS"]
					| AttErrors["OUT_OF_RANGE"]
					| AttErrors["WRITE_REQUEST_REJECTED"]
					| ApplicationErrors
			) => void
		) => void;
		onPartialWrite?: (
			connection: Connection,
			needsResponse: boolean,
			offset: number,
			value: Buffer,
			callback: (
				err:
					| AttErrors["SUCCESS"]
					| AttErrors["INVALID_OFFSET"]
					| AttErrors["INVALID_ATTRIBUTE_VALUE_LENGTH"]
					| AttErrors["UNLIKELY_ERROR"]
					| AttErrors["INSUFFICIENT_RESOURCES"]
					| AttErrors["PROCEDURE_ALREADY_IN_PROGRESS"]
					| AttErrors["OUT_OF_RANGE"]
					| AttErrors["WRITE_REQUEST_REJECTED"]
					| ApplicationErrors
			) => void
		) => void;
	}

	interface GattServerCharacteristic extends GattServerDescriptor {
		descriptors?: GattServerDescriptor[];
		onSubscriptionChange?: (
			connection: Connection,
			notification: boolean,
			indication: boolean,
			isWrite: boolean
		) => void;
		notify?: (
			connection: Connection,
			value: Buffer | string,
			sentCallback: () => void | undefined,
			completeCallback: () => void | undefined
		) => boolean;
		notifyAll?: (value: Buffer | string) => void;
		indicate?: (
			connection: Connection,
			value: Buffer | string,
			sentCallback: () => void | undefined
		) => boolean;
		indicateAll?: (value: Buffer | string) => void;
	}

	type Enumerate<
		N extends number,
		Acc extends number[] = []
	> = Acc["length"] extends N
		? Acc[number]
		: Enumerate<N, [...Acc, Acc["length"]]>;

	type IntRange<F extends number, T extends number> = Exclude<
		Enumerate<T>,
		Enumerate<F>
	>;

	type ApplicationErrors = IntRange<0x80, 0x9f>;

	class Scanner {}

	class Connection extends EventEmitter {
		on(event: "disconnect", listener: () => void): this;
		peerAddress: string;
	}

	class AdvertisingDataBuilder {
		constructor();
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
		INVALID_HANDLE: AttError<0x01>;
		READ_NOT_PERMITTED: AttError<0x02>;
		WRITE_NOT_PERMITTED: AttError<0x03>;
		INVALID_PDU: AttError<0x04>;
		INSUFFICIENT_AUTHENTICATION: AttError<0x05>;
		REQUEST_NOT_SUPPORTED: AttError<0x06>;
		INVALID_OFFSET: AttError<0x07>;
		INSUFFICIENT_AUTHORIZATION: AttError<0x08>;
		PREPARE_QUEUE_FULL: AttError<0x09>;
		ATTRIBUTE_NOT_FOUND: AttError<0x0a>;
		ATTRIBUTE_NOT_LONG: AttError<0x0b>;
		INSUFFICIENT_ENCRYPTION_KEY_SIZE: AttError<0x0c>;
		INVALID_ATTRIBUTE_VALUE_LENGTH: AttError<0x0d>;
		UNLIKELY_ERROR: AttError<0x0e>;
		INSUFFICIENT_ENCRYPTION: AttError<0x0f>;
		UNSUPPORTED_GROUP_TYPE: AttError<0x10>;
		INSUFFICIENT_RESOURCES: AttError<0x11>;

		WRITE_REQUEST_REJECTED: AttError<0xfc>;
		CLIENT_CHARACTERISTIC_CONFIGURATION_DESCRIPTOR_IMPROPERLY_CONFIGURED: AttError<0xfd>;
		PROCEDURE_ALREADY_IN_PROGRESS: AttError<0xfe>;
		OUT_OF_RANGE: AttError<0xff>;

		SUCCESS: AttError<0>;
		RELIABLE_WRITE_RESPONSE_NOT_MATCHING: AttError<-1>;
	}

	type AttError<T> = T;
}
