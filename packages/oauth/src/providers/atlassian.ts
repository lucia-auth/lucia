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
};

const PROVIDER_ID = "atlassian";

export const atlassian = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): AtlassianAuth<_Auth> => {
	return new AtlassianAuth(auth, config);
};

export class AtlassianAuth<
	_Auth extends Auth = Auth
> extends OAuth2ProviderAuth<AtlassianUserAuth<_Auth>> {
	private config: Config;

	constructor(auth: _Auth, config: Config) {
		super(auth);

		this.config = config;
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, state: string]
	> => {
		const scopeConfig = this.config.scope ?? [];
		const [url, state] = await createOAuth2AuthorizationUrl(
			"https://auth.atlassian.com/authorize",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: ["read:me", ...scopeConfig]
			}
		);
		url.searchParams.set("audience", "api.atlassian.com");
		url.searchParams.set("prompt", "consent");
		return [url, state];
	};

	public validateCallback = async (
		code: string
	): Promise<AtlassianUserAuth<_Auth>> => {
		const atlassianTokens = await this.validateAuthorizationCode(code);
		const atlassianUser = await getAtlassianUser(atlassianTokens.accessToken);
		return new AtlassianUserAuth(this.auth, atlassianUser, atlassianTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<AtlassianTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token?: string;
		}>(code, "https://auth.atlassian.com/token", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				authenticateWith: "client_secret",
				clientSecret: this.config.clientSecret
			}
		});
		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in,
			refreshToken: tokens.refresh_token ?? null
		};
	};
}

export class AtlassianUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public atlassianTokens: AtlassianTokens;
	public atlassianUser: AtlassianUser;

	constructor(
		auth: _Auth,
		atlassianUser: AtlassianUser,
		atlassianTokens: AtlassianTokens
	) {
		super(auth, PROVIDER_ID, atlassianUser.account_id);

		this.atlassianTokens = atlassianTokens;
		this.atlassianUser = atlassianUser;
	}
}

const getAtlassianUser = async (
	accessToken: string
): Promise<AtlassianUser> => {
	const request = new Request("https://api.atlassian.com/me", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const atlassianUser = await handleRequest<AtlassianUser>(request);
	return atlassianUser;
};

export type AtlassianTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string | null;
};

export type AtlassianUser = {
	account_type: string;
	account_id: string;
	email: string;
	name: string;
	picture: string;
	account_status: string;
	nickname: string;
	zoneinfo: string;
	locale: string;
	extended_profile?: Record<string, string>;
};
