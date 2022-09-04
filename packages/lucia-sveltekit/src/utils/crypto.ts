import { random, customRandom } from "nanoid";
import crypto from "crypto";
import { promisify } from "util";

export const generateRandomString = (length: number) => {
    const characters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    return customRandom(characters, length, random)();
};

// converts callback to async/await
const scrypt = promisify(crypto.scrypt);

export const hash = async (s: string) => {
    const salt = generateRandomString(16);
    const derivedKey = (await scrypt(s, salt, 64)) as Buffer;
    return salt + ":" + derivedKey.toString("hex");
};

export const verify = async (s: string, sHash: string) => {
    const [salt, key] = sHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = (await scrypt(s, salt, 64)) as Buffer;
    // comparison operation takes the same amount of time every time
    // attackers can analyze the amount of time
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
};

export class Encrypter {
    constructor(encryptionKey: string) {
        this.algorithm = "aes-192-cbc";
        this.key = crypto.scryptSync(encryptionKey, "salt", 24);
    }
    private algorithm: string;
    private key: Buffer;
    encrypt(string: string) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        const encrypted = cipher.update(string, "utf8", "hex");
        return [
            encrypted + cipher.final("hex"),
            Buffer.from(iv).toString("hex"),
        ].join("|");
    }

    decrypt(encryptedString: string) {
        const [encrypted, iv] = encryptedString.split("|");
        if (!iv) throw new Error("IV not found");
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.key,
            Buffer.from(iv, "hex")
        );
        return (
            decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8")
        );
    }
}
