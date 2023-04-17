import { webcrypto } from "crypto";

if (!("crypto" in globalThis)) {
	globalThis.crypto = webcrypto as any;
}
