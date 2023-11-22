---
title: "Using bearer tokens"
---

Sending session ids as bearer tokens is useful when your frontend and backend is hosted on a different domain, such as certain single page applications, mobile apps, and desktop apps. Send the session ID in the authorization header, prefixed with `Bearer`.

```http
Authorization: Bearer <session_id>
```

## Using `AuthRequest`

You can create an [`AuthRequest`]() instance to interact with requests and responses in most frameworks. See [Handle requests]() page to learn how to initialize it.

```ts
const authRequest = auth.handleRequest(/* ... */);
```

### Validate requests

Use [`AuthRequest.validateBearerToken()`]() to validate the session ID sent as a bearer token.

```ts
const { session, user } = await authRequest.validateBearerToken();
```

## Using core APIs

Use [`Lucia.readBearerToken()`]() to parse the `Authorization` HTTP header.

```ts
const headers = new Headers();

const sessionId = auth.readBearerToken(headers.get("Authorization") ?? "");
if (!sessionId) {
	throw new Error("Missing session cookie");
}

const { session } = await auth.validateSession(sessionId);
```
