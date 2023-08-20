import {
	OAuth2ProviderAuthWithPKCE,
	createOAuth2AuthorizationUrlWithPKCE,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";

import type { Auth } from "lucia";

type Config = {
	clientId: string;
	redirectUri: string;
	scope?: string[];
};

const PROVIDER_ID = "lichess";

export const lichess = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): LichessAuth<_Auth> => {
	return new LichessAuth(auth, config);
};

export class LichessAuth<
	_Auth extends Auth = Auth
> extends OAuth2ProviderAuthWithPKCE<LichessUserAuth<_Auth>> {
	private config: Config;

	constructor(auth: _Auth, config: Config) {
		super(auth);

		this.config = config;
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, codeVerifier: string, state: string]
	> => {
		return await createOAuth2AuthorizationUrlWithPKCE(
			"https://lichess.org/oauth",
			{
				clientId: this.config.clientId,
				codeChallengeMethod: "S256",
				scope: this.config.scope ?? [],
				redirectUri: this.config.redirectUri
			}
		);
	};

	public validateCallback = async (
		code: string,
		code_verifier: string
	): Promise<LichessUserAuth<_Auth>> => {
		const lichessTokens = await this.validateAuthorizationCode(
			code,
			code_verifier
		);
		const lichessUser = await getLichessUser(lichessTokens.accessToken);
		return new LichessUserAuth(this.auth, lichessUser, lichessTokens);
	};

	private validateAuthorizationCode = async (
		code: string,
		codeVerifier: string
	): Promise<LichessTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
		}>(code, "https://lichess.org/api/token", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			codeVerifier
		});

		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in
		};
	};
}

const getLichessUser = async (accessToken: string): Promise<LichessUser> => {
	const request = new Request("https://lichess.org/api/account", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const lichessUser = await handleRequest<LichessUser>(request);
	return lichessUser;
};

export class LichessUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public lichessTokens: LichessTokens;
	public lichessUser: LichessUser;

	constructor(
		auth: _Auth,
		lichessUser: LichessUser,
		lichessTokens: LichessTokens
	) {
		super(auth, PROVIDER_ID, lichessUser.id);

		this.lichessTokens = lichessTokens;
		this.lichessUser = lichessUser;
	}
}

export type LichessTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
};

export type LichessUser = {
	id: string;
	username: string;
};
