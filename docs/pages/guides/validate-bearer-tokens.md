---
title: "Validate bearer tokens"
---

# Validate bearer tokens

For apps that can't use cookies, store the session ID in localstorage and send it to the server as a bearer token.

```ts
fetch("https://api.example.com", {
	headers: {
		Authorization: `Bearer ${sessionId}`
	}
});
```

In the server, you can use [`Lucia.readBearerToken()`](/reference/main/Lucia/readBearerToken) to get the session ID from the authorization header and validate the session with [`Lucia.validateSession()`](/reference/main/Lucia/validateSession).

```ts
const authorizationHeader = request.headers.get("Authorization");
const sessionId = lucia.readBearerToken(authorizationHeader ?? "");
if (!sessionId) {
	return new Response(null, {
		status: 401
	});
}

const { session, user } = await lucia.validateSession(sessionId);
```
