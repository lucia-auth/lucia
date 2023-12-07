---
title: "Kakao OAuth provider"
description: "Learn how to use the Kakao OAuth provider"
---

OAuth integration for Kakao. Refer to [Prerequisites](https://developers.kakao.com/docs/latest/en/kakaologin/prerequisite) and [REST API docs for Kakao login](https://developers.kakao.com/docs/latest/en/kakaologin/rest-api) for getting the required credentials. Provider id is `kakao`.

```ts
import { kakao } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const kakaoAuth = kakao(auth, config);
```

## `kakao()`

```ts
const kakao: (
	auth: Auth,
	config: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => KakaoProvider;
```

##### Parameters

| name                  | type                                       | description                   | optional |
| --------------------- | ------------------------------------------ | ----------------------------- | :------: |
| `auth`                | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                |          |
| `config.clientId`     | `string`                                   | Kakao OAuth app client id     |          |
| `config.clientSecret` | `string`                                   | Kakao OAuth app client secret |          |
| `config.redirectUri`  | `string`                                   | an authorized redirect URI    |    ✓     |
| `config.scope`        | `string[]`                                 | an array of scopes            |    ✓     |

##### Returns

| type                              | description    |
| --------------------------------- | -------------- |
| [`KakaoProvider`](#kakaoprovider) | Kakao provider |

## Interfaces

### `KakaoAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<KakaoAuth<_Auth>>
interface KakaoAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<KakaoUserAuth<_Auth>>;
}
```

| type                              |
| --------------------------------- |
| [`KakaoUserAuth`](#kakaouserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `KakaoTokens`

```ts
type KakaoTokens = {
	accessToken: string;
	expiresIn: number;
	refreshToken: string;
	refreshTokenExpiresIn: number;
};
```

### `KakaoUser`

```ts
type KakaoUser = {
	id: number;
	has_signed_up?: boolean;
	connected_at?: string;
	synced_at?: string;
	properties?: Record<string, string>;
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
```

### `KakaoUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface KakaoUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	kakaoUser: KakaoUser;
	kakaoTokens: KakaoTokens;
}
```

| properties    | type                          | description       |
| ------------- | ----------------------------- | ----------------- |
| `kakaoUser`   | [`KakaoUser`](#kakaouser)     | Kakao user        |
| `kakaoTokens` | [`KakaoTokens`](#kakaotokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
