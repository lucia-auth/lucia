import { random, customRandom } from "nanoid";
import crypto from "crypto";
import { promisify } from "util";
import { HashFunctionProvider } from "../types.js";

export const generateRandomString = (length: number) => {
	const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
	return customRandom(characters, length, random)();
};

/* converts callback to async/await */
const scrypt = promisify(crypto.scrypt);

const hash = async (s: string) => {
	const salt = generateRandomString(16);
	const hash = (await scrypt(s, salt, 64)) as Buffer;
	return salt + ":" + hash.toString("hex");
};

const verify = async (s: string, hash: string) => {
	const [salt, key] = hash.split(":");
	const keyBuffer = Buffer.from(key, "hex");
	const derivedKey = (await scrypt(s, salt, 64)) as Buffer;
	/*
    comparison operation takes the same amount of time every time
    attackers can analyze the amount of time
    */
	return crypto.timingSafeEqual(keyBuffer, derivedKey);
};

export const scryptProvider:HashFunctionProvider = { hash, verify }
