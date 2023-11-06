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
	redirectUri: string;
};

const PROVIDER_ID = "discord";

export const discord = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): DiscordAuth<_Auth> => {
	return new DiscordAuth(auth, config);
};

export class DiscordAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	DiscordUserAuth<_Auth>
> {
	private config: Config;

	constructor(auth: _Auth, config: Config) {
		super(auth);

		this.config = config;
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, state: string]
	> => {
		const scopeConfig = this.config.scope ?? [];
		return await createOAuth2AuthorizationUrl(
			"https://discord.com/oauth2/authorize",
			{
				clientId: this.config.clientId,
				scope: ["identify", ...scopeConfig],
				redirectUri: this.config.redirectUri
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<DiscordUserAuth<_Auth>> => {
		const discordTokens = await this.validateAuthorizationCode(code);
		const discordUser = await getDiscordUser(discordTokens.accessToken);
		return new DiscordUserAuth(this.auth, discordUser, discordTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<DiscordTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
		}>(code, "https://discord.com/api/oauth2/token", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				clientSecret: this.config.clientSecret,
				authenticateWith: "client_secret"
			}
		});

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			accessTokenExpiresIn: tokens.expires_in
		};
	};
}

export class DiscordUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public discordTokens: DiscordTokens;
	public discordUser: DiscordUser;

	constructor(
		auth: _Auth,
		discordUser: DiscordUser,
		discordTokens: DiscordTokens
	) {
		super(auth, PROVIDER_ID, discordUser.id);

		this.discordTokens = discordTokens;
		this.discordUser = discordUser;
	}
}

const getDiscordUser = async (accessToken: string): Promise<DiscordUser> => {
	// do not use oauth/users/@me because it ignores intents, use oauth/users/@me instead
	const request = new Request("https://discord.com/api/users/@me", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const discordUser = await handleRequest<DiscordUser>(request);
	return discordUser;
};

export type DiscordTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: number;
};

export type DiscordUser = {
	id: string;
	username: string;
	discriminator: string;
	global_name: string | null;
	avatar: string | null;
	bot?: boolean;
	system?: boolean;
	mfa_enabled?: boolean;
	verified?: boolean;
	email?: string | null;
	flags?: number;
	banner?: string | null;
	accent_color?: number | null;
	premium_type?: number;
	public_flags?: number;
	locale?: string;
	avatar_decoration?: string | null;
};
