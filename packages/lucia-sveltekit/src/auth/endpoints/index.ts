export class ErrorResponse extends Response {
    constructor(error: Error) {
        console.error(error);
        super(
            JSON.stringify({
                message: error.message,
            }),
            {
                status: 500,
            }
        );
    }
}

export { handleLogoutRequest } from "./logout.js";
export { handleRefreshRequest } from "./refresh.js";
