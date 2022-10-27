import { random, customRandom } from "nanoid";
import crypto from "crypto";
import { promisify } from "util";

export const generateRandomString = (length: number) => {
	const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
	return customRandom(characters, length, random)();
};

/* converts callback to async/await */
const scrypt = promisify(crypto.scrypt);

export const hashScrypt = async (s: string) => {
	const salt = generateRandomString(16);
	const hash = (await scrypt(s, salt, 64)) as Buffer;
	return salt + ":" + hash.toString("hex");
};

export const verifyScrypt = async (s: string, hash: string) => {
	const [salt, key] = hash.split(":");
	const keyBuffer = Buffer.from(key, "hex");
	const derivedKey = (await scrypt(s, salt, 64)) as Buffer;
	/*
    comparison operation takes the same amount of time every time
    attackers can analyze the amount of time
    */
	return crypto.timingSafeEqual(keyBuffer, derivedKey);
};
