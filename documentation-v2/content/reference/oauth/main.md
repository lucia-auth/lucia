---
order: 0
title: "Main"
---

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
