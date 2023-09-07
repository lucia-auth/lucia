import { generateRandomString } from "lucia/utils";
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

const PROVIDER_ID = "slack";

export const slack = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): SlackAuth<_Auth> => {
	return new SlackAuth(auth, config);
};

export class SlackAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	SlackUserAuth<_Auth>
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
		const [url, state] = await createOAuth2AuthorizationUrl(
			"https://slack.com/openid/connect/authorize",
			{
				clientId: this.config.clientId,
				scope: ["oidc", "profile", ...scopeConfig],
				redirectUri: this.config.redirectUri
			}
		);
		url.searchParams.set("nonce", generateRandomString(40));
		return [url, state];
	};

	public validateCallback = async (
		code: string
	): Promise<SlackUserAuth<_Auth>> => {
		const slackTokens = await this.validateAuthorizationCode(code);
		const slackUserRequest = new Request(
			"https://slack.com/api/openid.connect.userInfo",
			{
				headers: {
					Authorization: authorizationHeader("bearer", slackTokens.accessToken)
				}
			}
		);
		const slackUser = await handleRequest<SlackUser>(slackUserRequest);
		return new SlackUserAuth(this.auth, slackUser, slackTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<SlackTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			id_token: string;
		}>(code, "https://slack.com/api/openid.connect.token", {
			clientId: this.config.clientId,
			clientPassword: {
				clientSecret: this.config.clientSecret,
				authenticateWith: "client_secret"
			}
		});
		return {
			accessToken: tokens.access_token,
			idToken: tokens.id_token
		};
	};
}

export class SlackUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	public slackTokens: SlackTokens;
	public slackUser: SlackUser;

	constructor(auth: _Auth, slackUser: SlackUser, slackTokens: SlackTokens) {
		super(auth, PROVIDER_ID, slackUser.sub);

		this.slackTokens = slackTokens;
		this.slackUser = slackUser;
	}
}

export type SlackTokens = {
	accessToken: string;
	idToken: string;
};

export type SlackUser = {
	sub: string;
	"https://slack.com/user_id": string;
	"https://slack.com/team_id": string;
	email?: string;
	email_verified: boolean;
	date_email_verified: number;
	name: string;
	picture: string;
	given_name: string;
	family_name: string;
	locale: string;
	"https://slack.com/team_name": string;
	"https://slack.com/team_domain": string;
	"https://slack.com/user_image_24": string;
	"https://slack.com/user_image_32": string;
	"https://slack.com/user_image_48": string;
	"https://slack.com/user_image_72": string;
	"https://slack.com/user_image_192": string;
	"https://slack.com/user_image_512": string;
	"https://slack.com/team_image_34": string;
	"https://slack.com/team_image_44": string;
	"https://slack.com/team_image_68": string;
	"https://slack.com/team_image_88": string;
	"https://slack.com/team_image_102": string;
	"https://slack.com/team_image_132": string;
	"https://slack.com/team_image_230": string;
	"https://slack.com/team_image_default": true;
};
