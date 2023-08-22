import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";

import type { Auth } from "lucia";

type Config = {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scope?: string[];
	accessType?: "online" | "offline";
};

const PROVIDER_ID = "google";

export const google = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): GoogleAuth<_Auth> => {
	return new GoogleAuth(auth, config);
};

export class GoogleAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	GoogleUserAuth<_Auth>
> {
	private config: Config;

	constructor(auth: _Auth, config: Config) {
		super(auth);

		this.config = config;
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, state: string]
	> => {
		const scopeConfig = this.config.scope ?? [];
		return await createOAuth2AuthorizationUrl(
			"https://accounts.google.com/o/oauth2/v2/auth",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: [
					"https://www.googleapis.com/auth/userinfo.profile",
					...scopeConfig
				]
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<GoogleUserAuth<_Auth>> => {
		const googleTokens = await this.validateAuthorizationCode(code);
		const googleUser = await getGoogleUser(googleTokens.accessToken);
		return new GoogleUserAuth(this.auth, googleUser, googleTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<GoogleTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token?: string;
			expires_in: number;
		}>(code, "https://oauth2.googleapis.com/token", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				clientSecret: this.config.clientSecret,
				authenticateWith: "client_secret"
			}
		});

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token ?? null,
			accessTokenExpiresIn: tokens.expires_in
		};
	};
}

export class GoogleUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public googleTokens: GoogleTokens;
	public googleUser: GoogleUser;

	constructor(auth: _Auth, googleUser: GoogleUser, googleTokens: GoogleTokens) {
		super(auth, PROVIDER_ID, googleUser.sub);

		this.googleTokens = googleTokens;
		this.googleUser = googleUser;
	}
}

const getGoogleUser = async (accessToken: string): Promise<GoogleUser> => {
	const request = new Request("https://www.googleapis.com/oauth2/v3/userinfo", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const googleUser = await handleRequest<GoogleUser>(request);
	return googleUser;
};

export type GoogleTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: number;
};

export type GoogleUser = {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	locale: string;
	email?: string;
	email_verified?: boolean;
	hd?: string;
};
