export class ErrorResponse extends Response {
    constructor(error) {
        console.error(error);
        super(JSON.stringify({
            message: error.message
        }), {
            status: 500
        });
    }
}
export { handleLogoutRequest } from "./logout.js";
