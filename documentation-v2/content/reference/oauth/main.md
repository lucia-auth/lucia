---
order: 0
title: "Main"
---

## `providerUserAuth()`

Creates a new [`ProviderUserAuth`]().

```ts
const providerUserAuth: (
	auth: Auth,
	providerId: string,
	providerUserId: string
) => ProviderUserAuth;
```

##### Parameters

| name             | type       | description          |
| ---------------- | ---------- | -------------------- |
| `auth`           | [`Auth`]() | Lucia instance       |
| `providerId`     | `string`   | Key provider id      |
| `providerUserId` | `string`   | Key provider user id |

##### Returns

| type                   |
| ---------------------- |
| [`ProviderUserAuth`]() |
