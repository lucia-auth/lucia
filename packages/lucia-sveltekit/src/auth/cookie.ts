import { Cookies } from "../kit.js";
import { Context } from "./index.js";

export const deleteAllCookiesFunction = (context: Context) => {
    const deleteAllCookies = (cookies: Cookies) => {
        cookies.set("auth_session", "", {
            httpOnly: true,
            maxAge: 0,
            secure: context.env === "PROD",
            path: "/",
            sameSite: "lax",
        });
    };
    return deleteAllCookies;
};
