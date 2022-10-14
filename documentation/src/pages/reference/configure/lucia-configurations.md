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

The database will create its own user id if the returned value is `null`

| type                            | description                                | default            |
| ------------------------------- | ------------------------------------------ | ------------------ |
| `() => Promise<string \| null>` | A function that generates a random user id | `async () => null` |
