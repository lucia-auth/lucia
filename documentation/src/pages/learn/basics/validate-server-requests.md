---
order: 4
layout: "@layouts/DocumentLayout.astro"
title: "Validate server requests"
---

To validate a request, you'll have to read the access token and validate it. This page is for: Actions, standalone endpoints, and server load functions (ie. for +page.server.ts and +server.ts files). For getting the current user in a load function or in the client, refer to [Get current user in the client](/learn/basics/get-current-user-in-the-client).

## Validate requests

The easiest way is to use the `validateRequest()` method. This returns the current session (not the user) from the access token.

```ts
import { auth } from "$lib/server/lucia";

await auth.validateRequest(request);
```

## Validate requests using access tokens

Alternatively, you can get the access token from the request and validate the token. Using this method allows you to directly get the user from the token.

### Get access token from request

`parseRequest()` method will return both the access token and refresh token from the provided request. Note that this method does not check the validity of the tokens. The tokens' value will be an empty string if the cookie does not exist. This method will also check if the request is coming from a trusted domain (the domain as where the app is)

```ts
import { auth } from "$lib/server/lucia";

const { accessToken, refreshToken } = await auth.parseRequest(request);
```

### Get current session

```ts
import { auth } from "$lib/server/lucia";

const session = await auth.getSession(request);
```

### Get current user

```ts
import { auth } from "$lib/server/lucia";

const user = await auth.getSessionUser(request);
```

## Example

The following example uses server load functions. However, the same code can be used for actions and standalone endpoints (+server.ts).

### Validate requests

```ts
// +page.server.ts
import { auth } from "$lib/server/lucia";
import type { ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async ({ request }) => {
    try {
        const session = await auth.validateRequest(request);
    } catch {
        // invalid
    }
};
```

### Validate requests and get the user

```ts
// +page.server.ts
import { auth } from "$lib/server/lucia";
import type { ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async ({ request }) => {
    try {
        const { accessToken } = await auth.parseRequest(request);
        const user = await auth.getSessionUser(accessToken);
    } catch {
        // invalid token
    }
};
```
