import {
	createOAuth2AuthorizationUrl,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core.js";
import { handleRequest, authorizationHeader } from "../request.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

const PROVIDER_ID = "github";

type Config = OAuthConfig & {
	redirectUri?: string;
};

export const github = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getGithubTokens = async (code: string): Promise<GithubTokens> => {
		const tokens =
			await validateOAuth2AuthorizationCode<AccessTokenResponseBody>(
				code,
				"https://github.com/login/oauth/access_token",
				{
					clientId: config.clientId,
					clientPassword: {
						clientSecret: config.clientSecret,
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

	return {
		getAuthorizationUrl: async () => {
			return await createOAuth2AuthorizationUrl(
				"https://github.com/login/oauth/authorize",
				{
					clientId: config.clientId,
					scope: config.scope ?? [],
					redirectUri: config.redirectUri
				}
			);
		},
		validateCallback: async (code: string) => {
			const githubTokens = await getGithubTokens(code);
			const githubUser = await getGithubUser(githubTokens.accessToken);
			const providerUserId = githubUser.id.toString();
			const githubUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...githubUserAuth,
				githubUser,
				githubTokens
			};
		}
	} as const satisfies OAuthProvider;
};

const getGithubUser = async (accessToken: string): Promise<GithubUser> => {
	const request = new Request("https://api.github.com/user", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const githubUser = await handleRequest<GithubUser>(request);
	return githubUser;
};

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

type GithubTokens =
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
