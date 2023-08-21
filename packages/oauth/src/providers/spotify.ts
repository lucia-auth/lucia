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
	scope?: string[];
};

const PROVIDER_ID = "spotify";

export const spotify = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): SpotifyAuth<_Auth> => {
	return new SpotifyAuth(auth, config);
};

export class SpotifyAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	SpotifyUserAuth<_Auth>
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
			"https://accounts.spotify.com/authorize",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: this.config.scope ?? []
			}
		);
	};
	
	public validateCallback = async (
		code: string
	): Promise<SpotifyUserAuth<_Auth>> => {
		const spotifyTokens = await this.validateAuthorizationCode(code);
		const spotifyUser = await getSpotifyUser(spotifyTokens.accessToken);
		return new SpotifyUserAuth(this.auth, spotifyUser, spotifyTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<SpotifyTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			token_type: string;
			scope: string;
			expires_in: number;
			refresh_token: string;
		}>(code, "https://accounts.spotify.com/api/token", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				clientSecret: this.config.clientSecret,
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
}

export class SpotifyUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public spotifyTokens: SpotifyTokens;
	public spotifyUser: SpotifyUser;

	constructor(
		auth: _Auth,
		spotifyUser: SpotifyUser,
		spotifyTokens: SpotifyTokens
	) {
		super(auth, PROVIDER_ID, spotifyUser.id);

		this.spotifyTokens = spotifyTokens;
		this.spotifyUser = spotifyUser;
	}
}

const getSpotifyUser = async (accessToken: string): Promise<SpotifyUser> => {
	// https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
	const request = new Request("https://api.spotify.com/v1/me", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	return handleRequest<SpotifyUser>(request);
};

export type SpotifyTokens = {
	accessToken: string;
	tokenType: string;
	scope: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
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
