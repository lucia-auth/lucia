import type { RequestEvent } from "../../kit.js";
import { createBlankCookies } from "../../utils/cookie.js";
import type { Context } from "../index.js";
import { ErrorResponse } from "./index.js";
import type { LuciaError } from "../../utils/error.js"
import clc from "cli-color";

export const handleLogoutRequest = async (
    event: RequestEvent,
    context: Context
) => {
    try {
        const [_, accessToken] = (event.request.clone().headers.get("Authorization") || "").split(" ")
        if (!accessToken) {
            console.log(`${clc.red.bold("[ERROR]")} ${clc.red("signOut() requires an access token as of v0.8.0")}`)
            throw new Error("Missing access token")
        }
        const session = await context.auth.validateRequest(event.request)
        await context.adapter.deleteRefreshToken(session.refresh_token.value);
        return new Response(null, {
            headers: {
                "set-cookie": createBlankCookies().join(","),
            },
        });
    } catch (e) {
        const error = e as LuciaError;
        return new ErrorResponse(error);
    }
};