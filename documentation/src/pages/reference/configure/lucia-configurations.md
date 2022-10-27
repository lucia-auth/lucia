---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Lucia configurations"
---

Configurations for `lucia()`.

```ts
interface Configurations {
	adapter:
		| Adapter
		| {
				user: UserAdapter;
				session: SessionAdapter;
		  };
	env: Env;
	csrfProtection?: boolean;
	deleteCookieOptions?: CookieOption[];
	generateCustomUserId?: () => Promise<string | null>;
	idlePeriodTimeout?: number;
	sessionCookieOptions?: CookieOption[];
	sessionTimeout?: number;
	transformUserData?: (userData: UserData) => Record<any, any>;
}
```

```ts
type CookieOption = {
	sameSite?: "strict" | "lax";
	path?: string;
	domain?: string;
};
```

## Required

### `adapter`

An adapter for your database. If you're using a single database:

| type      | description        |
| --------- | ------------------ |
| `Adapter` | A database adapter |

or, if you're using a different adapter for `user` and `session` table. A normal `Adapter` can be used for both `adapter.user` and `adapter.session`

| name            | type                                                            | description                                                              |
| --------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| adapter.user    | [`UserAdapter`](/reference/types/lucia-types#useradapter)       | An adapter for the database that stores users - usually a normal adapter |
| adapter.session | [`SessionAdapter`](/reference/types/lucia-types#sessionadapter) | An adapter for the database that stores sessions                         |

### `env`

Tells Lucia if the app is running on HTTP or HTTPS.

| type              | description                                                |
| ----------------- | ---------------------------------------------------------- |
| `"DEV" \| "PROD"` | `"DEV"` if the app is hosted on HTTP, `"PROD"` if on HTTPS |

#### Example

```ts
import { dev } from "$app/environment";

const env = dev ? "DEV" : "PROD";
```

## Optional

### `csrfProtection`

Checks if the request is from a trusted origin (where the app is hosted) in [`parseRequest`](/reference/api/server-api#parserequest) and [`validateRequest`](/reference/api/server-api#validaterequest). If you set this to `false`, make sure to add your own CSRF protection.

| type      | default |
| --------- | ------- |
| `boolean` | `true`  |

### `deleteCookieOptions`

A list of additional cookie options to [`sessionCookieOptions`](/reference/configure/lucia-configurations#sessioncookieoptions) for deleting session cookie(s).

| type             | default |
| ---------------- | ------- |
| `CookieOption[]` | `[]`    |

### `generateCustomUserId`

A function that generates a random user id. The database will create its own user id if the returned value is `null`

| type                            | default            |
| ------------------------------- | ------------------ |
| `() => Promise<string \| null>` | `async () => null` |

### `idlePeriodTimeout`

The time in milliseconds the idle period lasts for - or the time since session expiration the user can continue without signing in again. The session can be renewed if it's under `sessionTimeout + idlePeriodTimeout` since when issued.

| type     | default                              |
| -------- | ------------------------------------ |
| `number` | `1000 * 60 * 60 * 24 * 14` (2 weeks) |

### `sessionCookieOptions`

A list of cookie options for setting session cookie(s). Beware that setting the domain without a domain without a subdomain will make the cookie available to **_all_** subdomains, which is a major security issue. Some options cannot be configured for security reasons.

| type             | default                            |
| ---------------- | ---------------------------------- |
| `CookieOption[]` | `[{ sameSite: "lax", path: "/" }]` |

### `sessionTimeout`

The time in milliseconds the active period lasts for.

| type     | default                          |
| -------- | -------------------------------- |
| `number` | `1000 * 60 * 60 * 24` (24 hours) |

### `transformUserData()`

This will be called to transform the raw data from `user` table to the `User` object.

| type                                                                                    | default                          |
| --------------------------------------------------------------------------------------- | -------------------------------- |
| `(userData: `[`UserData`](/reference/types/lucia-types#userdata)`) => Record<any, any>` | `async () => { userId: string }` |
