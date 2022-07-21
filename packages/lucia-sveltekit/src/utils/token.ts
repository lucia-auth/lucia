import cookie from "cookie";
import jwt from "jsonwebtoken";
import { Context } from "../auth/index.js";
import { Env, LuciaSession, LuciaUser } from "../types.js";
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

export class AccessToken extends Token {
    constructor(value: string | null, context: Context) {
        super(value, context.secret, {
            name: "access_token",
            path: "/",
            max_age: 60 * 15,
            secure: context.env === "PROD",
        });
    }
    public user = async (fingerprint: string) => {
        try {
            const userSession = jwt.decode(this.value) as Partial<
                LuciaUser & LuciaSession
            >;
            await compare(fingerprint, userSession.fingerprint_hash || "");
            delete userSession.fingerprint_hash;
            delete userSession.exp, delete userSession.iat;
            const user = userSession as LuciaUser;
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
        return new EncryptedRefreshToken(
            this.encrypter.encrypt(this.value),
            this.context
        );
    };
    public validateFingerprint = async (fingerprint: string) => {
        try {
            const hashedFingerprint = this.value.split(":")[1];
            if (!hashedFingerprint)
                throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
            await compare(fingerprint, hashedFingerprint);
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
        return new RefreshToken(
            this.encrypter.decrypt(this.value),
            this.context
        );
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