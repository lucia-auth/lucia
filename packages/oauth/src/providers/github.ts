import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { scope, generateState, useAuth } from "../core.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

const PROVIDER_ID = "github";

type Tokens =
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

type Config = OAuthConfig & {
	redirectUri?: string;
};

export const github = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getTokens = async (code: string): Promise<Tokens> => {
		const requestUrl = createUrl(
			"https://github.com/login/oauth/access_token",
			{
				client_id: config.clientId,
				client_secret: config.clientSecret,
				code
			}
		);
		const request = new Request(requestUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			}
		});
		type ResponseBody =
			| {
					access_token: string;
			  }
			| {
					access_token: string;
					refresh_token: string;
					expires_in: number;
					refresh_token_expires_in: number;
			  };
		const tokens = await handleRequest<ResponseBody>(request);
		if ("expires_in" in tokens) {
			return {
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				accessTokenExpiresIn: tokens.expires_in,
				refreshTokenExpiresIn: tokens.refresh_token_expires_in
			};
		}
		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: null
		};
	};

	const getProviderUser = async (accessToken: string) => {
		const request = new Request("https://api.github.com/user", {
			headers: authorizationHeaders("bearer", accessToken)
		});
		const githubUser = await handleRequest<GithubUser>(request);
		return githubUser;
	};

	return {
		getAuthorizationUrl: async () => {
			const state = generateState();
			const url = createUrl("https://github.com/login/oauth/authorize", {
				client_id: config.clientId,
				scope: scope([], config.scope),
				state
			});
			if (config.redirectUri) {
				url.searchParams.set("redirect_uri", config.redirectUri);
			}
			return [url, state] as const;
		},
		validateCallback: async (code: string) => {
			const tokens = await getTokens(code);
			const providerUser = await getProviderUser(tokens.accessToken);
			const providerUserId = providerUser.id.toString();
			const providerAuthHelpers = await useAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...providerAuthHelpers,
				providerUser,
				tokens
			};
		}
	} as const satisfies OAuthProvider<_Auth>;
};

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

export type GithubUser = PublicGithubUser | PrivateGithubUser;
