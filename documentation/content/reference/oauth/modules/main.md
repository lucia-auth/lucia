---
title: "`@lucia-auth/oauth`"
---

## `createOAuth2AuthorizationUrl()`

Creates a new authorization url for OAuth 2.0 authorization code grant with a state. Use [`createOAuth2AuthorizationUrlWithPKCE()`](/reference/oauth/modules/main#createoauth2authorizationurlwithpkce) for creating urls with PKCE code challenge.

```ts
const createOAuth2AuthorizationUrl: (
	url: string | URL,
	options: {
		clientId: string;
		scope: string[];
		state?: string;
		redirectUri?: string;
		searchParams?: Record<string, string | undefined>;
	}
) => Promise<readonly [authorizationUrl: URL, state: string]>;
```

##### Parameters

| name               | type                                  | description                                    |
| ------------------ | ------------------------------------- | ---------------------------------------------- |
| `url`              | `string \| URL`                       | Authorization url base                         |
| `options.clientId` | `string`                              | `client_id`                                    |
| `options.scope`    | `string[]`                            | A list of values for `scope`                   |
| `state`            | `string`                              | Custom state                                   |
| `redirectUri`      | `string`                              | `redirect_uri`                                 |
| `searchParams`     | `Record<string, string \| undefined>` | Any additional search params to add to the url |

##### Returns

| name               | type     | description                 |
| ------------------ | -------- | --------------------------- |
| `authorizationUrl` | `URL`    | Authorization url           |
| `state`            | `string` | Generated or provided state |

## `createOAuth2AuthorizationUrlWithPKCE()`

Creates a new authorization url for OAuth 2.0 authorization code grant with a state and PKCE code challenge.

```ts
const createOAuth2AuthorizationUrlWithPKCE: (
	url: string | URL,
	options: {
		clientId: string;
		scope: string[];
		codeChallengeMethod: "S256";
		state?: string;
		redirectUri?: string;
		searchParams?: Record<string, string | undefined>;
	}
) => Promise<
	readonly [authorizationUrl: URL, state: string, codeVerifier: string]
>;
```

##### Parameters

| name                          | type                                  | description                                    |
| ----------------------------- | ------------------------------------- | ---------------------------------------------- |
| `url`                         | `string \| URL`                       | Authorization url base                         |
| `options.clientId`            | `string`                              | `client_id`                                    |
| `options.scope`               | `string[]`                            | A list of values for `scope`                   |
| `options.codeChallengeMethod` | `"S256"`                              | Code challenge method                          |
| `state`                       | `string`                              | Custom state                                   |
| `redirectUri`                 | `string`                              | `redirect_uri`                                 |
| `searchParams`                | `Record<string, string \| undefined>` | Any additional search params to add to the url |

##### Returns

| name               | type     | description                 |
| ------------------ | -------- | --------------------------- |
| `authorizationUrl` | `URL`    | Authorization url           |
| `state`            | `string` | Generated or provided state |
| `codeVerifier`     | `string` | Generated code verifier     |

## `decodeIdToken()`

Decodes the OpenID Connect Id Token and returns the claims. **Does NOT validate the JWT**. Throws `SyntaxError` if provided id token is invalid or malformed.

```ts
const decodeIdToken: <_Claims extends {}>(
	idToken: string
) => {
	iss: string;
	aud: string;
	exp: number;
} & _Claims;
```

##### Parameters

| name      | type     |
| --------- | -------- |
| `idToken` | `string` |

##### Generics

| name      | extends | description        |
| --------- | ------- | ------------------ |
| `_Claims` | `{}`    | JWT payload claims |

##### Returns

JWT payload.

## `OAuthRequestError`

See [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

## `providerUserAuth()`

Creates a new [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth).

```ts
const providerUserAuth: (
	auth: Auth,
	providerId: string,
	providerUserId: string
) => ProviderUserAuth;
```

##### Parameters

| name             | type                                       | description          |
| ---------------- | ------------------------------------------ | -------------------- |
| `auth`           | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance       |
| `providerId`     | `string`                                   | Key provider id      |
| `providerUserId` | `string`                                   | Key provider user id |

##### Returns

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |

## `validateOAuth2AuthorizationCode()`

Validates OAuth 2.0 authorization code by sending a request to the provided url. Returns the JSON-parsed response body.

```ts
const validateOAuth2AuthorizationCode: <_ResponseBody extends {}>(
	authorizationCode: string,
	url: string | URL,
	options: {
		clientId: string;
		redirectUri?: string;
		codeVerifier?: string;
		clientPassword?: {
			clientSecret: string;
			authenticateWith: "client_secret" | "http_basic_auth";
		};
	}
) => Promise<_ResponseBody>;
```

##### Parameters

| name                                      | type                      | description           |
| ----------------------------------------- | ------------------------- | --------------------- |
| `authorizationCode`                       | `string`                  | Authorization code    |
| `url`                                     | `URL \| string`           | Access token endpoint |
| `options.redirectUri`                     | `string`                  | `redirect_uri`        |
| `options.codeVerifier`                    | `string`                  | `code_verifier`       |
| `options.clientPassword`                  |                           |                       |
| `options.clientPassword.clientSecret`     | `string`                  | Client secret         |
| `options.clientPassword.authenticateWith` | `AuthenticateWithOptions` | See below             |

##### Generics

| name            | extends | description                               |
| --------------- | ------- | ----------------------------------------- |
| `_ResponseBody` | `{}`    | Response body of the access token request |

##### `AuthenticateWithOptions`

| value               | description                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| `"client_secret"`   | Send the client secret inside request body as `client_secret`                   |
| `"http_basic_auth"` | Send the client secret with the client id with HTTP Basic authentication scheme |
