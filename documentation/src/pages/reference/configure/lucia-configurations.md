---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Lucia configurations"
---

Configurations for `lucia()`.

```ts
interface Configurations {
    adapter: Adapter;
    env: Env;
    generateCustomUserId?: () => Promise<string | null>;
    csrfProtection?: boolean;
    sessionTimeout?: number;
    idlePeriodTimeout?: number;
    transformUserData?: (userData: UserData) => Record<any, any>;
}
```

## Required

### `adapter`

An adapter for your database.

| type      | description        |
| --------- | ------------------ |
| `Adapter` | A database adapter |

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

### `generateCustomUserId`

A function that generates a random user id. The database will create its own user id if the returned value is `null`

| type                            | default            |
| ------------------------------- | ------------------ |
| `() => Promise<string \| null>` | `async () => null` |

### `idlePeriodTimeout`

The time in milliseconds the idle period lasts for - or the time since session expiration the user can continue without signing in again. The session can be renewed if the it's under `sessionTimeout + idlePeriodTimeout` since when issued.

| type     | default                              |
| -------- | ------------------------------------ |
| `number` | `1000 * 60 * 60 * 24 * 14` (2 weeks) |

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
