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

const PROVIDER_ID = "salesforce";

export const salesforce = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): SalesforceAuth<_Auth> => {
	return new SalesforceAuth(auth, config);
};

export class SalesforceAuth<
	_Auth extends Auth = Auth
> extends OAuth2ProviderAuth<SalesforceUserAuth<_Auth>> {
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
			"https://login.salesforce.com/services/oauth2/authorize",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: ["openid", "id", "profile", ...scopeConfig]
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<SalesforceUserAuth<_Auth>> => {
		const salesforceTokens = await this.validateAuthorizationCode(code);
		const salesforceUser = await getSalesforceUser(
			salesforceTokens.accessToken
		);
		return new SalesforceUserAuth(this.auth, salesforceUser, salesforceTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<SalesforceTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token?: string;
			id_token: string;
		}>(code, "https://login.salesforce.com/services/oauth2/token", {
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
			idToken: tokens.id_token
		};
	};
}

export class SalesforceUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public salesforceTokens: SalesforceTokens;
	public salesforceUser: SalesforceUser;

	constructor(
		auth: _Auth,
		salesforceUser: SalesforceUser,
		salesforceTokens: SalesforceTokens
	) {
		super(auth, PROVIDER_ID, salesforceUser.user_id);

		this.salesforceTokens = salesforceTokens;
		this.salesforceUser = salesforceUser;
	}
}

const getSalesforceUser = async (
	accessToken: string
): Promise<SalesforceUser> => {
	const request = new Request(
		"https://login.salesforce.com/services/oauth2/userinfo",
		{
			headers: {
				Authorization: authorizationHeader("bearer", accessToken)
			}
		}
	);
	const salesforceUser = await handleRequest<SalesforceUser>(request);
	return salesforceUser;
};

export type SalesforceTokens = {
	accessToken: string;
	idToken: string;
	refreshToken: string | null;
};

export type SalesforceUser = {
	sub: string; // URL
	user_id: string;
	organization_id: string;
	name: string;
	email?: string;
	email_verified: boolean;
	given_name: string;
	family_name: string;
	zoneinfo: string;
	photos: {
		picture: string;
		thumbnail: string;
	};
	profile: string;
	picture: string;
	address?: Record<string, string>;
	urls: Record<string, string>;
	active: boolean;
	user_type: string;
	language: string;
	locale: string;
	utcOffset: number;
	updated_at: string;
};
