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
};

const PROVIDER_ID = "bitbucket";

export const bitbucket = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): BitbucketAuth<_Auth> => {
	return new BitbucketAuth(auth, config);
};

export class BitbucketAuth<
	_Auth extends Auth = Auth
> extends OAuth2ProviderAuth<BitbucketUserAuth<_Auth>> {
	private config: Config;

	constructor(auth: _Auth, config: Config) {
		super(auth);

		this.config = config;
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, state: string]
	> => {
		return await createOAuth2AuthorizationUrl(
			"https://bitbucket.org/site/oauth2/authorize",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: ["account"]
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<BitbucketUserAuth<_Auth>> => {
		const bitbucketTokens = await this.validateAuthorizationCode(code);
		const bitbucketUser = await getBitbucketUser(bitbucketTokens.accessToken);
		return new BitbucketUserAuth(this.auth, bitbucketUser, bitbucketTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<BitbucketTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
		}>(code, "https://bitbucket.org/site/oauth2/access_token", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				authenticateWith: "http_basic_auth",
				clientSecret: this.config.clientSecret
			}
		});
		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in,
			refreshToken: tokens.refresh_token
		};
	};
}

export class BitbucketUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public bitbucketTokens: BitbucketTokens;
	public bitbucketUser: BitbucketUser;

	constructor(
		auth: _Auth,
		bitbucketUser: BitbucketUser,
		bitbucketTokens: BitbucketTokens
	) {
		super(auth, PROVIDER_ID, bitbucketUser.uuid);

		this.bitbucketTokens = bitbucketTokens;
		this.bitbucketUser = bitbucketUser;
	}
}

const getBitbucketUser = async (
	accessToken: string
): Promise<BitbucketUser> => {
	const request = new Request("https://api.bitbucket.org/2.0/user", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const bitbucketUser = await handleRequest<BitbucketUser>(request);
	return bitbucketUser;
};

export type BitbucketTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
};

export type BitbucketUser = {
	type: string;
	links: {
		avatar:
			| {}
			| {
					href: string;
					name: string;
			  };
	};
	created_on: string;
	display_name: string;
	username: string;
	uuid: string;
};
