import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import {
	handleRequest,
	authorizationHeader,
	createUrl
} from "../utils/request.js";

import type { Auth } from "lucia";

type Config = {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scope?: string[];
};

const PROVIDER_ID = "patreon";

export const patreon = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): PatreonAuth<_Auth> => {
	return new PatreonAuth(auth, config);
};

export class PatreonAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	PatreonUserAuth<_Auth>
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
			"https://www.patreon.com/oauth2/authorize",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: ["identity", ...scopeConfig]
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<PatreonUserAuth<_Auth>> => {
		const patreonTokens = await this.validateAuthorizationCode(code);
		const patreonUser = await getPatreonUser(patreonTokens.accessToken);
		return new PatreonUserAuth(this.auth, patreonUser, patreonTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<PatreonTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token?: string;
			expires_in: number;
		}>(code, "https://www.patreon.com/api/oauth2/token", {
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

export class PatreonUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public patreonTokens: PatreonTokens;
	public patreonUser: PatreonUser;

	constructor(
		auth: _Auth,
		patreonUser: PatreonUser,
		patreonTokens: PatreonTokens
	) {
		super(auth, PROVIDER_ID, patreonUser.id);
		this.patreonTokens = patreonTokens;
		this.patreonUser = patreonUser;
	}
}

const getPatreonUser = async (accessToken: string): Promise<PatreonUser> => {
	const requestUrl = createUrl(
		"https://www.patreon.com/api/oauth2/v2/identity",
		{
			"fields[user]":
				"about,email,full_name,hide_pledges,image_url,is_email_verified,url"
		}
	);
	const request = new Request(requestUrl, {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const { data: patreonUser } = await handleRequest<{
		data: PatreonUser;
	}>(request);

	return patreonUser;
};

export type PatreonTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: number;
};

export type PatreonUser = {
	id: string;
	attributes: {
		about: string | null;
		created: string;
		email?: string;
		full_name: string;
		hide_pledges: boolean | null;
		image_url: string;
		is_email_verified: boolean;
		url: string;
	};
};
