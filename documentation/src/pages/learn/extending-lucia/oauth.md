---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "OAuth"
---

The main steps of authenticating users with OAuth + Lucia are:

1. Redirect user to the OAuth provider's login page
2. Provider redirects to your callback endpoint
3. Validate the token sent with the callback
4. Get the user's data from provider
5. Check if the user exists in Lucia
6. If it exists, authenticate the user
7. If it doesn't, create a new user
8. Create a new session

While this guide will use Github as an example, the main steps of OAuth are the same. Link to [Github's OAuth guide](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps).

## 1. Register an OAuth app with the provider

The first step is to create an OAuth app with the provider. You will need to provide a callback url that the user will be redirected to on sign in, and you'll get the id and secret of your app.

## 2. Sign in the user with the provider

Redirect the user to the provider's login page. For Github, it's `https://github.com/login/oauth/authorize`.

```svelte
<a href="https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}"
	>Sign in with Github</a
>
```

## 3. Handle the callback

Once a user sign ins with the provider, it will redirect the user to the callback url of the app. This callback request will be handled by `handleCallback()`:

```ts
export const handleCallback = async (request: Request) => {};
```

## 4. Validate the request and get the user

Within the callback, the provider has included a secret code. This code can be used to validate that the request came from the provider and not a random guy. It will also return an access token that can be used with the provider's APIs. For Github, it's in the `code` url query parameter, and this code should be sent to `https://github.com/login/oauth/access_token` to validate it. This will return the user's access token.

```ts
export const handleCallback = async (request: Request) => {
	const code = request.url.searchParams.get("code");
	const response = await fetch("https://github.com/login/oauth/access_token", {
		body: JSON.stringify({
			client_id: GITHUB_CLIENT_ID,
			client_secret: GITHUB_CLIENT_SECRET,
			code
		}),
		headers: {
			Accept: "application/json"
		},
		method: "POST"
	});
	if (!response.ok) {
		// error - return error response
	}
	const result = (await response.json()) as {
		access_token: string;
	};
	const accessToken = result.access_token;
};
```

## 5. Get the user's unique identifier

To create users using Lucia, you need an identifier as part of the provider id. This is something unique to the user. For Github, this can be the user's Github user id. To get the user connected to the access token, call `https://api.github.com/user` using the access token.

```ts
export const handleCallback = async (request: Request) => {
	// ...
	const accessToken = result.access_token;
	const githubUserResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
	const githubUser = (await githubUserResponse.json()) as {
		id: string;
	};
	const githubUserId = githubUser.id;
};
```

## 6. Create a new user

Now you know who signed in and a unique identifier of them, you can create a new user using it. The provider name will be `github` and the identifier will be the user's Github user id. We don't have to set a password since we know for sure who the user is (via Github) when creating a new session

```ts
import { auth } from "./lucia.js";

export const handleCallback = async (request: Request) => {
	// ...
	const githubUserId = user.id;
	try {
		const user = await auth.createUser("github", githubUserId);
	} catch {
		// error
	}
};
```

## 7. Check if the user already exists

Since the authentication steps are the same for new and existing users (sign in with Github), and [`createUser()`](/reference/api/server-api#createuser) will throw an error if provider id is already used, we'll have to check if the user exists before creating a user. We can get the user from the provider id using [`getUserByProviderId()`](/reference/api/server-api#getuserbyproviderid).

```ts
import type { User } from "lucia-auth";

export const handleCallback = async (request: Request) => {
	// ...
	const githubUserId = user.id;
	let user: User;
	try {
		user = await auth.getUserByProviderId("github", userId);
	} catch {
		// user does not exist
		try {
			user = await auth.createUser("github", githubUserId);
		} catch {
			// error - return error response
		}
	}
};
```

## 8. Create a new session

Finally, we can create a new session using [`createSession()`](/reference/api/server-api#createsession) and store it as a cookie using [`setSession`](/reference/api/locals-api#setsession).

```ts
export const handleCallback = async (request: Request) => {
	// ...
	let user: User;
	// ...
	try {
		const session = await auth.createSession(user.userId);
		const serializedSessionCookies = auth.createSessionCookies(session);
		return new Response(null, {
			headers: {
				"set-cookie": serializedSessionCookies.join()
			}
		});
	} catch {
		// error - return error response
	}
	// success - redirect user
};
```

## Wrapping up

```ts
import { auth } from "./lucia.js";
import type { User } from "lucia-auth";

export const handleCallback = async (request: Request) => {
	const code = request.url.searchParams.get("code");
	const response = await fetch("https://github.com/login/oauth/access_token", {
		body: JSON.stringify({
			client_id: GITHUB_CLIENT_ID,
			client_secret: GITHUB_CLIENT_SECRET,
			code
		}),
		headers: {
			Accept: "application/json"
		},
		method: "POST"
	});
	if (!response.ok) return new Response(400);
	const result = (await response.json()) as {
		access_token: string;
	};
	const accessToken = result.access_token;
	const githubUserResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
	const githubUser = (await githubUserResponse.json()) as {
		id: string;
	};
	const githubUserId = githubUser.id;
	let user: User;
	try {
		user = await auth.getUserByProviderId("github", userId);
	} catch {
		// user does not exist
		try {
			user = await auth.createUser("github", githubUserId);
		} catch {
			// error
			return new Response(null, {
				status: 500
			});
		}
	}
	try {
		const session = await auth.createSession(user.userId);
		return new Response(null, {
			headers: {
				"set-cookie": serializedSessionCookies.join()
			}
		});
	} catch {
		// error
		return new Response(null, {
			status: 500
		});
	}
};
```
