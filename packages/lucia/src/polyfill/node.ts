import { webcrypto } from "crypto";

const isObject = (
	maybeObject: unknown
): maybeObject is Record<string, unknown> => {
	return (
		maybeObject !== null &&
		typeof maybeObject === "object" &&
		!Array.isArray(maybeObject)
	);
};

const _global = globalThis as {
	crypto?: unknown;
};

const polyfillCrypto = () => {
	if (!("crypto" in _global)) {
		_global.crypto = webcrypto as any;
		return;
	}
	if (!isObject(_global.crypto)) {
		_global.crypto = webcrypto as any;
		return;
	}
	if (Object.isFrozen(_global.crypto)) {
		_global.crypto = webcrypto as any;
		return;
	}
	const getRandomValuesDefined =
		"getRandomValues" in _global.crypto &&
		_global.crypto.getRandomValues !== undefined;
	const randomUUIDDefined =
		"randomUUID" in _global.crypto && _global.crypto.randomUUID !== undefined;
	const subtleDefined =
		"subtle" in _global.crypto && _global.crypto.subtle !== undefined;
	if (!getRandomValuesDefined) {
		_global.crypto.getRandomValues = webcrypto.getRandomValues as any;
	}
	if (!randomUUIDDefined) {
		_global.crypto.randomUUID = webcrypto.randomUUID as any;
	}
	if (!subtleDefined) {
		_global.crypto.subtle = webcrypto.subtle as any;
	}
};

polyfillCrypto();
