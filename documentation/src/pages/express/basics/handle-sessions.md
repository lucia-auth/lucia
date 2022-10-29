---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Handle sessions"
---

Inside `app.locals`, Lucia provides a method to get, set, and clear the current session.

```ts
import express from "express";
import { auth } from "./lucia.js";

const app = express();

app.get("/", (_, res) => {
	const session = app.locals.getSession();
});
```

## Get session

[`getSession()`](/express/api-reference/locals-api) will return the validated session and `null` if the session is invalid.

```ts
app.get("/", (_, res) => {
	const session = app.locals.getSession();
});
```

## Set session

[`setSession()`](/express/api-reference/locals-api#setsession) will set the provided session to cookies.

```ts
app.get("/", (_, res) => {
	app.locals.setSession(session);
});
```

## Clear session

[`clearSession()`](/express/api-reference/locals-api#clearsession) method will remove all session cookies. This will **NOT** invalidate the provided session - when signing out a user, make sure to invalidate the session using [`invalidateSession()`](/reference/api/server-api#invalidatesession).

```ts
app.get("/", (_, res) => {
	app.locals.clearSession();
});
```
