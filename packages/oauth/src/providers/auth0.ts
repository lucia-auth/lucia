import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";

import type { Auth } from "lucia";

const PROVIDER_ID = "auth0";

type Config = {
	clientId: string;
	clientSecret: string;
	appDomain: string;
	redirectUri: string;
	scope?: string[];
};

export const auth0 = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): Auth0Auth<_Auth> => {
	return new Auth0Auth(auth, config);
};

export class Auth0Auth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	Auth0UserAuth<_Auth>
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
			new URL("/authorize", originFromDomain(this.config.appDomain)),
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: ["openid", "profile", ...scopeConfig]
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<Auth0UserAuth<_Auth>> => {
		const auth0Tokens = await this.validateAuthorizationCode(code);
		const auth0User = await getAuth0User(
			this.config.appDomain,
			auth0Tokens.accessToken
		);
		return new Auth0UserAuth(this.auth, auth0User, auth0Tokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<Auth0Tokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token: string;
			id_token: string;
			token_type: string;
		}>(code, new URL("/oauth/token", this.config.appDomain), {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				clientSecret: this.config.clientSecret,
				authenticateWith: "client_secret"
			}
		});

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			idToken: tokens.id_token,
			tokenType: tokens.token_type
		};
	};
}

export class Auth0UserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public auth0Tokens: Auth0Tokens;
	public auth0User: Auth0User;

	constructor(auth: _Auth, auth0User: Auth0User, auth0Tokens: Auth0Tokens) {
		super(auth, PROVIDER_ID, auth0User.id);
		this.auth0Tokens = auth0Tokens;
		this.auth0User = auth0User;
	}
}

const getAuth0User = async (appDomain: string, accessToken: string) => {
	const request = new Request(new URL("/userinfo", appDomain), {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const auth0Profile = await handleRequest<Auth0UserInfoResult>(request);
	const auth0User: Auth0User = {
		id: auth0Profile.sub.split("|")[1],
		...auth0Profile
	};
	return auth0User;
};

const originFromDomain = (domain: string): string => {
	if (domain.startsWith("https://") || domain.startsWith("http://")) {
		return domain;
	}
	return "https://" + domain;
};

export type Auth0Tokens = {
	accessToken: string;
	refreshToken: string;
	idToken: string;
	tokenType: string;
};

type Auth0UserInfoResult = {
	sub: string;
	name: string;
	picture: string;
	locale: string;
	updated_at: string;
	given_name?: string;
	family_name?: string;
	middle_name?: string;
	nickname?: string;
	preferred_username?: string;
	profile?: string;
	email?: string;
	email_verified?: boolean;
	gender?: string;
	birthdate?: string;
	zoneinfo?: string;
	phone_number?: string;
	phone_number_verified?: boolean;
};

export type Auth0User = {
	id: string;
	sub: string;
	name: string;
	picture: string;
	locale: string;
	updated_at: string;
	given_name?: string;
	family_name?: string;
	middle_name?: string;
	nickname?: string;
	preferred_username?: string;
	profile?: string;
	email?: string;
	email_verified?: boolean;
	gender?: string;
	birthdate?: string;
	zoneinfo?: string;
	phone_number?: string;
	phone_number_verified?: boolean;
};
