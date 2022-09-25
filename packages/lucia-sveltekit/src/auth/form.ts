import type { ServerSession } from "../types.js";
import {
    AccessToken,
    EncryptedRefreshToken,
    FingerprintToken,
} from "../utils/token.js";
import cookie from "cookie";
import type { Context } from "./index.js";

export type ValidateFormSubmission = (
    request: Request
) => Promise<ServerSession>;

export const validateFormSubmissionFunction = (context: Context) => {
    const validateFormSubmission: ValidateFormSubmission = async (request) => {
        const formData = await request.formData();
        /*
        request body can only consumed once,
        so override the original formData method to return the cache

        cloning it won't work since undici doesn't support multipart/form-data, which sveltekit uses
        sveltekit patches the formData method to support it but won't transfer to cloned request
        */
        request.formData = async () => {
            return formData
        }
        const accessToken = new AccessToken(
            formData.get("_lucia")?.toString() || "",
            context
        );
        const cookies = cookie.parse(request.headers.get("cookie") || "");
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
