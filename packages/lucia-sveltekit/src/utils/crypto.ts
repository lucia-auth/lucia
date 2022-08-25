import { random, customRandom } from "nanoid";
import bcrypt from "bcryptjs";
import crypto from "node:crypto"

export const generateRandomString = (length: number) => {
    const characters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    return customRandom(characters, length, random)();
};

export const hash = async (s: string) => {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(s, salt);
};

export const compare = async (s: string, s_hash: string) => {
    const isValid = await bcrypt.compare(s, s_hash);
    if (!isValid) throw Error("Input strings does not match");
};

export const safeCompare = async (s: string, s_hash: string) => {
    return await bcrypt.compare(s, s_hash);
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
