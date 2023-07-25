---
order: 0
title: "Main"
---

## `OAuthRequestError`

See [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

```ts
import { OAuthRequestError } from "@lucia-auth/oauth";
```

##### Example

```ts
try {
	// ...
} catch (e) {
	if (e instanceof OAuthRequestError) {
		// ...
	}
}
```

## `providerUserAuth()`

Creates a new [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth).

```ts
import { providerUserAuth } from "@lucia-auth/oauth";
```

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
