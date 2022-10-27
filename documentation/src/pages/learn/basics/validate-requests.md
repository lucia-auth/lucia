---
order: 4
layout: "@layouts/DocumentLayout.astro"
title: "Validate requests"
---

The easiest way to validate requests is to use [`validateRequest()`](/reference/api/server-api#validaterequest) method. This method does a few things:

- Parse the request and get the session cookie
- If [`csrfProtection`](/reference/configure/lucia-configurations#csrfprotection) configuration is enabled, check if the domain of the origin url and url matches
- Validates the session cookie
- If it fails to validate it, attempts to renew the session
- On session renewal, remove any dead sessions from the database

## Validate requests

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.validateRequest(request);
} catch {
	// invalid session
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
