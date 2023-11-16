---
title: "`OAuth2ProviderAuth`"
---

```ts
interface OAuth2ProviderAuth<_ProviderUserAuth extends ProviderUserAuth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string | null]>;
	validateCallback: (code: string) => Promise<_ProviderUserAuth>;
}
```

##### Generics

| name                | extends                                                            | description                                           |
| ------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| `_ProviderUserAuth` | [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth) | [`validateCallback()`](#validatecallback) return type |

## `getAuthorizationUrl()`

Creates a new authorization url, optional with a state.

```ts
const getAuthorizationUrl: () => Promise<readonly [url: URL, state: string | null]>;
```

##### Returns

| name    | type             | description       |
| ------- | ---------------- | ----------------- |
| `url`   | `URL`            | authorization url |
| `state` | `string \| null` | state, if defined |

## `validateCallback()`

Validates the authorization code and returns a new [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth) instance.

```ts
const validateCallback: (code: string) => Promise<_ProviderUserAuth>;
```

##### Parameters

| name   | type     | description        |
| ------ | -------- | ------------------ |
| `code` | `string` | authorization code |

##### Returns

| type                             |
| -------------------------------- |
| [`_ProviderUserAuth`](#generics) |
