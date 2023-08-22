import { generateRandomString } from "lucia/utils";
import {
	OAuth2ProviderAuthWithPKCE,
	createOAuth2AuthorizationUrlWithPKCE,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { decodeIdToken } from "../core/oidc.js";
import { ProviderUserAuth } from "../core/provider.js";

import type { Auth } from "lucia";

type Config = {
	clientId: string;
	clientSecret: string;
	tenant: string;
	redirectUri: string;
	scope?: string[];
};

const PROVIDER_ID = "azure_ad";

export const azureAD = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): AzureADAuth<_Auth> => {
	return new AzureADAuth(auth, config);
};

export class AzureADAuth<
	_Auth extends Auth = Auth
> extends OAuth2ProviderAuthWithPKCE<AzureADUserAuth<_Auth>> {
	private config: Config;

	constructor(auth: _Auth, config: Config) {
		super(auth);
		this.config = config;
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, codeVerifier: string, state: string]
	> => {
		const scopeConfig = this.config.scope ?? [];
		const [url, codeVerifier, state] =
			await createOAuth2AuthorizationUrlWithPKCE(
				`https://login.microsoftonline.com/${this.config.tenant}/oauth2/v2.0/authorize`,
				{
					clientId: this.config.clientId,
					codeChallengeMethod: "S256",
					scope: ["openid", "profile", ...scopeConfig],
					redirectUri: this.config.redirectUri
				}
			);
		url.searchParams.set("nonce", generateRandomString(32));
		return [url, codeVerifier, state];
	};

	public validateCallback = async (
		code: string,
		code_verifier: string
	): Promise<AzureADUserAuth<_Auth>> => {
		const azureADTokens = await this.validateAuthorizationCode(
			code,
			code_verifier
		);
		const azureADUser = decodeIdToken<AzureADUser>(azureADTokens.idToken);
		return new AzureADUserAuth(this.auth, azureADUser, azureADTokens);
	};

	private validateAuthorizationCode = async (
		code: string,
		codeVerifier: string
	): Promise<AzureADTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			id_token: string;
			access_token: string;
			expires_in: number;
			refresh_token?: string;
		}>(
			code,
			`https://login.microsoftonline.com/${this.config.tenant}/oauth2/v2.0/token`,
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				codeVerifier,
				clientPassword: {
					authenticateWith: "client_secret",
					clientSecret: this.config.clientSecret
				}
			}
		);
		return {
			idToken: tokens.id_token,
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in,
			refreshToken: tokens.refresh_token ?? null
		};
	};
}

export class AzureADUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public azureADTokens: AzureADTokens;
	public azureADUser: AzureADUser;

	constructor(
		auth: _Auth,
		azureADUser: AzureADUser,
		azureADTokens: AzureADTokens
	) {
		super(auth, PROVIDER_ID, azureADUser.sub);
		this.azureADTokens = azureADTokens;
		this.azureADUser = azureADUser;
	}
}

export type AzureADTokens = {
	idToken: string;
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string | null;
};

export type AzureADUser = {
	sub: string;
	roles: string[];
	oid: string;
	name: string;
	preferred_username: string;
	email?: string; // may require `email` scope
};
