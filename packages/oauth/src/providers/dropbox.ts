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

const PROVIDER_ID = "dropbox";

export const dropbox = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): DropboxAuth<_Auth> => {
	return new DropboxAuth(auth, config);
};

export class DropboxAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	DropboxUserAuth<_Auth>
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
			"https://www.dropbox.com/oauth2/authorize",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: ["account_info.read", ...scopeConfig]
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<DropboxUserAuth<_Auth>> => {
		const dropboxTokens = await this.validateAuthorizationCode(code);
		const dropboxUser = await getDropboxUser(dropboxTokens.accessToken);
		return new DropboxUserAuth(this.auth, dropboxUser, dropboxTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<DropboxTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token?: string;
		}>(code, "https://www.dropbox.com/oauth2/token", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				authenticateWith: "client_secret",
				clientSecret: this.config.clientSecret
			}
		});
		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in,
			refreshToken: tokens.refresh_token ?? null
		};
	};
}

export class DropboxUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public dropboxTokens: DropboxTokens;
	public dropboxUser: DropboxUser;

	constructor(
		auth: _Auth,
		dropboxUser: DropboxUser,
		dropboxTokens: DropboxTokens
	) {
		super(auth, PROVIDER_ID, dropboxUser.account_id);

		this.dropboxTokens = dropboxTokens;
		this.dropboxUser = dropboxUser;
	}
}

const getDropboxUser = async (accessToken: string): Promise<DropboxUser> => {
	const request = new Request(
		"https://api.dropboxapi.com/2/users/get_current_account",
		{
			headers: {
				Authorization: authorizationHeader("bearer", accessToken)
			}
		}
	);
	const dropboxUser = await handleRequest<DropboxUser>(request);
	return dropboxUser;
};

export type DropboxTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string | null;
};

export type DropboxUser = PairedDropBoxUser | UnpairedDropboxUser;

type PairedDropBoxUser = BaseDropboxUser & {
	is_paired: true;
	team: {
		id: string;
		name: string;
		office_addin_policy: Record<string, string>;
		sharing_policies: Record<string, Record<string, string>>;
	};
};

type UnpairedDropboxUser = BaseDropboxUser & {
	is_paired: false;
};

type BaseDropboxUser = {
	account_id: string;
	country: string;
	disabled: boolean;
	email: string;
	email_verified: boolean;

	locale: string;
	name: {
		abbreviated_name: string;
		display_name: string;
		familiar_name: string;
		given_name: string;
		surname: string;
	};
	profile_photo_url: string;
};
