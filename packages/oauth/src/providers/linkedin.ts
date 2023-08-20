import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import {
	handleRequest,
	authorizationHeader,
	createUrl
} from "../utils/request.js";

import type { Auth } from "lucia";

const PROVIDER_ID = "linkedin";

type Config = {
	clientId: string;
	clientSecret: string;
	scope?: string[];
	redirectUri: string;
};

export const linkedin = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): LinkedinAuth<_Auth> => {
	return new LinkedinAuth(auth, config);
};

export class LinkedinAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	LinkedinUserAuth<_Auth>
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
			"https://www.linkedin.com/oauth/v2/authorization",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: ["r_liteprofile", ...scopeConfig]
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<LinkedinUserAuth<_Auth>> => {
		const linkedinTokens = await this.validateAuthorizationCode(code);
		const linkedinUser = await getLinkedinUser(linkedinTokens.accessToken);
		return new LinkedinUserAuth(this.auth, linkedinUser, linkedinTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<LinkedinTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
			refresh_token_expires_in: number;
			scope: string;
		}>(code, "https://www.linkedin.com/oauth/v2/accessToken", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				clientSecret: this.config.clientSecret,
				authenticateWith: "client_secret"
			}
		});

		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in,
			refreshToken: tokens.refresh_token,
			refreshTokenExpiresIn: tokens.refresh_token_expires_in,
			scope: tokens.scope
		};
	};
}

export class LinkedinUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public linkedinTokens: LinkedinTokens;
	public linkedinUser: LinkedinUser;

	constructor(
		auth: _Auth,
		linkedinUser: LinkedinUser,
		linkedinTokens: LinkedinTokens
	) {
		super(auth, PROVIDER_ID, linkedinUser.id);

		this.linkedinTokens = linkedinTokens;
		this.linkedinUser = linkedinUser;
	}
}

const getLinkedinUser = async (accessToken: string): Promise<LinkedinUser> => {
	const linkedinUserProfile = await getProfile(accessToken);
	const displayImageElement = linkedinUserProfile.profilePicture[
		"displayImage~"
	]?.elements
		?.slice(-1)
		?.pop();
	const linkedinUser: LinkedinUser = {
		id: linkedinUserProfile.id,
		firstName: linkedinUserProfile.localizedFirstName,
		lastName: linkedinUserProfile.localizedLastName,
		profilePicture: displayImageElement?.identifiers?.pop()?.identifier
	};

	return linkedinUser;
};

const getProfile = async (
	accessToken: string
): Promise<LinkedinProfileResponse> => {
	const requestUrl = createUrl("https://api.linkedin.com/v2/me", {
		projection:
			"(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))"
	});
	const request = new Request(requestUrl, {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	return handleRequest<LinkedinProfileResponse>(request);
};

export type LinkedinTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
	refreshTokenExpiresIn: number;
	scope: string;
};

type LinkedinProfileResponse = {
	id: string;
	localizedFirstName: string;
	localizedLastName: string;
	profilePicture: {
		"displayImage~"?: {
			elements?: Array<{
				identifiers?: Array<{
					identifier?: string;
				}>;
			}>;
		};
	};
};

export type LinkedinUser = {
	id: string;
	firstName: string;
	lastName: string;
	profilePicture?: string;
};
