import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { decodeIdToken } from "../core/oidc.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";

import type { Auth } from "lucia";

type Config = {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scope?: string[];
};

const PROVIDER_ID = "line";

export const line = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): LineAuth<_Auth> => {
	return new LineAuth(auth, config);
};

export class LineAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	LineUserAuth<_Auth>
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
			"https://access.line.me/oauth2/v2.1/authorize",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: ["profile", "openid", ...scopeConfig]
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<LineUserAuth<_Auth>> => {
		const lineTokens = await this.validateAuthorizationCode(code);
		const lineUser = await getLineUser(
			lineTokens.accessToken,
			lineTokens.idToken
		);
		return new LineUserAuth(this.auth, lineUser, lineTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<LineTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
			id_token: string;
		}>(code, "https://api.line.me/oauth2/v2.1/token", {
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
			refreshToken: tokens.refresh_token,
			idToken: tokens.id_token
		};
	};
}

export class LineUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public lineTokens: LineTokens;
	public lineUser: LineUser;

	constructor(auth: _Auth, lineUser: LineUser, lineTokens: LineTokens) {
		super(auth, PROVIDER_ID, lineUser.userId);

		this.lineTokens = lineTokens;
		this.lineUser = lineUser;
	}
}

const getLineUser = async (
	accessToken: string,
	idToken: string
): Promise<LineUser> => {
	const request = new Request("GET https://api.line.me/v2/profile", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const partialLineUser = await handleRequest<Omit<LineUser, "email">>(request);
	const idTokenClaims = decodeIdToken<{ email?: string }>(idToken);
	return {
		email: idTokenClaims.email ?? null,
		...partialLineUser
	};
};

export type LineTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
	idToken: string;
};

export type LineUser = {
	userId: string;
	displayName: string;
	pictureUrl: string;
	statusMessage: string;
	email: string | null;
};
