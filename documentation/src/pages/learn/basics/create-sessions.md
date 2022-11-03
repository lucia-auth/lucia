---
order: 3
layout: "@layouts/DocumentLayout.astro"
title: "Create Sessions"
---

A new session can be created using [`createSession()`](/reference/api/server-api#createsession) method, which takes a user id. After creating a new session, the cookie of the session (generated using [`createSessionCookies()`](/reference/api/server-api#createsessioncookies)) should be stored to the user.

```ts
import { auth } from "./lucia.js";

const session = await auth.createSession("userId");
```

## Create a new session

```ts
import { auth } from "./lucia.js";

try {
	const session = await auth.createSession("123456");
} catch {
	// invalid user id
}
```

## Store the tokens as cookies

The session id should be manually stored as a cookie. An array of serialized cookies can be generated using [`createSessionCookies()`](/reference/api/server-api#createsessioncookies) method.

```ts
import { auth } from "./lucia.js";

const session = await auth.createSession("123456");
const sessionCookies = await auth.createSessionCookies(session); // string[]
```
