export const pbkdf2 = async (
	password: Uint8Array,
	salt: Uint8Array,
	options: {
		c: number;
		dkLen: number;
	}
): Promise<Uint8Array> => {
	const pwKey = await crypto.subtle.importKey(
		"raw",
		password,
		"PBKDF2",
		false,
		["deriveBits"]
	);
	const keyBuffer = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			salt,
			iterations: options.c
		},
		pwKey,
		options.dkLen * 8
	);
	return new Uint8Array(keyBuffer);
};
