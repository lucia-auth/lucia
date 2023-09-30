import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { decodeIdToken } from "../core/oidc.js";
import { getPKCS8Key } from "../utils/crypto.js";
import { createES256SignedJWT } from "../utils/jwt.js";

import type { Auth } from "lucia";

type Config = {
	redirectUri: string;
	clientId: string;
	teamId: string;
	keyId: string;
	certificate: string;
	responseMode?: "query" | "form_post";
	scope?: string[];
};

const PROVIDER_ID = "apple";
const APPLE_AUD = "https://appleid.apple.com";

export const apple = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): AppleAuth<_Auth> => {
	return new AppleAuth(auth, config);
};

export class AppleAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	AppleUserAuth<_Auth>
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
		const [url, state] = await createOAuth2AuthorizationUrl(
			"https://appleid.apple.com/auth/authorize",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: scopeConfig
			}
		);
		url.searchParams.set("response_mode", this.config.responseMode ?? "query");
		return [url, state];
	};

	public validateCallback = async (
		code: string
	): Promise<AppleUserAuth<_Auth>> => {
		const appleTokens = await this.validateAuthorizationCode(code);
		const idTokenPayload = decodeIdToken<{
			sub: string;
			email?: string;
			email_verified?: boolean;
		}>(appleTokens.idToken);
		const appleUser: AppleUser = {
			sub: idTokenPayload.sub,
			email: idTokenPayload.email,
			email_verified: idTokenPayload.email_verified
		};
		return new AppleUserAuth(this.auth, appleUser, appleTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<AppleTokens> => {
		const clientSecret = await createSecretId({
			certificate: this.config.certificate,
			teamId: this.config.teamId,
			clientId: this.config.clientId,
			keyId: this.config.keyId
		});
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token?: string;
			expires_in: number;
			id_token: string;
		}>(code, "https://appleid.apple.com/auth/token", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				clientSecret,
				authenticateWith: "client_secret"
			}
		});

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token ?? null,
			accessTokenExpiresIn: tokens.expires_in,
			idToken: tokens.id_token
		};
	};
}

export class AppleUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public appleTokens: AppleTokens;
	public appleUser: AppleUser;

	constructor(auth: _Auth, appleUser: AppleUser, appleTokens: AppleTokens) {
		super(auth, PROVIDER_ID, appleUser.sub);
		this.appleTokens = appleTokens;
		this.appleUser = appleUser;
	}
}

const createSecretId = async (config: {
	certificate: string;
	teamId: string;
	clientId: string;
	keyId: string;
}): Promise<string> => {
	const now = Math.floor(Date.now() / 1000);
	const payload = {
		iss: config.teamId,
		iat: now,
		exp: now + 60 * 3,
		aud: APPLE_AUD,
		sub: config.clientId
	};
	const privateKey = getPKCS8Key(config.certificate);
	const jwt = await createES256SignedJWT(
		{
			alg: "ES256",
			kid: config.keyId
		},
		payload,
		privateKey
	);
	return jwt;
};

export type AppleTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: number;
	idToken: string;
};

export type AppleUser = {
	email?: string;
	email_verified?: boolean;
	sub: string;
};
