---
order: 0
title: "Main"
---

## `createKeyId()`

Creates key id ([`KeySchema.id`](/reference/lucia/interfaces#keyschema)).

```ts
const createKeyId: (providerId: string, providerUserId: string) => string;
```

##### Parameters

| name             | type     | description          |
| ---------------- | -------- | -------------------- |
| `providerId`     | `string` | Key provider id      |
| `providerUserId` | `string` | Key provider user id |

##### Returns

| type     | description |
| -------- | ----------- |
| `string` | Key id      |

## `DEFAULT_SESSION_COOKIE_NAME`

Default session cookie name.

```ts
import { DEFAULT_SESSION_COOKIE_NAME } from "lucia";
```

```ts
const DEFAULT_SESSION_COOKIE_NAME = "auth_session";
```

## `lucia()`

Initialize Lucia and create a new [`Auth`](/reference/lucia/interfaces/auth) instance.

```ts
import { lucia } from "lucia";
```

```ts
const lucia: (config: Configuration) => Auth;
```

##### Parameters

| name     | type                                     | description         |
| -------- | ---------------------------------------- | ------------------- |
| `config` | [`Configuration`](/basics/configuration) | Lucia configuration |

##### Returns

| type                                       |
| ------------------------------------------ |
| [`Auth`](/reference/lucia/interfaces/auth) |

## `LuciaError()`

Error class thrown by Lucia. See reference for [`LuciaError`](/reference/lucia/main#luciaerror).

```ts
import { LuciaError } from "lucia";
```

##### Example

```ts
try {
	// ...
} catch (e) {
	if (e instanceof LuciaError) {
		// Lucia error
	}
}
```
