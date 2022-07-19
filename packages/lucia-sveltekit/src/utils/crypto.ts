import { random, customRandom } from "nanoid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { LuciaSession, LuciaUser } from "../types.js";
import { LuciaError } from "./error.js";

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

export class LuciaAccessToken {
    constructor(token: string) {
        this.token = token;
    }
    public token: string;
    public verify = async (fingerprint: string, secret: string) => {
        try {
            const userSession = jwt.verify(this.token, secret) as Partial<
                LuciaUser & LuciaSession
            >;
            await compare(fingerprint, userSession.fingerprint_hash || "");
        } catch {
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        }
    };
    get user() {
        try {
            const userSession = jwt.decode(this.token) as Partial<
                LuciaUser & LuciaSession
            >;
            delete userSession.fingerprint_hash;
            delete userSession.exp, delete userSession.iat;
            const user = userSession as LuciaUser;
            return user;
        } catch {
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        }
    }
}
