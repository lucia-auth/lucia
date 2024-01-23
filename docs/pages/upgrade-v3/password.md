---
title: "Upgrade password-based auth to v3"
---

# Upgrade password-based auth to v3

## Update database

You can continue using the keys table but we recommend either creating a dedicated table for storing passwords or storing passwords in the user table, as shown in the database migration guides.

## Create users

Lucia provides `LegacyScrypt` for hashing and comparing passwords using the algorithm used in v1 and v2. For future projects, we recommend using `Argon2id` or `Scrypt` provided by Oslo.

```ts
import { generateId, LegacyScrypt } from "lucia";

// v2 IDs have a length of 15
const userId = generateId(15);

await db.beginTransaction();
// create user manually
await db.table("user").insert({
	id: userId,
	username
});
// store oauth account
await db.table("password").insert({
	hashed_password: await new LegacyScrypt().hash(password),
	user_id: userId
});
await db.commit();

// simplified `createSession()` - second param for session attributes
const session = await lucia.createSession(userId, {});
// `createSessionCookie()` now takes a session ID instead of the entire session object
const sessionCookie = lucia.createSessionCookie(session.id);
// set session cookie as usual (using `Response` as example)
return new Response(null, {
	status: 302,
	headers: {
		Location: "/",
		"Set-Cookie": sessionCookie.serialize()
	}
});
```

## Authenticate users

Use `verify()` to validate passwords.

```ts
import { LegacyScrypt } from "lucia";

// using consecutive queries to simplify example but you can use joins
const user = await db.table("user").where("username", "=", username).get();
if (!user) {
	return new Response("Invalid username or password", {
		status: 400
	});
}
const credentials = await db.table("password").where("user_id", "=", user.id).get();
if (!user) {
	return new Response("Invalid username or password", {
		status: 400
	});
}

const validPassword = await new LegacyScrypt().verify(credentials.hashed_password, password);
if (!validPassword) {
	return new Response("Invalid username or password", {
		status: 400
	});
}

// create sessions...
```
