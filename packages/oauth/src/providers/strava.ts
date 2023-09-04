import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";

import type { Auth } from "lucia";

type Config = {
	clientId: string;
	clientSecret: string;
	scope?: string[];
	redirectUri?: string;
};

const PROVIDER_ID = "strava";

export const strava = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): StravaAuth<_Auth> => {
	return new StravaAuth(auth, config);
};

export class StravaAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	StravaUserAuth<_Auth>
> {
	private config: Config;

	constructor(auth: _Auth, config: Config) {
		super(auth);

		this.config = config;
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, state: string]
	> => {
		return await createOAuth2AuthorizationUrl(
			"https://www.strava.com/oauth/authorize",
			{
				clientId: this.config.clientId,
				scope: this.config.scope ?? ["read"],
				redirectUri: this.config.redirectUri
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<StravaUserAuth<_Auth>> => {
		const [stravaUser, stravaTokens] = await this.validateAuthorizationCode(
			code
		);
		return new StravaUserAuth(this.auth, stravaUser, stravaTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<[stravaUser: StravaUser, stravaTokens: StravaTokens]> => {
		const { athlete: user, ...tokens } =
			await validateOAuth2AuthorizationCode<AccessTokenResponseBody>(
				code,
				"https://www.strava.com/oauth/token",
				{
					clientId: this.config.clientId,
					clientPassword: {
						clientSecret: this.config.clientSecret,
						authenticateWith: "client_secret"
					}
				}
			);
		if ("refresh_token" in tokens) {
			return [
				user,
				{
					accessToken: tokens.access_token,
					accessTokenExpiresIn: tokens.expires_in,
					refreshToken: tokens.refresh_token
				}
			];
		}
		return [
			user,
			{
				accessToken: tokens.access_token
			}
		];
	};
}

export class StravaUserAuth<
	_Auth extends Auth
> extends ProviderUserAuth<_Auth> {
	public stravaTokens: StravaTokens;
	public stravaUser: StravaUser;

	constructor(auth: _Auth, stravaUser: StravaUser, stravaTokens: StravaTokens) {
		super(auth, PROVIDER_ID, stravaUser.id.toString());

		this.stravaTokens = stravaTokens;
		this.stravaUser = stravaUser;
	}
}

type AccessTokenResponseBody =
	| {
			access_token: string;
			athlete: StravaUser;
	  }
	| {
			access_token: string;
			refresh_token: string;
			expires_in: number;
			expires_at: number;
			athlete: StravaUser;
	  };

export type StravaTokens =
	| {
			accessToken: string;
	  }
	| {
			accessToken: string;
			refreshToken: string;
			accessTokenExpiresIn: number;
	  };

export type StravaUser = {
	id: number;
	username: string;
	resource_state: number;
	firstname: string;
	lastname: string;
	bio: string;
	city: string;
	country: string;
	sex: string;
	premium: boolean;
	summit: boolean;
	created_at: string;
	updated_at: string;
	badge_type_id: number;
	weight: number;
	profile_medium: string;
	profile: string;
};
