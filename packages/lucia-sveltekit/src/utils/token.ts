import cookie from "cookie";
import jwt from "jsonwebtoken";
import type { Context } from "../auth/index.js";
import type { Env, TokenData, User } from "../types.js";
import { compare, Encrypter } from "./crypto.js";
import { LuciaError } from "./error.js";

class Token {
    public value: string;
    private secret: string;
    public createCookie: () => string;
    constructor(
        value: string | null,
        secret: string,
        cookieOptions: {
            name: string;
            path: string;
            max_age: number;
            secure: boolean;
        }
    ) {
        this.value = value || "";
        this.secret = secret;
        this.createCookie = () => {
            return cookie.serialize(cookieOptions.name, this.value, {
                secure: cookieOptions.secure,
                path: cookieOptions.path,
                maxAge: cookieOptions.max_age,
                httpOnly: true,
                sameSite: "lax",
            });
        };
    }
}

export class AccessToken<UserData extends {}> extends Token {
    constructor(value: string | null, context: Context) {
        super(value, context.secret, {
            name: "access_token",
            path: "/",
            max_age: 60 * 15,
            secure: context.env === "PROD",
        });
    }
    public user = async (fingerprintToken: string) => {
        try {
            const userSession = jwt.decode(this.value) as Partial<
                User<UserData> & TokenData
            >;
            await compare(fingerprintToken, userSession.fingerprint_hash || "");
            if (userSession.role !== "access_token") throw new Error();
            delete userSession.fingerprint_hash;
            delete userSession.exp, delete userSession.iat;
            delete userSession.role;
            const user = userSession as User<UserData>;
            return user;
        } catch {
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        }
    };
}

export class FingerprintToken extends Token {
    constructor(value: string | null, context: Context) {
        super(value, context.secret, {
            name: "fingerprint_token",
            path: "/",
            max_age: 60 * 60 * 24 * 365, // 1 year
            secure: context.env === "PROD",
        });
    }
}

export class RefreshToken extends Token {
    constructor(value: string | null, context: Context) {
        super(value, context.secret, {
            name: "refresh_token",
            path: "",
            max_age: 0,
            secure: context.env === "PROD",
        });
        this.context = context;
        this.encrypter = new Encrypter(this.context.secret);
    }
    private context: Context;
    private encrypter: Encrypter;
    public encrypt = () => {
        try {
            const encryptedValue = this.encrypter.encrypt(this.value);
            return new EncryptedRefreshToken(encryptedValue, this.context);
        } catch {
            return new EncryptedRefreshToken("", this.context);
        }
    };
    public userId = async (fingerprint: string) => {
        try {
            const userSession = jwt.decode(this.value) as {
                fingerprint_hash: string;
                user_id: string;
                role: string;
            };
            await compare(fingerprint, userSession.fingerprint_hash || "");
            if (userSession.role !== "refresh_token") throw new Error();
            return userSession.user_id;
        } catch (e) {
            throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
        }
    };
}

export class EncryptedRefreshToken extends Token {
    constructor(value: string | null, context: Context) {
        super(value, context.secret, {
            name: "encrypt_refresh_token",
            path: "/",
            max_age: 60 * 60 * 24 * 365, // 1 year
            secure: context.env === "PROD",
        });
        this.context = context;
        this.encrypter = new Encrypter(this.context.secret);
    }
    private context: Context;
    private encrypter: Encrypter;
    public decrypt = () => {
        try {
            const decryptedValue = this.encrypter.decrypt(this.value);
            return new RefreshToken(decryptedValue, this.context);
        } catch {
            return new RefreshToken("", this.context);
        }
    };
}

export const createBlankCookies = (env: Env) => {
    const prod = env === "PROD";
    return [
        cookie.serialize("access_token", "", {
            secure: prod,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookie.serialize("refresh_token", "", {
            secure: prod,
            path: "",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookie.serialize("encrypt_refresh_token", "", {
            secure: prod,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookie.serialize("fingerprint_token", "", {
            secure: prod,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
    ];
};
