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
	scope?: string[];
	redirectUri?: string;
};

const PROVIDER_ID = "github";

export const github = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): GithubAuth<_Auth> => {
	return new GithubAuth(auth, config);
};

export class GithubAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	GithubUserAuth<_Auth>
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
			"https://github.com/login/oauth/authorize",
			{
				clientId: this.config.clientId,
				scope: this.config.scope ?? [],
				redirectUri: this.config.redirectUri
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<GithubUserAuth<_Auth>> => {
		const githubTokens = await this.validateAuthorizationCode(code);
		const githubUser = await getGithubUser(githubTokens.accessToken);
		return new GithubUserAuth(this.auth, githubUser, githubTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<GithubTokens> => {
		const tokens =
			await validateOAuth2AuthorizationCode<AccessTokenResponseBody>(
				code,
				"https://github.com/login/oauth/access_token",
				{
					clientId: this.config.clientId,
					clientPassword: {
						clientSecret: this.config.clientSecret,
						authenticateWith: "client_secret"
					}
				}
			);
		if ("refresh_token" in tokens) {
			return {
				accessToken: tokens.access_token,
				accessTokenExpiresIn: tokens.expires_in,
				refreshToken: tokens.refresh_token,
				refreshTokenExpiresIn: tokens.refresh_token_expires_in
			};
		}
		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: null
		};
	};
}

const getGithubUser = async (accessToken: string): Promise<GithubUser> => {
	const githubUserRequest = new Request("https://api.github.com/user", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	return await handleRequest<GithubUser>(githubUserRequest);
};

export class GithubUserAuth<
	_Auth extends Auth
> extends ProviderUserAuth<_Auth> {
	public githubTokens: GithubTokens;
	public githubUser: GithubUser;

	constructor(auth: _Auth, githubUser: GithubUser, githubTokens: GithubTokens) {
		super(auth, PROVIDER_ID, githubUser.id.toString());

		this.githubTokens = githubTokens;
		this.githubUser = githubUser;
	}
}

type AccessTokenResponseBody =
	| {
			access_token: string;
	  }
	| {
			access_token: string;
			refresh_token: string;
			expires_in: number;
			refresh_token_expires_in: number;
	  };

export type GithubTokens =
	| {
			accessToken: string;
			accessTokenExpiresIn: null;
	  }
	| {
			accessToken: string;
			accessTokenExpiresIn: number;
			refreshToken: string;
			refreshTokenExpiresIn: number;
	  };

export type GithubUser = PublicGithubUser | PrivateGithubUser;

type PublicGithubUser = {
	avatar_url: string;
	bio: string | null;
	blog: string | null;
	company: string | null;
	created_at: string;
	email: string | null;
	events_url: string;
	followers: number;
	followers_url: string;
	following: number;
	following_url: string;
	gists_url: string;
	gravatar_id: string | null;
	hireable: boolean | null;
	html_url: string;
	id: number;
	location: string | null;
	login: string;
	name: string | null;
	node_id: string;
	organizations_url: string;
	public_gists: number;
	public_repos: number;
	received_events_url: string;
	repos_url: string;
	site_admin: boolean;
	starred_url: string;
	subscriptions_url: string;
	type: string;
	updated_at: string;
	url: string;

	twitter_username?: string | null;
	plan?: {
		name: string;
		space: number;
		private_repos: number;
		collaborators: number;
	};
	suspended_at?: string | null;
};

type PrivateGithubUser = PublicGithubUser & {
	collaborators: number;
	disk_usage: number;
	owned_private_repos: number;
	private_gists: number;
	total_private_repos: number;
	two_factor_authentication: boolean;

	business_plus?: boolean;
	ldap_dn?: string;
};
