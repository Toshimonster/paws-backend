import HciSocket from 'hci-socket';
import NodeBleHost from 'ble-host';
import {uptime} from 'os'
import EventEmitter from 'events';
import Driver from '../Driver';
import {cpuTemperature, currentLoad, networkInterfaces } from "systeminformation";

const BleManager = NodeBleHost.BleManager;
const AdvertisingDataBuilder = NodeBleHost.AdvertisingDataBuilder;
const HciErrors = NodeBleHost.HciErrors;
const AttErrors = NodeBleHost.AttErrors;

export class GattServer extends EventEmitter {
    public readonly Name: string
    protected options: {verbose: boolean} = {verbose: true}
    protected transport: HciSocket = new HciSocket()
    protected driver: Driver

    protected verbose(str) {
        if (this.options.verbose) console.log(`[GATT SERVER] ${str}`)          
    }

    constructor(driver:Driver, name?:string) {
        super()
        this.driver = driver
        this.Name = `PAWS-${name}`
        this.start()
    }

    start() {
        this.verbose("Starting...")

        BleManager.create(this.transport, {}, (err, manager) => {
            // err is either null or an Error object
            // if err is null, manager contains a fully initialized BleManager object
            if (err) {
                console.error(err);
                return;
            }
            
            manager.gattDb.setDeviceName(this.Name);
            manager.gattDb.addServices([
                { //P.A.W.S Service
                    uuid: '04f9d599-ce17-4397-a65d-cf769397551a',
                    characteristics: [
                        { // PAWS state list
                            uuid: '0694bc1c-0064-4bd7-9840-41fa65d7355e',
                            properties: ['read'],
                            onRead: (connection, callback) => {
                                this.verbose("BLE PAWS State Read")
                                callback(AttErrors.SUCCESS, this.driver.states.join(", "))
                            }
                        },
                        { // PAWS Raw State Read and Write
                            uuid: '81a6a500-b85e-4951-b6ac-b63c8f97f678',
                            properties: ['read', 'write'],
                            onRead: (connection, callback) => {
                                this.verbose("BLE PAWS State Read")
                                callback(AttErrors.SUCCESS, this.driver.state)
                            },
                            onWrite: (connection, needsResponse, value, callback) => {
                                this.verbose(`BLE PAWS State write '${value.toString()}'`)
                                let stateChange = value.toString().replace(/\0/g, '')
                                if (this.driver.hasState(stateChange)) {
                                    this.verbose(`BLE PAWS STATE CHANGE TO ${stateChange}`)
                                    this.driver.setState(stateChange)
                                    callback(AttErrors.SUCCESS)
                                } else {
                                    this.verbose(`BLE PAWS STATE OUT OF RANGE ${stateChange}`)
                                    callback(AttErrors.OUT_OF_RANGE)
                                }
                            }
                        },
                        { // Current Timestamp as String
                            uuid: 'fa7abfe6-af90-42bf-a154-c2bdb7eb336a',
                            properties: ['read'],
                            onRead: (connection, callback) => {
                                this.verbose("BLE Timestamp Read")
                                callback(AttErrors.SUCCESS, new Date().toString())
                            }
                        },
                        { // Current Uptime as FloatLE
                            uuid: '97dcaa87-eaa8-4546-bb33-ad001fc3daf4',
                            properties: ['read'],
                            onRead: (connection, callback) => {
                                this.verbose("BLE Uptime Read")
                                let buffer = Buffer.allocUnsafe(4);
                                buffer.writeFloatLE(uptime())
                                callback(AttErrors.SUCCESS, buffer);
                            }
                        },
                        { // CPU temp
                            uuid: '31b0159a-d4bd-4396-9e77-7ebb24db6df3',
                            properties: ['read'],
                            onRead: (connection, callback) => {
                                cpuTemperature()
                                    .then(data => {
                                        let buffer = Buffer.allocUnsafe(4)
                                        buffer.writeFloatLE(data.max)
                                        callback(AttErrors.SUCCESS, buffer)
                                    })
                                    .catch(() => {
                                        callback(AttErrors.UNLIKELY_ERROR)
                                    })
                            }
                        },
                        { // CPU load
                            uuid: '26414bca-7991-46e5-a559-376c7d515a1f',
                            properties: ['read'],
                            onRead: (connection, callback) => {
                                this.verbose("CPU LOAD")
                                currentLoad()
                                    .then(data => {
                                        let buffer = Buffer.allocUnsafe(4)
                                        buffer.writeFloatLE(data.avgLoad)
                                        callback(AttErrors.SUCCESS, buffer)
                                    })
                                    .catch(() => {
                                        callback(AttErrors.UNLIKELY_ERROR)
                                    })
                            }
                        },
                        { // Network Addresses
                            uuid: '4bb22157-34d4-481c-949f-18aaa00f45e4',
                            properties: ['read'],
                            onRead: (connection, callback) => {
                                networkInterfaces()
                                    .then(data => {
                                        let interfaces = (data instanceof Array) ? data : [data]
                                        let value = interfaces.map((value) => {
                                            return `${value.ifaceName}:${value.ip4}` 
                                        }).join(",")
                                        callback(AttErrors.SUCCESS, value)
                                    })
                                    .catch(err => {
                                        console.error(err)
                                        callback(AttErrors.UNLIKELY_ERROR)
                                    })
                            }
                        },
                    ]
                }
            ]);
            
            const advDataBuffer = new AdvertisingDataBuilder()
                                    .addFlags(['leGeneralDiscoverableMode', 'brEdrNotSupported'])
                                    .addLocalName(/*isComplete*/ true, this.Name)
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
                    this.verbose('Connection established - ' + conn.peerAddress);
                });
            }
            startAdv();
        });
    }
}

