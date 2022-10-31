import crypto from "crypto";

export const generateChecksum = (input: string) => {
	return crypto.createHash("md5").update(input).digest("hex");
};