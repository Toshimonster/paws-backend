import { Mock } from "./Mock.js";

/**
 * Represents an optional import
 * @param getInfo The function to execute the true import
 * @returns the import
 */
export async function optionalImport<T>(getInfo: () => Promise<T> | T) {
	let toRet: T;
	try {
		toRet = await getInfo();
	} catch (e) {
		console.warn(
			"Cannot import required optional feature; Attempting to continue with mock class"
		);
		const mock = new Mock<T>();
		toRet = mock.object();
	}
	return toRet;
}
