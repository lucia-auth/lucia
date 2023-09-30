---
title: "Handle users with OAuth"
description: "Learn how to use handle users with OAuth"
---

After authenticating the user with OAuth, you can get an existing or create a new Lucia user using [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth). If you're using one of the built in providers, [`OAuth2ProviderAuth.validateCallback()`](reference/oauth/interfaces/oauth2providerauth#validatecallback) and [`OAuth2ProviderAuthWithPKCE.validateCallback()`](reference/oauth/interfaces/oauth2providerauthwithpkce#validatecallback) will return a provider-extended instance of it.

```ts
import { github } from "@lucia-auth/oauth/providers";

const githubAuth = github();
const githubUserAuth = githubAuth.validateCallback();
```

Alternatively, if you're using one of the OAuth helpers, you can use [`providerUserAuth()`](/reference/oauth/modules/main#provideruserauth) to manually create a new instance of it. It takes your Lucia `Auth` instance, the provider id (e.g. `"github"`), and the provider user id (e.g. GitHub user id).

```ts
const githubUserAuth = providerUserAuth(auth, "github", githubUserId);
```

## Basic usage

[`ProviderUserAuth.getExistingUser()`](/reference/oauth/interfaces/provideruserauth/#getexistinguser) will return a `User` if a Lucia user already exists for the authenticated provider account. This is based on the provider user id (e.g. GitHub user id) and not shared identifiers like email.

If not, you can create a new Lucia user linked to the provider with [`ProviderUserAuth.createUser()`](/reference/oauth/interfaces/provideruserauth#createuser). You can get the provider user data with `githubUser` for GitHub, etc.

```ts
const getUser = async () => {
	const existingUser = await githubUserAuth.getExistingUser();
	if (existingUser) return existingUser;
	// create a new user if the user does not exist
	return await githubUserAuth.createUser({
		attributes: {
			githubUsername: githubUser.login
		}
	});
};
const user = await getUser();

// login user
const session = await auth.createSession({
	userId: user.userId,
	attributes: {}
});
const authRequest = auth.handleRequest();
authRequest.setSession(session); // store session cookie
```

## Add a new key to an existing user

Alternatively, you may want to add a new authentication method to an existing user. Calling [`ProviderUserAuth.createKey()`](/reference/oauth/interfaces/provideruserauth#createkey) will create a new key linked to the provided user id.

```ts
const existingUser = githubUserAuth.getExistingUser();
if (existingUser) {
	await createKey(currentUser.userId);
}
```

See [OAuth account linking](/guidebook/oauth-account-linking) guide for details.

## Extension

If you're using one of the built in providers, `OAuth2ProviderAuth.validateCallback()` and `OAuth2ProviderAuthWithPKCE.validateCallback()` will return a provider-extended instance of `ProviderUserAuth`. This means in addition to the methods of `ProviderUserAuth`, it includes a few other properties and methods. While this isn't strictly standardized, all providers include the provider user (e.g. github user) and an access token (refresh token if available).

### Get provider user

```ts
const githubUserAuth = await githubAuth.validateCallback(code);
const githubUsername = githubUserAuth.githubUser.login;
```

### Get API tokens

```ts
const githubUserAuth = await githubAuth.validateCallback(code);
const githubAccessToken = githubUserAuth.githubTokens.accessToken;
```
