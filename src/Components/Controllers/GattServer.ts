import { PixelDrawer } from "../Modes/PixelDrawer.js";
import { StateHandler } from "../Modes/States/StateHandler.js";
import { BaseController } from "./BaseController.js";
import HciSocket from 'hci-socket';
import BleHost from 'ble-host';
import Driver from "../../Driver.js";
const { BleManager, AdvertisingDataBuilder, HciErrors, AttErrors } = BleHost;

type uuid = string;
type uuidDef = {
    PAWS?: {
        uuid?: uuid,
        children?: {
            STATES?: uuid,
			STATE?: uuid,
			TIMESTAMP?: uuid,
            UPTIME?: uuid,
            CPU_TEMP?: uuid,
            CPU_LOAD?: uuid,
            NETWORK?: uuid
        }
    },
    PAWS_EXTRA?: {
        uuid?: uuid,
        children?: {
            PIXELDRAW_ENABLED?: uuid,
            PIXELDRAW_INTERFACE?: uuid
        }
    }
};

interface GattServerOptions {
	StateHandler?: StateHandler;
	PixelDrawer?: PixelDrawer;
	name?: string;
	uuids?: uuidDef;
}

export class GattServer extends BaseController {
	private readonly options: GattServerOptions = {
		name: "1",
		uuids: {
			PAWS: {
				uuid: "04f9d599-ce17-4397-a65d-cf769397551a",
				children: {
					STATES: '0694bc1c-0064-4bd7-9840-41fa65d7355e',
					STATE: '81a6a500-b85e-4951-b6ac-b63c8f97f678',
					TIMESTAMP: 'fa7abfe6-af90-42bf-a154-c2bdb7eb336a',
					UPTIME: '97dcaa87-eaa8-4546-bb33-ad001fc3daf4',
					CPU_TEMP: '31b0159a-d4bd-4396-9e77-7ebb24db6df3',
					CPU_LOAD: '26414bca-7991-46e5-a559-376c7d515a1f',
					NETWORK: '4bb22157-34d4-481c-949f-18aaa00f45e4'
				}
			},
            PAWS_EXTRA: {
                uuid: "bacc1dbc-f1f3-42f2-b572-bd3e16923f28",
                children: {
                    PIXELDRAW_ENABLED: "ea003779-e651-49e8-91ab-05b65e66b95f",
                    PIXELDRAW_INTERFACE: "ea003779-e651-49e8-91ab-05b65e66b95f"
                }
            }
			
		}
	};
	private transport?: HciSocket;


	constructor(name?: string, options: GattServerOptions = {}) {
		super(name);
		this.options = { ...this.options, ...options };
	}

	start(driver: Driver) {

        try {
            this.transport = new HciSocket()
        } catch (error) {
            if (error.code === "EPERM") {
                console.error("Gatt Server Controller requires root access. Please run with sudo.")
            } else if (error.code === "EBUSY") {
                console.error("Gatt Server Controller cannot find a free bluetooth device. Please check settings.")
            } else if (error.code === "ENODEV") {
                console.error("Gatt Server Controller cannot find any bluetooth devices.")
            } else {
                throw error;
            }
            process.exit(1)
        }
		this.transport = new HciSocket()

        BleManager.create(this.transport, {}, (err, manager) => {
            // err is either null or an Error object
            // if err is null, manager contains a fully initialized BleManager object
            if (err) {
                console.error(err);
                return;
            }
            
            manager.gattDb.setDeviceName(this.name);
            manager.gattDb.addServices([
                { //P.A.W.S Service
                    uuid: this.options.uuids.PAWS.uuid,
                    characteristics: []
                },
                {
                    /*
                    PAWS Additional service; pixel drawing
                     */
                    uuid: this.options.uuids.PAWS_EXTRA.uuid,
                    isSecondaryService: true,
                    characteristics: [
                        {
                            // PixelDraw Enabled service
                            uuid: this.options.uuids.PAWS_EXTRA.children.PIXELDRAW_ENABLED,
                            properties: ['read'],
                            onRead: (connection, callback) => {
                                let buffer = Buffer.allocUnsafe(1)
                                buffer.writeUInt8(driver.getMode().name === "PIXELDRAW" ? 1 : 0)
                                callback(AttErrors.SUCCESS, buffer)
                            }
                        },
                        {
                            // PixelDraw interface service
                            uuid: this.options.uuids.PAWS_EXTRA.children.PIXELDRAW_INTERFACE,
                            properties: ['write'],
                            onWrite: (connection, needsResponse, value, callback) => {
                                //this.driver.setState("!!PIXELDRAW!!")
                                callback(AttErrors.SUCCESS)
                            },
                            onRead: (connection, callback) => {
                                let buffer = Buffer.allocUnsafe(1)
                                //buffer.writeUInt8(this.driver.state === "!!PIXELDRAW!!" ? 1 : 0)
                                callback(AttErrors.SUCCESS, buffer)
                            }
                        },
                    ],

                }
            ]);
            
            const advDataBuffer = new AdvertisingDataBuilder()
                                    .addFlags(['leGeneralDiscoverableMode', 'brEdrNotSupported'])
                                    .addLocalName(/*isComplete*/ true, this.name)
                                    .add128BitServiceUUIDs(/*isComplete*/ true, ['04f9d599-ce17-4397-a65d-cf769397551a'])
                                    .build();
            manager.setAdvertisingData(advDataBuffer);
            // call manager.setScanResponseData(...) if scan response data is desired too
            let startAdv = () => {
                manager.startAdvertising({/*options*/}, (status, conn) => {
                    if (status != HciErrors.SUCCESS) {
                        // Advertising could not be started for some controller-specific reason, try again after 10 seconds
                        setTimeout(startAdv, 10000);
                        return;
                    }
                    conn.on('disconnect', startAdv); // restart advertising after disconnect
                });
            }
            startAdv();
        });
	}
}
