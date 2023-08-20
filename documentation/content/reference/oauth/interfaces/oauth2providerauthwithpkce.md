---
title: "`OAuth2ProviderAuthWithPKCE`"
---

```ts
interface OAuth2ProviderAuthWithPKCE<_ProviderUserAuth extends ProviderUserAuth> {
	getAuthorizationUrl: () => Promise<
		readonly [url: URL, codeVerifier: string, state: string | null]
	>;
	validateCallback: (
		code: string,
		codeVerifier: string
	) => Promise<_ProviderUserAuth>;
};
```

##### Generics

| name                | extends                                                            | description                                           |
| ------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| `_ProviderUserAuth` | [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth) | [`validateCallback()`](#validatecallback) return type |

## `getAuthorizationUrl()`

Creates a new authorization url, optional with a state.

```ts
const getAuthorizationUrl: () => Promise<
	readonly [url: URL, codeVerifier: string, state: string | null]
>;
```

##### Returns

| name           | type             | description       |
| -------------- | ---------------- | ----------------- |
| `url`          | `URL`            | authorization url |
| `codeVerifier` | `string`         | code verifier     |
| `state`        | `string \| null` | state, if defined |

## `validateCallback()`

Validates the authorization code and code verifier, and returns a new [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth) instance.

```ts
const validateCallback: (
	code: string,
	codeVerifier: string
) => Promise<_ProviderUserAuth>;
```

##### Parameters

| name           | type     | description        |
| -------------- | -------- | ------------------ |
| `code`         | `string` | authorization code |
| `codeVerifier` | `string` | code verifier      |

##### Returns

| type                             |
| -------------------------------- |
| [`_ProviderUserAuth`](#generics) |
