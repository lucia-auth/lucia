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
};

const PROVIDER_ID = "box";

export const box = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): BoxAuth<_Auth> => {
	return new BoxAuth(auth, config);
};

export class BoxAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	BoxUserAuth<_Auth>
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
			"https://account.box.com/api/oauth2/authorize",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: []
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<BoxUserAuth<_Auth>> => {
		const boxTokens = await this.validateAuthorizationCode(code);
		const boxUser = await getBoxUser(boxTokens.accessToken);
		return new BoxUserAuth(this.auth, boxUser, boxTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<BoxTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
		}>(code, "https://api.box.com/oauth2/token", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				authenticateWith: "client_secret",
				clientSecret: this.config.clientSecret
			}
		});
		return {
			accessToken: tokens.access_token
		};
	};
}

export class BoxUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public boxTokens: BoxTokens;
	public boxUser: BoxUser;

	constructor(auth: _Auth, boxUser: BoxUser, boxTokens: BoxTokens) {
		super(auth, PROVIDER_ID, boxUser.id.toString());

		this.boxTokens = boxTokens;
		this.boxUser = boxUser;
	}
}

const getBoxUser = async (accessToken: string): Promise<BoxUser> => {
	const request = new Request("https://api.box.com/2.0/users/me", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const boxUser = await handleRequest<BoxUser>(request);
	return boxUser;
};

export type BoxTokens = {
	accessToken: string;
};

export type BoxUser = {
	id: string;
	type: "user";
	address: string;
	avatar_url: string;
	can_see_managed_users: boolean;
	created_at: string;
	enterprise: {
		id: string;
		type: string;
		name: string;
	};
	external_app_user_id: string;
	hostname: string;
	is_exempt_from_device_limits: boolean;
	is_exempt_from_login_verification: boolean;
	is_external_collab_restricted: boolean;
	is_platform_access_only: boolean;
	is_sync_enabled: boolean;
	job_title: string;
	language: string;
	login: string;
	max_upload_size: number;
	modified_at: string;
	my_tags: [string];
	name: string;
	notification_email: {
		email: string;
		is_confirmed: boolean;
	};
	phone: string;
	role: string;
	space_amount: number;
	space_used: number;
	status:
		| "active"
		| "inactive"
		| "cannot_delete_edit"
		| "cannot_delete_edit_upload";
	timezone: string;
	tracking_codes: {
		type: string;
		name: string;
		value: string;
	}[];
};
