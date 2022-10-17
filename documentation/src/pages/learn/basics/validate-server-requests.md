---
order: 4
layout: "@layouts/DocumentLayout.astro"
title: "Validate server requests"
---

This page is for: Actions, standalone endpoints, and server load functions (ie. for +page.server.ts and +server.ts files). To get the current user in a normal load function refer to [Get current user in load functions](/learn/basics/get-current-user-in-load-functions). To get the current user in the client, refer to [Get current user in the client](/learn/basics/get-current-user-in-the-client).

## Validate requests

The easiest way to validate requests is to use the [`validateRequest()`](/reference/api/server-api#validaterequest) method. This validates the session cookie and returns the current session (not the user).

```ts
import { auth } from "$lib/server/lucia";

await auth.validateRequest(request);
```

## Validate requests using session id

Alternatively, you can get the session id from the request and validate it independently. Using this method allows you to directly get the user from the token as well.

### Get session id from request

[`parseRequest()`](/reference/api/server-api#parserequest) method will read the cookies and return the session id. Note that this method does not check the validity of the session id, and the returned value will be an empty string if the cookie does not exist. This method will also check if the request is coming from a trusted domain (the domain as where the app is hosted).

```ts
import { auth } from "$lib/server/lucia";

try {
    const sessionId = await auth.parseRequest(request);
} catch {
    // invalid request
}
```

### Get current session

Use [`validateSession()`](/reference/api/server-api#validatesession) to validate and get the session.

```ts
import { auth } from "$lib/server/lucia";

try {
    const session = await auth.validateSession(sessionId);
} catch {
    // invalid session id
}
```

### Get current user

Use [`getSessionUser()`](/reference/api/server-api#getsessionuser) to get the session and user from the session id.

```ts
import { auth } from "$lib/server/lucia";

try {
    const { user, session } = await auth.getSessionUser(sessionId);
} catch {
    // invalid session id
}
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
        const sessionId = await auth.parseRequest(request);
        const { user } = await auth.getSessionUser(sessionId);
    } catch {
        // invalid token
    }
};
```
