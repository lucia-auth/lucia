import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { scope, provider } from "../core.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig } from "../core.js";

const PROVIDER_ID = "github";

export const github = (auth: Auth, config: OAuthConfig) => {
	const getAuthorizationUrl = async (state: string) => {
		const url = createUrl("https://github.com/login/oauth/authorize", {
			client_id: config.clientId,
			scope: scope([], config.scope),
			state
		});
		return url;
	};

	const getTokens = async (
		code: string
	): Promise<
		| {
				accessToken: string;
				accessTokenExpiresIn: null;
		  }
		| {
				accessToken: string;
				accessTokenExpiresIn: number;
				refreshToken: string;
				refreshTokenExpiresIn: number;
		  }
	> => {
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
		const tokens = await handleRequest<
			| {
					access_token: string;
			  }
			| {
					access_token: string;
					refresh_token: string;
					expires_in: number;

					refresh_token_expires_in: number;
			  }
		>(request);
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
		const providerUserId = githubUser.id.toString();
		return [providerUserId, githubUser] as const;
	};

	return provider(auth, {
		providerId: PROVIDER_ID,
		getAuthorizationUrl,
		getTokens,
		getProviderUser
	});
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
