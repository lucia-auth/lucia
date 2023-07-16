// code copied from Nanoid:
// https://github.com/ai/nanoid/blob/9b748729f8ad5409503b508b65958636e55bd87a/index.browser.js
// nanoid uses Node dependencies on default bundler settings

const getRandomValues = (bytes: number): Uint8Array => {
	return crypto.getRandomValues(new Uint8Array(bytes));
};

const DEFAULT_ALPHABET =
	"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

export const generateRandomString = (
	size: number,
	alphabet = DEFAULT_ALPHABET
): string => {
	const mask = (2 << (Math.log(alphabet.length - 1) / Math.LN2)) - 1;
	const step = -~((1.6 * mask * size) / alphabet.length);

	let bytes = getRandomValues(step);
	let id = "";
	let index = 0;

	while (id.length !== size) {
		id += alphabet[bytes[index] & mask] ?? "";
		index += 1;
		if (index > bytes.length) {
			bytes = getRandomValues(step);
			index = 0;
		}
	}
	return id;
};
