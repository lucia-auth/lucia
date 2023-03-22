import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { scope, provider } from "../core.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
	allMemberships?: boolean;
};

const PROVIDER_ID = "patreon";

export const patreon = <A extends Auth>(auth: A, config: Config) => {
	const getAuthorizationUrl = async (state: string) => {
		const url = createUrl("https://www.patreon.com/oauth2/authorize", {
			client_id: config.clientId,
			redirect_uri: config.redirectUri,
			scope: scope(["identity"], config.scope),
			response_type: "code",
			state
		});

		return url;
	};

	const getTokens = async (code: string) => {
		const requestUrl = createUrl("https://www.patreon.com/api/oauth2/token", {
			client_id: config.clientId,
			client_secret: config.clientSecret,
			code,
			grant_type: "authorization_code",
			redirect_uri: config.redirectUri
		});

		const request = new Request(requestUrl, {
			method: "POST"
		});
		const tokens = await handleRequest<{
			access_token: string;
			refresh_token?: string;
			expires_in: number;
		}>(request);

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token ?? null,
			accessTokenExpiresIn: tokens.expires_in
		};
	};

	const getProviderUser = async (accessToken: string) => {
		const requestUrl = createUrl(
			"https://www.patreon.com/api/oauth2/v2/identity",
			{
				"fields[user]":
					"about,email,full_name,hide_pledges,image_url,is_email_verified,url"
			}
		);
		const request = new Request(requestUrl, {
			headers: authorizationHeaders("bearer", accessToken)
		});
		const { data: patreonUser } = await handleRequest<{
			data: PatreonUser;
		}>(request);

		return [patreonUser.id, patreonUser] as const;
	};

	return provider(auth, {
		providerId: PROVIDER_ID,
		getAuthorizationUrl,
		getTokens,
		getProviderUser
	});
};

export type PatreonUser = {
	id: string;
	attributes: {
		about: string | null;
		created: string;
		email?: string;
		full_name: string;
		hide_pledges: boolean | null;
		image_url: string;
		is_email_verified: boolean;
		url: string;
	};
};
