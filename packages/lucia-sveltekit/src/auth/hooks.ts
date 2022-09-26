import type { Handle, RequestEvent } from "../kit.js";
import type { Context } from "./index.js";
import clc from "cli-color";

import { handleRefreshRequest } from "./endpoints/refresh.js";
import { handleLogoutRequest } from "./endpoints/logout.js";

const handleWarnings = (event: RequestEvent, context: Context): void => {
    if (!context.secret) {
        console.log(
            `${clc.red.bold("[LUCIA_ERROR]")} ${clc.red(
                `Secret key is not defined in configuration ("config.secret").`
            )}`
        );
        process.exit(0);
    }
    if (!context.adapter) {
        console.log(
            `${clc.red.bold("[LUCIA_ERROR]")} ${clc.red(
                `Adapter is not defined in configuration ("config.adapter").`
            )}`
        );
        process.exit(1);
    }
    if (context.secret.length < 32 && context.env === "DEV") {
        console.log(
            `${clc.yellow.bold("[LUCIA_WARNING]")} ${clc.yellow(
                "Secret key should be longer than 32 chars."
            )}`
        );
    }
    if (context.secret.length < 32 && context.env === "PROD") {
        console.log(
            `${clc.red.bold("[LUCIA_ERROR]")} ${clc.red(
                "Secret key must be longer than 32 chars."
            )}`
        );
        process.exit(1);
    }
    if (context.env === "PROD" && event.url.protocol === "http:") {
        console.log(
            `${clc.yellow.bold("[LUCIA_WARNING]")} ${clc.yellow(
                `Current environment ("config.env") is set to "PROD" in configuration but the app is hosted on http. Cookies can only be saved in https when set to "PROD".`
            )}`
        );
    }
};

const getRequestHandler = (event: RequestEvent) => {
    if (
        event.url.pathname === "/api/auth/refresh" &&
        event.request.method === "POST"
    ) {
        return handleRefreshRequest;
    }
    if (
        event.url.pathname === "/api/auth/logout" &&
        event.request.method === "POST"
    ) {
        return handleLogoutRequest;
    }
    return null;
};

export const handleHooksFunction = (context: Context) => {
    const handleHooks = () => {
        return async ({ event, resolve }: Parameters<Handle>[0]) => {
            handleWarnings(event, context);
            const requestHandler = getRequestHandler(event);
            if (requestHandler) return await requestHandler(event, context);
            return await resolve(event, {
                transformPageChunk: ({ html }) => {
                    // finds hydrate.data value from parameter of start()
                    const pageDataFunctionRegex = new RegExp(
                        /(<script type="module" data-sveltekit-hydrate=".*?">)[\s\S]*start\(\s*\{[\s\S]*?hydrate:[\s\S]*?data:\s*\(\s*(function\([\s\S]*?\)\s*{[\s\S]*?return[\s\S]*)\),\s*form:[\s\S]*?\}\);\s*<\/script>/gm
                    );
                    const matches = pageDataFunctionRegex.exec(html);
                    if (!matches) return html;
                    html = html.replace(
                        matches[1],
                        `${matches[1]}
                    window._lucia_page_data = ${matches[2]};
                    `
                    );
                    return html;
                },
            });
        };
    };
    return handleHooks;
};
