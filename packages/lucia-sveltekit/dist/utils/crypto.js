import { random, customRandom } from "nanoid";
import bcrypt from "bcryptjs";
export const generateRandomString = (length) => {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    return customRandom(characters, length, random)();
};
export const hash = async (s) => {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(s, salt);
};
export const compare = async (s, s_hash) => {
    const isValid = await bcrypt.compare(s, s_hash);
    if (!isValid)
        throw Error("Input strings does not match");
};
export const safeCompare = async (s, s_hash) => {
    return await bcrypt.compare(s, s_hash);
};
