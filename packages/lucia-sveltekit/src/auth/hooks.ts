import type { Handle } from "../kit.js";
import type { Context } from "./index.js";
import chalk from "chalk";

import { handleRefreshRequest } from "./endpoints/refresh.js";
import { handleLogoutRequest } from "./endpoints/logout.js";

export const handleDevWarningsFunction = (context: Context) => {
    const handleWarnings = ({
        event,
    }: Parameters<Handle>[0]) : void => {
        if (!context.secret) {
            console.log(
                `${chalk.red.bold("[LUCIA_ERROR]")} ${chalk.red(
                    `Secret key is not defined in configuration ("config.secret").`
                )}`
            );
            process.exit(0);
        }
        if (!context.adapter) {
            console.log(
                `${chalk.red.bold("[LUCIA_ERROR]")} ${chalk.red(
                    `Adapter is not defined in configuration ("config.adapter").`
                )}`
            );
            process.exit(1);
        }
        if (context.secret.length < 32 && context.env === "DEV") {
            console.log(
                `${chalk.yellow.bold("[LUCIA_WARNING]")} ${chalk.yellow(
                    "Secret key should be longer than 32 chars."
                )}`
            );
        }
        if (context.secret.length < 32 && context.env === "PROD") {
            console.log(
                `${chalk.yellow.bold("[LUCIA_WARNING]")} ${chalk.yellow(
                    "Secret key must be longer than 32 chars."
                )}`
            );
            process.exit(1);
        }
        if (context.env === "PROD" && event.url.protocol === "http:") {
            console.log(
                `${chalk.yellow.bold("[LUCIA_WARNING]")} ${chalk.yellow(
                    `Current environment ("config.env") is set to "PROD" in configuration but the app is hosted on http. Cookies can only be saved in https when set to "PROD".`
                )}`
            );
        }
    };
    return handleWarnings;
};

export const handleAuthRequestsFunction = (context: Context) => {
    const handleAuthRequests: Handle = async ({ resolve, event }) => {
        if (
            event.url.pathname === "/api/auth/refresh" &&
            event.request.method === "POST"
        ) {
            return await handleRefreshRequest(event, context);
        }
        if (
            event.url.pathname === "/api/auth/logout" &&
            event.request.method === "POST"
        ) {
            return await handleLogoutRequest(event, context);
        }
        return await resolve(event);
    };
    return handleAuthRequests;
};
