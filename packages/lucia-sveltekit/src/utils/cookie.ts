import type { Cookies } from "$lib/kit.js";
import cookie from "cookie";

export const setCookie = (targetCookies: Cookies, ...cookies: string[]) => {
    cookies.forEach((cookieString) => {
        const entries = cookieString
            .split(";")
            .map((pair) => pair.split("=") as [string, string | boolean])
            .map((pair) => [pair[0].replaceAll(" ", ""), pair[1]] as [string, string | boolean])
        const [[valueEntry], attributeEntries] = splitArrayAt(entries, 1);
        const cookieName = valueEntry[0];
        const cookieValue = valueEntry[1] as string;
        // If secure === false, the secure attribute won't be included in the cookie string
        const secureIndex = attributeEntries.findIndex(
            (val) => val[0] === "Secure"
        ); // returns -1 if none satisfies
        if (secureIndex > -1) {
            attributeEntries[secureIndex][1] = true;
        } else {
            attributeEntries.push(["Secure", false]);
        }
        const options = Object.fromEntries(
            attributeEntries.map((val) => [
                getOptionNameFromAttribute(val[0]),
                val[1] === undefined ? true : val[1], // ["httpOnly", ""] => ["httpOnly", true]
            ])
        );
        targetCookies.set(cookieName, cookieValue, options);
    });
};

export const deleteAllCookies = (targetCookies: Cookies) => {
    setCookie(targetCookies, ...createBlankCookies());
};

export const createBlankCookies = () => {
    return [
        cookie.serialize("access_token", "", {
            secure: false,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookie.serialize("refresh_token", "", {
            secure: false,
            path: "",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookie.serialize("encrypt_refresh_token", "", {
            secure: false,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookie.serialize("fingerprint_token", "", {
            secure: false,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookie.serialize("access_token", "", {
            secure: true,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookie.serialize("refresh_token", "", {
            secure: true,
            path: "",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookie.serialize("encrypt_refresh_token", "", {
            secure: true,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookie.serialize("fingerprint_token", "", {
            secure: true,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
    ];
};

// splits array into 2 arrays
// index represents the index of the first item of second array
// ([0, 1, 2, 3], 1) => [[0], [1, 2, 3]]
const splitArrayAt = <Arr extends any[]>(array: Arr, index: number) => {
    return [array.slice(0, index), array.slice(index)] as [Arr, Arr];
};

const dictionary: Record<string, any> = {
    "Max-Age": "maxAge",
    Secure: "secure",
    HttpOnly: "httpOnly",
    SameSite: "sameSite",
    Path: "path",
};

const getOptionNameFromAttribute = (option: string): string => {
    return dictionary[option];
};
