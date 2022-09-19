import type { ServerSession } from "$lib/types.js";
import {
    AccessToken,
    EncryptedRefreshToken,
    FingerprintToken,
} from "$lib/utils/token.js";
import cookie from "cookie";
import type { Context } from "./index.js";
import { Readable } from "stream";
import { Request as NodeFetchRequest } from "node-fetch";

export type ValidateFormSubmission = (
    request: Request
) => Promise<ServerSession>;

/*
sveltekit sends forms with a content-type of multipart/form-data,
which is not supported by undici (yet)

sveltekit creates a custom request object like below which works for most use cases
but lucia uses .clone(), which returns the normal request object instead of the custom implementation

from https://github.com/sveltejs/kit/blob/1cec7bd4b079d7a78727fadb1b763dc81faeb984/packages/kit/src/node/polyfills.js#L14
*/
class CustomRequest extends Request {
    formData() {
        return new NodeFetchRequest(this.url, {
            method: this.method,
            headers: this.headers,
            body: this.body && Readable.from(this.body as any),
        }).formData();
    }
}

export const validateFormSubmissionFunction = (context: Context) => {
    const validateFormSubmission: ValidateFormSubmission = async (request) => {
        const clonedRequest = request.clone(); // clone the request so the user can call formData on the original request
        const patchedRequest = new CustomRequest(clonedRequest);
        const formData = await patchedRequest.formData();
        const accessToken = new AccessToken(
            formData.get("_lucia")?.toString() || "",
            context
        );
        const cookies = cookie.parse(clonedRequest.headers.get("cookie") || "");
        const fingerprintToken = new FingerprintToken(
            cookies.fingerprint_token,
            context
        );
        const encryptedRefreshToken = new EncryptedRefreshToken(
            cookies.encrypt_refresh_token,
            context
        );
        const refreshToken = encryptedRefreshToken.decrypt(); // throws AUTH_INVALID_REFRESH_TOKEN if invalid
        const user = await accessToken.user(fingerprintToken.value); // throws AUTH_INVALID_ACCESS_TOKEN if either token is invalid
        return {
            user,
            access_token: accessToken,
            refresh_token: refreshToken,
            fingerprint_token: fingerprintToken,
            cookies: [
                accessToken.cookie(),
                refreshToken.cookie(),
                fingerprintToken.cookie(),
            ],
        };
    };
    return validateFormSubmission;
};
