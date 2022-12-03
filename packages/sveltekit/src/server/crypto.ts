import { blake3 } from "@noble/hashes/blake3";

export const generateChecksum = (input: string) => {
	return convertUint8ArrayToHex(blake3(input));
};

const convertUint8ArrayToHex = (arr: Uint8Array) => {
	return [...arr].map((x) => x.toString(16).padStart(2, "0")).join("");
};
