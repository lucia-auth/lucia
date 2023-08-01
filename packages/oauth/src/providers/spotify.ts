import {
	createOAuth2AuthorizationUrl,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core.js";
import { handleRequest, authorizationHeader } from "../request.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
	showDialog: boolean;
};

const PROVIDER_ID = "spotify";

export const spotify = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getSpotifyTokens = async (code: string) => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			token_type: string;
			scope: string;
			expires_in: number;
			refresh_token: string;
		}>(code, "https://accounts.spotify.com/api/token", {
			clientId: config.clientId,
			redirectUri: config.redirectUri,
			clientPassword: {
				clientSecret: config.clientSecret,
				authenticateWith: "http_basic_auth"
			}
		});

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
				Authorization: authorizationHeader("bearer", accessToken)
			}
		});
		return handleRequest<SpotifyUser>(request);
	};

	return {
		getAuthorizationUrl: async () => {
			return await createOAuth2AuthorizationUrl(
				"https://accounts.spotify.com/authorize",
				{
					clientId: config.clientId,
					redirectUri: config.redirectUri,
					scope: config.scope ?? [],
					searchParams: {
						show_dialog: config.showDialog.toString()
					}
				}
			);
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
