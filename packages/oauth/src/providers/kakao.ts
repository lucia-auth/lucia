import {
	createOAuth2AuthorizationUrl,
	OAuth2ProviderAuth,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { authorizationHeader, handleRequest } from "../utils/request.js";

import type { Auth } from "lucia";

type Config = {
	clientId: string;
	clientSecret: string; // Kakao doesn't require clientSecret but it's recommended to use it
	redirectUri: string;
	scope?: string[];
};

const PROVIDER_ID = "kakao";

export const kakao = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): KakaoAuth<_Auth> => {
	return new KakaoAuth(auth, config);
};

export class KakaoAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	KakaoUserAuth<_Auth>
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
			"https://kauth.kakao.com/oauth/authorize",
			{
				clientId: this.config.clientId,
				scope: this.config.scope ?? [],
				redirectUri: this.config.redirectUri
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<KakaoUserAuth<_Auth>> => {
		const kakaoTokens = await this.validateAuthorizationCode(code);
		const kakaoUser = await getKakaoUser(kakaoTokens.accessToken);
		return new KakaoUserAuth(this.auth, kakaoUser, kakaoTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<KakaoTokens> => {
		return await validateOAuth2AuthorizationCode<KakaoTokens>(
			code,
			"https://kauth.kakao.com/oauth/token",
			{
				clientId: this.config.clientId,
				clientPassword: {
					clientSecret: this.config.clientSecret,
					authenticateWith: "client_secret"
				}
			}
		);
	};
}

const getKakaoUser = async (accessToken: string): Promise<KakaoUser> => {
	const kakaoUserRequest = new Request("https://kapi.kakao.com/v2/user/me", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	return await handleRequest<KakaoUser>(kakaoUserRequest);
};

export class KakaoUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	public kakaoTokens: KakaoTokens;
	public kakaoUser: KakaoUser;

	constructor(auth: _Auth, kakaoUser: KakaoUser, kakaoTokens: KakaoTokens) {
		super(auth, PROVIDER_ID, kakaoUser.id.toString());

		this.kakaoTokens = kakaoTokens;
		this.kakaoUser = kakaoUser;
	}
}

export type KakaoTokens = {
	tokenType: string;
	accessToken: string;
	expiresIn: number;
	refreshToken: string;
	refreshTokenExpiresIn: number;
	scope?: string;
	idToken?: string;
};

export type KakaoUser = {
	id: number;
	has_signed_up?: boolean;
	connected_at?: string;
	synced_at?: string;
	properties?: Properties;
	kakao_account?: KakaoAccount;
	for_partner?: Partner;
};

type KakaoAccount = {
	profile_needs_agreement?: boolean;
	profile_nickname_needs_agreement?: boolean;
	profile_image_needs_agreement?: boolean;
	profile?: Profile;
	email_needs_agreement?: boolean;
	is_email_valid?: boolean;
	is_email_verified?: boolean;
	email?: string;
	name_needs_agreement?: boolean;
	name?: string;
	age_range_needs_agreement?: boolean;
	// "1~9, 10~14, 15~19, 20~29, 30~39, 40~49, 50~59, 60~69, 70~79, 80~89, 90~";
	ag_range?:
		| "1~9"
		| "10~14"
		| "15~19"
		| "20~29"
		| "30~39"
		| "40~49"
		| "50~59"
		| "60~69"
		| "70~79"
		| "80~89"
		| "90~";
	birthyear_needs_agreement?: boolean;
	birthyear?: string; // "YYYY";
	birthday_needs_agreement?: boolean;
	birthday?: string; // "MMDD";
	birthday_type?: "SOLAR" | "LUNAR";
	gender_needs_agreement?: boolean;
	gender?: "female" | "male";
	phone_number_needs_agreement?: boolean;
	phone_number?: string;
	ci_needs_agreement?: boolean;
	ci?: string;
	ci_authenticated_at?: string;
};

type Profile = {
	nickname?: string;
	thumbnail_image_url?: string;
	profile_image_url?: string;
	is_default_image?: boolean;
};

type Partner = {
	uuid?: string;
};

type Properties = {
	[key: string]: string;
};
