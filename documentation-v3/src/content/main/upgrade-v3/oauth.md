---
title: "Upgrade OAuth setup to v3"
---


## Update database

You can continue using the keys table but recommend creating a dedicated table for storing OAuth accounts, as shown in the database migration guides.

## Replace OAuth integration

The OAuth integration has been replaced with [`arctic`](), which provides everything the integration did without Lucia specific APIs. It supports all the OAuth providers that the integration supported.

```
npm install arctic
```

You can initialize the providers without passing the Lucia instance.

```ts
import { GitHub } from "arctic";

export const githubAuth = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET);
export const googleAuth = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	"http://localhost:3000/login/github/callback"
);
```

## Create authorization URL

`createAuthorizationURL()` replaces `getAuthorizationUrl()`. State and code verifier must generated on your side.

```ts
import { generateState, generateCodeVerifier } from "arctic";

// generate state
const state = generateState();

// pass state (and code verifier for PKCE)
// returns the authorization url only
const authorizationURL = await githubAuth.createAuthorizationURL(state);

setCookie("github_oauth_state", state, {
	secure: true, // set to false in localhost
	path: "/",
	httpOnly: true,
	maxAge: 60 * 10 // 10 min
});

// redirect to authorization url
```

## Validate callback

The `state` check stays the same.

`validateAuthorizationCode()` replaces `validateCallback()`. Instead of returning tokens, users, and database methods, it just returns tokens. Use the access token to get the user, check if the user is already registered, and create a new user if not.

You now have to create users and manage OAuth accounts by yourself.

```ts
import { generateId } from "lucia";

// check for state
// ...

// only returns tokens
const tokens = await githubAuth.validateAuthorizationCode(code);

// use the access token to get the user
const githubUser = await githubAuth.getUser(tokens.accessToken);

// manually check instead of using `getExistingUser()`
const existingUser = await db.table("user").where("github_id", "=", githubUser.id).get();

if (existingUser) {
	// simplified `createSession()` - seconds params for session attributes
	const session = await auth.createSession(existingUser.id, {});
	// `createSessionCookie()` now takes a session ID instead of the entire session object
	const sessionCookie = auth.createSessionCookie(session.id);
	// set session cookie as usual (using `Response` as example)
	return new Response(null, {
		status: 302,
		headers: {
			Location: "/",
			"Set-Cookie": sessionCookie.serialize()
		}
	});
}

// v2 IDs have length of 15
const userId = generateId(15);
// create user manually
await db.table("user").insert({
	id: userId,
	username: github.login,
	github_id: github.id
});

// simplified `createSession()` - seconds params for session attributes
const session = await auth.createSession(userId, {});
// `createSessionCookie()` now takes a session ID instead of the entire session object
const sessionCookie = auth.createSessionCookie(session.id);
// set session cookie as usual (using `Response` as example)
return new Response(null, {
	status: 302,
	headers: {
		Location: "/",
		"Set-Cookie": sessionCookie.serialize()
	}
});
```

### Error handling

Error handling has improved with v3. `validateAuthorizationCode()` throws `OAuth2RequestError`, which includes proper error messages and descriptions.

```ts
try {
	const tokens = await githubAuth.validateAuthorizationCode(code);
	// ...
} catch (e) {
	console.log(e);
	if (e instanceof OAuth2RequestError) {
		// bad verification code, invalid credentials, etc
		return new Response(null, {
			status: 400
		});
	}
	return new Response(null, {
		status: 500
	});
}
```
