---
order: 4
layout: "@layouts/DocumentLayout.astro"
title: "Validate requests"
---

The easiest way to validate requests is to use [`validateRequest()`](/reference/api/server-api#validaterequest) method. This method does a few things:

- Parse the request and get the session cookie
- If [`csrfProtection`](/reference/configure/lucia-configurations#csrfprotection) configuration is enabled, check if the domain of the origin url and url matches
- Validates the session cookie
- If it fails to validate it, attempts to renew the session and stores the session cookie
- On session renewal, removes any dead sessions from the database and removes all session cookies

Keep in mind that if you're using one of the framework integration library, it provides an easier to get the current session and user. The parameter `request` is the standard fetch [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request), which may be different from the request object in some frameworks (namely Next.js and Express) - the integration libraries handles the conversion.

## Validate requests

`setSession` is a a function that takes in a stringified cookie that will be called to call to store cookies.

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.validateRequest(request, setSession);
} catch {
	// invalid session
}
```

#### Example

```ts
try {
	let sessionCookie = "";
	const session = await auth.validateRequest(request, (stringifiedCookie) => {
		sessionCookie = stringifiedCookie;
	});
	const response = new Response();
	response.headers.append("set-cookie", sessionCookie);
	return response;
} catch {
	// invalid session
}
```

### Validate requests and get the user

The [`getSessionUserFromRequest()`](/reference/api/server-api#getsessionuserfromrequest) method is similar to `validateRequest()`, but will return both the session and the user without an additional database call.

```ts
import { auth } from "./lucia.js";

try {
	const { session, user } = await auth.getSessionUserFromRequest(request);
} catch (e) {
	// invalid request
}
```

## Manually validate requests

### Get the session id from the request

The `parseRequest()` can be used to extract the session cookie from the request. If will also check if the domain of the origin url and url matches if `csrfProtection` configuration is enabled. The returned value is an empty string if the session cookie does not exist.

```ts
import { auth } from "./lucia.js";

try {
	const sessionId = auth.parseRequest(request);
} catch (e) {
	// invalid request
}
```

### Validate the session id

The [`validateSession()`](/reference/api/server-api#validatesession) method can be used to validate the session id. This method will **not** attempt to renew the session if the provided one is invalid.

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.validateSession(sessionId);
} catch (e) {
	// invalid session id
}
```
