---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Handle sessions"
---

Inside `app.locals`, Lucia provides a method to get, set, and clear the current session.

```ts
import express from "express";
const app = express();

app.get("/", () => {
	const session = app.locals.getSession();
});
```

## Get session

[`getSession()`](/express/api-reference/locals-api) will validate the request and return the session if authenticated or `null` if not. It will also attempt to renew the session and return the new session if it succeeds.

```ts
import express from "express";
const app = express();

app.get("/", () => {
	const session = app.locals.getSession();
});
```

## Set session

[`setSession()`](/express/api-reference/locals-api#setsession) will set the cookie of the provided session.

```ts
import express from "express";
const app = express();

app.get("/", () => {
	app.locals.setSession(session);
});
```

## Clear session

[`clearSession()`](/express/api-reference/locals-api#clearsession) method will remove all session cookies stored to the user. This will **NOT** invalidate the provided session - when signing out a user, make sure to invalidate the session using [`invalidateSession()`](/reference/api/server-api#invalidatesession).

```ts
import express from "express";
const app = express();

app.get("/", () => {
	app.locals.clearSession();
});
```
