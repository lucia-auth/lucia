---
title: "Account linking"
---

# Account linking

This guide uses the database schema shown in the [Multiple OAuth providers](/guides/oauth/multiple-providers) guide.

## Automatic

In general, you'd want to link accounts with the same email. Keep in mind that the email can be not verified and you should always assume it isn't. Make sure to verify that the email has been verified.

```ts
import { generateIdFromEntropySize } from "lucia";
// Make sure you requested for the "user:email" scope.
const tokens = await github.validateAuthorizationCode(code);
const userResponse = await fetch("https://api.github.com/user", {
	headers: {
		Authorization: `Bearer ${tokens.accessToken}`
		"User-Agent": "my-app", // GitHub requires a User-Agent header
	}
});
const githubUser = await userResponse.json();

const emailsResponse = await fetch("https://api.github.com/user/emails", {
	headers: {
		Authorization: `Bearer ${tokens.accessToken}`
	}
});
const emails = await emailsResponse.json();

const primaryEmail = emails.find((email) => email.primary) ?? null;
if (!primaryEmail) {
	return new Response("No primary email address", {
		status: 400
	});
}
if (!primaryEmail.verified) {
	return new Response("Unverified email", {
		status: 400
	});
}

const existingUser = await db.table("user").where("email", "=", primaryEmail.email).get();
if (existingUser) {
	await db.table("oauth_account").insert({
		provider_id: "github",
		provider_user_id: githubUser.id,
		user_id: existingUser.id
	});
} else {
	const userId = generateIdFromEntropySize(10); // 16 characters long
	await db.beginTransaction();
	await db.table("user").insert({
		id: userId,
		email: primaryEmail.email
	});
	await db.table("oauth_account").insert({
		provider_id: "github",
		provider_user_id: githubUser.id,
		user_id: userId
	});
	await db.commitTransaction();
}
```

## Manual

Another approach is to let users manually add OAuth accounts from their profile/settings page. You'd want to setup another OAuth flow, and instead of creating a new user, add a new OAuth account tied to the authenticated user.

```ts
const { user } = await lucia.validateSession();
if (!user) {
	return new Response(null, {
		status: 401
	});
}

const tokens = await github.validateAuthorizationCode(code);
const userResponse = await fetch("https://api.github.com/user", {
	headers: {
		Authorization: `Bearer ${tokens.accessToken}`
	}
});
const githubUser = await userResponse.json();

// TODO: check if github account is already linked to a user

await db.table("oauth_account").insert({
	provider_id: "github",
	provider_user_id: githubUser.id,
	user_id: user.id
});
```
