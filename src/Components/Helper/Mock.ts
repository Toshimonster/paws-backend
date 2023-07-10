export class Mock<T> {
	private _object: T = <T>{};

	public static of<T>(type: { new (): T }) {
		return new Mock<T>(new type());
	}

	constructor(
		object: Partial<{ [key in Extract<keyof T, string>]: T[key] }> | T = <T>{}
	) {
		this._object = object as T;
	}

	public object() {
		return <T>this._object;
	}
}
