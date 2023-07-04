import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { scope, provider, generateState, connectAuth } from "../core.js";

import type { Auth } from "lucia-auth";
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
		getAuthorizationUrl: async (redirectUri?: string) => {
			const state = generateState();
			const url = createUrl("https://github.com/login/oauth/authorize", {
				client_id: config.clientId,
				scope: scope([], config.scope),
				state
			});
			if (config.redirectUri != undefined || redirectUri != undefined) {
				url.searchParams.set(
					"redirect_uri",
					redirectUri ?? (config.redirectUri as string)
				);
			}
			return [url, state] as const;
		},
		validateCallback: async (code: string) => {
			const tokens = await getTokens(code);
			const providerUser = await getProviderUser(tokens.accessToken);
			const providerUserId = providerUser.id.toString();
			const providerAuth = await connectAuth(auth, PROVIDER_ID, providerUserId);
			return {
				...providerAuth,
				providerUser,
				tokens
			};
		}
	} as const satisfies OAuthProvider<_Auth>;
};

export type GithubUser = {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
	name: string;
	company: string;
	blog: string;
	location: string;
	email: string;
	hireable: boolean;
	bio: string;
	twitter_username: string;
	public_repos: number;
	public_gists: number;
	followers: number;
	following: number;
	created_at: string;
	updated_at: string;
	private_gists?: number;
	total_private_repos?: number;
	owned_private_repos?: number;
	disk_usage?: number;
	collaborators?: number;
	two_factor_authentication?: boolean;
	plan?: {
		name: string;
		space: number;
		private_repos: number;
		collaborators: number;
	};
};
