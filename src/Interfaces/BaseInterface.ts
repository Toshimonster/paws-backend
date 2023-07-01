export abstract class BaseInterface {
    name: string;

    protected constructor(name) {
        this.name = name
    }

    abstract setBuffer(buffer: Buffer): Promise<void> | void
}