---
title: "Using bearer tokens"
description: "Learn how to use bearer tokens with Lucia"
---

Sending session ids as bearer tokens is useful when your frontend and backend is hosted on a different domain, such as certain single page applications, mobile apps, and desktop apps. Bearer tokens are sent in the authorization header, prefixed with `Bearer`.

```http
Authorization: Bearer <session_id>
```

Some methods shown in this page is included in [`AuthRequest`](/reference/lucia/interfaces/authrequest), which is described in [Handle requests](/basics/handle-requests) page.

## Validate bearer tokens

You can use [`AuthRequest.validateBearerToken()`](/reference/lucia/interfaces/authrequest#validatebearertoken) to validate the bearer token. Since [`Auth.validateSession()`](/reference/lucia/interfaces/auth#validatesession) is used, idle sessions will be reset. It returns the validated session or `null` if the session is invalid.

```ts
const authRequest = auth.handleRequest();

const session = await authRequest.validateBearerToken();
if (session) {
	// valid request
}
```

CSRF protection is not included when validating bearer tokens.

### Read bearer tokens

You can get the session id from the authorization header using [`Auth.readBearerToken()`](/reference/lucia/interfaces/auth#readbearertoken), which returns a session id or `null` if the token does not exist. This _does not_ validate the session id.

```ts
const authorizationHeader = request.headers.get("Authorization");
const sessionId = auth.readBearerToken(authorizationHeader);
```

### Caching

`AuthRequest.validateBearerToken()` caches the request, so it will only run once no matter how many times you call it. This is useful when you have multiple pages/components the method can be called.

```ts
await authRequest.validateBearerToken();
await authRequest.validateBearerToken(); // uses cache from previous call
```

```ts
await Promise([
	authRequest.validateBearerToken(),
	authRequest.validateBearerToken() // waits for first call to resolve
]);
```

### Invalidation

After updating user attributes, for example, call [`AuthRequest.invalidate()`](/reference/lucia/interfaces/authrequest#invalidate) to invalidate internal cache so the next time you call `AuthRequest.validateBearerToken()`, it returns the latest user data.

```ts
await auth.updateUserAttributes(userId, {
	username: newUsername
});
authRequest.invalidate();

// returns latest user data
const session = await authRequest.validateBearerToken();
```
