import { post, get } from "./request.js";
import type { Auth, GlobalUserAttributes, User } from "lucia-auth";
import { generateState, OAuthConfig, OAuthProvider } from "./index.js";

interface Configs extends OAuthConfig {
	redirectUri: string;
}

class Google<A extends Auth> implements OAuthProvider {
	constructor(auth: A, configs: Configs) {
		this.auth = auth;
		this.clientId = configs.clientId;
		this.clientSecret = configs.clientSecret;
		this.redirectUri = configs.redirectUri;
		this.scope = ["https://www.googleapis.com/auth/userinfo.profile", ...(configs.scope || [])];
		this.state = configs.state ?? true;
	}
	private auth: A;
	private clientId: string;
	private clientSecret: string;
	private scope: string[];
	private redirectUri: string;
	private state: boolean;

	public getAuthorizationUrl = (state?: string): [url: string, state: string | undefined] => {
		const s = state ?? (this.state ? generateState() : undefined);
		const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
			client_id: this.clientId,
			redirect_uri: this.redirectUri,
			scope: this.scope.join(" "),
			response_type: "code",
			...(s && { state: s })
		}).toString()}`;

		return [url, s];
	};

	public validateCallback = async (code: string) => {
		const {
			access_token: accessToken,
			refresh_token: refreshToken,
			expires_in: expiresIn
		} = (await post(
			`https://oauth2.googleapis.com/token?${new URLSearchParams({
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code,
				grant_type: "authorization_code",
				redirect_uri: this.redirectUri
			}).toString()}`
		)) as {
			access_token: string;
			refresh_token?: string;
			expires_in: number;
		};
		const googleUser = (await get("https://www.googleapis.com/oauth2/v3/userinfo", {
			bearerToken: accessToken
		})) as GoogleUser;
		const googleUserId = String(googleUser.sub);
		let existingUser: User | null = null;
		try {
			existingUser = await this.auth.getUserByProviderId("google", googleUserId);
		} catch {
			// existingUser is null
		}
		return {
			createUser: async (userAttributes: GlobalUserAttributes = {}) => {
				return await this.auth.createUser("google", googleUserId, {
					attributes: userAttributes
				});
			},
			existingUser,
			providerUser: googleUser,
			accessToken,
			refreshToken,
			expiresIn
		};
	};
}

const google = <A extends Auth>(auth: A, configs: Configs) => {
	return new Google(auth, configs);
};

export default google;

interface GoogleUser {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	email: string;
	email_verified: boolean;
	locale: string;
	hd: string;
}
