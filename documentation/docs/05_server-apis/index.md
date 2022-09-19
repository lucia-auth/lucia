## Overview

These methods should only be imported and used in a server context (endpoints or server load functions). Can be imported from `lucia-sveltekit`.

```ts
import { lucia } from "lucia-sveltekit";
```

## Reference

### deleteAllCookies

Deletes all cookies set by Lucia.

```ts
const deleteAllCookies: (target: Cookies) => void;
```

### getUpdateData

For adapters. Removes all keys with a value of `undefined` (does not include `null`). Mutates input.

```ts
const getUpdateData: (target: Record<string, any>) => Record<string, any>;
```

### lucia

Creates a new [`Lucia`](/references/instances) instance. [Methods reference](/server-apis/lucia).

```ts
const lucia: (config: Configurations) => Lucia;
```

#### Example

```ts
const auth = lucia(configs);
```

### Error

An instance of [`LuciaError`](/references/instances#luciaerror).

#### Example

```ts
throw new LuciaError("LUCIA_INVALID_ACCESS_TOKEN");
```

### setCookie

Sets http cookie strings to SvelteKit's `cookies`. Can be used in endpoints, server load functions, and actions.

```ts
const setCookie: (
    target: Cookies,
    ...cookieStrings: string[] // http cookie strings
) => void;
```

#### Example

```ts
// +page.server.ts
import { auth } from "$lib/lucia";
import type { Actions } from "@sveltejs/kit";

export const actions: Actions = {
    default: async ({ cookies }) => {
        const userSession = await auth.createUser();
        setCookie(
            cookies,
            userSession.access_token.cookie(),
            userSession.access_token.cookie()
        );
        // ...
    },
};
```
