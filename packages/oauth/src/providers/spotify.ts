import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { providerUserAuth } from "../core.js";
import { scope, generateState, encodeBase64 } from "../utils.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
	showDialog: boolean;
};

const PROVIDER_ID = "spotify";

export const spotify = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getSpotifyTokens = async (code: string) => {
		const request = new Request("https://accounts.spotify.com/api/token", {
			method: "POST",
			body: new URLSearchParams({
				code,
				grant_type: "authorization_code",
				redirect_uri: config.redirectUri
			}).toString(),
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				...authorizationHeaders(
					"basic",
					encodeBase64(`${config.clientId}:${config.clientSecret}`)
				)
			}
		});
		const tokens = await handleRequest<{
			access_token: string;
			token_type: string;
			scope: string;
			expires_in: number;
			refresh_token: string;
		}>(request);

		return {
			accessToken: tokens.access_token,
			tokenType: tokens.token_type,
			scope: tokens.scope,
			accessTokenExpiresIn: tokens.expires_in,
			refreshToken: tokens.refresh_token
		};
	};

	const getSpotifyUser = async (accessToken: string) => {
		// https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
		const request = new Request("https://api.spotify.com/v1/me", {
			headers: {
				...authorizationHeaders("bearer", accessToken)
			}
		});
		return handleRequest<SpotifyUser>(request);
	};

	return {
		getAuthorizationUrl: async () => {
			const state = generateState();

			const url = createUrl("https://accounts.spotify.com/authorize", {
				client_id: config.clientId,
				response_type: "code",
				redirect_uri: config.redirectUri,
				scope: scope([], config.scope),
				state,
				show_dialog: config.showDialog.toString()
			});

			return [url, state] as const;
		},
		validateCallback: async (code: string) => {
			const spotifyTokens = await getSpotifyTokens(code);
			const spotifyUser = await getSpotifyUser(spotifyTokens.accessToken);
			const providerUserId = spotifyUser.id;
			const spotifyUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...spotifyUserAuth,
				spotifyUser,
				spotifyTokens
			};
		}
	} as const satisfies OAuthProvider;
};

export type SpotifyUser = {
	country?: string;
	display_name: string | null;
	email?: string;
	explicit_content: {
		filter_enabled?: boolean;
		filter_locked?: boolean;
	};
	external_urls: {
		spotify: string;
	};
	followers: {
		href: string | null;
		total: number;
	};
	href: string;
	id: string;
	images: [
		{
			url: string;
			height: number | null;
			width: number | null;
		}
	];
	product?: string;
	type: string;
	uri: string;
};
