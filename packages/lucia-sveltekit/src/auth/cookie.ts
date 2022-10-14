import { Cookies } from "../kit.js";
import { createBlankCookies, setCookie } from "../utils/cookie.js";
import { Context } from "./index.js";

export const deleteAllCookiesFunction = (context:Context) => {
    const deleteAllCookies = (targetCookies: Cookies) => {
        setCookie(targetCookies, ...createBlankCookies(context.env === "PROD"));
    }
    return deleteAllCookies
}