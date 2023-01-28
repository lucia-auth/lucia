import { post, get } from "./request.js";
import type { Auth } from "lucia-auth";
import {
	CreateUserAttributesParameter,
	generateState,
	GetAuthorizationUrlReturnType,
	LuciaUser,
	OAuthConfig,
	OAuthProvider
} from "./index.js";

interface Configs extends OAuthConfig {
	redirectUri: string;
}

class Google<A extends Auth> implements OAuthProvider<A> {
	constructor(auth: A, configs: Configs) {
		this.auth = auth;
		this.clientId = configs.clientId;
		this.clientSecret = configs.clientSecret;
		this.redirectUri = configs.redirectUri;
		this.scope = [
			"https://www.googleapis.com/auth/userinfo.profile",
			...(configs.scope ?? [])
		];
	}
	private auth: A;
	private clientId: string;
	private clientSecret: string;
	private scope: string[];
	private redirectUri: string;

	public getAuthorizationUrl = <
		State extends string | null | undefined = undefined
	>(
		state?: State
	): GetAuthorizationUrlReturnType<State> => {
		const s =
			state ?? (typeof state === "undefined" ? generateState() : undefined);
		const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
			{
				client_id: this.clientId,
				redirect_uri: this.redirectUri,
				scope: this.scope.join(" "),
				response_type: "code",
				...(s && { state: s })
			}
		).toString()}`;
		if (state === null)
			return [url] as const as GetAuthorizationUrlReturnType<State>;
		return [url, s] as const as GetAuthorizationUrlReturnType<State>;
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
			}).toString()}`,
			{
				env: this.auth.ENV
			}
		)) as {
			access_token: string;
			refresh_token?: string;
			expires_in: number;
		};
		const googleUser = (await get(
			"https://www.googleapis.com/oauth2/v3/userinfo",
			{
				env: this.auth.ENV,
				bearerToken: accessToken
			}
		)) as GoogleUser;
		const PROVIDER_ID = "google";
		const PROVIDER_USER_ID = googleUser.sub;
		let existingUser: LuciaUser<A> | null = null;
		try {
			existingUser = (await this.auth.getUserByKey(
				PROVIDER_ID,
				PROVIDER_USER_ID
			)) as LuciaUser<A>;
		} catch {
			// existingUser is null
		}
		const createUser = async (
			userAttributes: CreateUserAttributesParameter<A>
		) => {
			return (await this.auth.createUser({
				key: {
					providerId: PROVIDER_ID,
					providerUserId: PROVIDER_USER_ID
				},
				attributes: userAttributes as any
			})) as any;
		};
		const createKey = async (userId: string) => {
			return await this.auth.createKey(userId, {
				providerId: PROVIDER_ID,
				providerUserId: PROVIDER_USER_ID,
				password: null
			});
		};
		return {
			createUser,
			existingUser,
			providerUser: googleUser,
			createKey,
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
