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
	serverUrl?: string;
};

const PROVIDER_ID = "gitlab";

export const gitlab = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): GitlabAuth<_Auth> => {
	return new GitlabAuth(auth, config);
};

export class GitlabAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	GitlabUserAuth<_Auth>
> {
	private config: Config;
	private readonly serverUrl: string;

	constructor(auth: _Auth, config: Config) {
		super(auth);

		this.config = config;
		this.serverUrl = config.serverUrl || "https://gitlab.com";
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, state: string]
	> => {
		const scopeConfig = this.config.scope ?? [];
		return await createOAuth2AuthorizationUrl(
			`${this.serverUrl}/oauth/authorize`,
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: ["read_user", ...scopeConfig]
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<GitlabUserAuth<_Auth>> => {
		const gitlabTokens = await this.validateAuthorizationCode(code);
		const gitlabUser = await getGitlabUser(
			gitlabTokens.accessToken,
			this.serverUrl
		);
		return new GitlabUserAuth(this.auth, gitlabUser, gitlabTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<GitlabTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
		}>(code, `${this.serverUrl}/oauth/token`, {
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
			refreshToken: tokens.refresh_token
		};
	};
}

export class GitlabUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public gitlabTokens: GitlabTokens;
	public gitlabUser: GitlabUser;

	constructor(auth: _Auth, gitlabUser: GitlabUser, gitlabTokens: GitlabTokens) {
		super(auth, PROVIDER_ID, gitlabUser.id.toString());

		this.gitlabTokens = gitlabTokens;
		this.gitlabUser = gitlabUser;
	}
}

const getGitlabUser = async (
	accessToken: string,
	serverUrl: string
): Promise<GitlabUser> => {
	const request = new Request(`${serverUrl}/api/v4/user`, {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const gitlabUser = await handleRequest<GitlabUser>(request);
	return gitlabUser;
};

export type GitlabTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
};

export type GitlabUser = {
	id: number;
	username: string;
	email: string;
	name: string;
	state: string;
	avatar_url: string;
	web_url: string;
	created_at: string;
	bio: string;
	public_email: string;
	skype: string;
	linkedin: string;
	twitter: string;
	discord: string;
	website_url: string;
	organization: string;
	job_title: string;
	pronouns: string;
	bot: boolean;
	work_information: string | null;
	followers: number;
	following: number;
	local_time: string;
	last_sign_in_at: string;
	confirmed_at: string;
	theme_id: number;
	last_activity_on: string;
	color_scheme_id: number;
	projects_limit: number;
	current_sign_in_at: string;
	identities: { provider: string; extern_uid: string }[];
	can_create_group: boolean;
	can_create_project: boolean;
	two_factor_enabled: boolean;
	external: boolean;
	private_profile: boolean;
	commit_email: string;
};
