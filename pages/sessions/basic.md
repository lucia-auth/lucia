---
title: "Basic session implementation"
---

# Basic session implementation

## Overview

Sessions have an ID and secret. We're using a separate ID and secret to prevent any possibility of a timing attacks. The secret is hashed before storage to minimize the impact of breaches and leaks.

```ts
interface Session {
	id: string;
	secretHash: Uint8Array; // Uint8Array is a byte array
	createdAt: Date;
}
```

Tokens issued to clients include both the ID and un-hashed secret.

```
<SESSION_ID>.<SESSION_SECRET>
```

## Database

The secret hash is stored as a raw binary value. You can hex- or base64-encode it if you prefer to store it as a string.

```
CREATE TABLE session (
    id TEXT NOT NULL PRIMARY KEY,
    secret_hash BLOB NOT NULL, -- blob is a SQLite data type for raw binary
    created_at INTEGER NOT NULL -- unix time (seconds)
) STRICT;
```

> `STRICT` is an SQLite-specific feature that prevents type coercion.

## Generating IDs and secrets

We can generate IDs and secrets by generating a random byte array and encoding it into a string.

For a general purpose ID and secret, we want at least 120 bits of entropy. With 120 bits of entropy, you can generate 1,000,000 IDs/second without worrying about collisions and not ever think about brute force attacks.

Since these strings will be used as secrets as well, it's crucial to use a cryptographically-secure random source. **`Math.random()` should NOT be used for generating secrets.**

```ts
function generateSecureRandomString(): string {
	// Human readable alphabet (a-z, 0-9 without l, o, 0, 1 to avoid confusion)
	const alphabet = "abcdefghijklmnpqrstuvwxyz23456789";

	// Generate 24 bytes = 192 bits of entropy.
	// We're only going to use 5 bits per byte so the total entropy will be 192 * 5 / 8 = 120 bits
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);

	let id = "";
	for (let i = 0; i < bytes.length; i++) {
		// >> 3 s"removes" the right-most 3 bits of the byte
		id += alphabet[bytes[i] >> 3];
	}
	return id;
}
```

> This encoder wastes 3/8 of the random bits. You can optimize it and get better performance by using all the generated random bits.

## Creating sessions

The secret is hashed using SHA-256. While SHA-256 is unsuitable for user passwords, because the secret has 120 bits of entropy and already unguessable as is, we can use a fast hashing algorithm here. Even using the fastest or most efficient hardware available, an offline brute-force attack is impossible.

```ts
async function createSession(dbPool: DBPool): Promise<SessionWithToken> {
	const now = new Date();

	const id = generateSecureRandomString();
	const secret = generateSecureRandomString();
	const secretHash = await hashSecret(secret);

	const token = id + "." + secret;

	const session: SessionWithToken = {
		id,
		secretHash,
		createdAt: now,
		token
	};

	await executeQuery(dbPool, "INSERT INTO session (id, secret_hash, created_at) VALUES (?, ?, ?)", [
		session.id,
		session.secretHash,
		Math.floor(session.createdAt.getTime() / 1000)
	]);

	return session;
}

async function hashSecret(secret: string): Promise<Uint8Array> {
	const secretBytes = new TextEncoder().encode(secret);
	const secretHashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
	return new Uint8Array(secretHashBuffer);
}

interface SessionWithToken extends Session {
	token: string;
}

interface Session {
	// ...
}
```

## Validating session tokens

To validate a sessions token, parse out the ID and secret, get the session with the ID, check the expiration, and compare the secret against the hash. Use constant-time comparison for checking secrets and derived hashes.

We recommend setting an expiration for all sessions. Implement an [inactivity timeout](/sessions/inactivity-timeout) instead if you want to keep active users signed in.

```ts
const sessionExpiresInSeconds = 60 * 60 * 24; // 1 day

async function createSession(dbPool: DBPool): Promise<SessionWithToken> {
	// ...
}

async function validateSessionToken(dbPool: DBPool, token: string): Promise<Session | null> {
	const tokenParts = token.split(".");
	if (tokenParts.length != 2) {
		return null;
	}
	const sessionId = tokenParts[0];
	const sessionSecret = tokenParts[1];

	const session = await getSession(dbPool, sessionId);

	const tokenSecretHash = hashSecret(sessionSecret);
	const validSecret = constantTimeEqual(tokenSecretHash, session.secretHash);
	if (!validSecret) {
		return null;
	}

	return session;
}

async function getSession(dbPool: DBPool, sessionId: string): Promise<Session | null> {
	const now = new Date();

	const result = await executeQuery(
		dbPool,
		"SELECT id, secret_hash, created_at FROM session WHERE id = ?",
		[sessionId]
	);
	if (result.rows.length !== 1) {
		return null;
	}
	const row = result.rows[0];
	const session: Session = {
		id: row[0],
		secretHash: row[1],
		createdAt: new Date(row[2] * 1000)
	};

	// Check expiration
	if (now.getTime() - session.createdAt.getTime() >= sessionExpiresInSeconds * 1000) {
		await deleteSession(sessionId);
		return null;
	}

	return session;
}

async function deleteSession(dbPool: DBPool, sessionId: string): Promise<void> {
	await executeQuery(dbPool, "DELETE FROM session WHERE id = ?", [sessionId]);
}

async function hashSecret(secret: string): Uint8Array {
	// ...
}

interface SessionWithToken extends Session {
	// ...
}

interface Session {
	// ...
}
```

```ts
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.byteLength !== b.byteLength) {
		return false;
	}
	let c = 0;
	for (let i = 0; i < a.byteLength; i++) {
		c |= a[i] ^ b[i];
	}
	return c === 0;
}
```

## Client-side storage

For most websites, we recommend storing the session in a `HttpOnly`, `Secure`, cookie with `SameSite` set to `Lax`. It's important to note that using a `HttpOnly` cookie does not make you immune to targeted XSS attacks.

Cookies usually have a maximum lifetime of 400 days. If you want a persistent session, set a new cookie periodically.

```
Set-Cookie: session_token=SESSION_TOKEN; Max-Age=86400; HttpOnly; Secure; Path=/; SameSite=Lax
```

If you have a separate auth server that cannot be hosted on the same domain, you can store the session as a cookie or in `localStorage`. Storing credentials in storage accessible by client-side JavaScript, you may be more vulnerable to supply-chain attacks. Because some browsers and extensions can clear non-`HttpOnly` cookies, we recommended storing the token in a `HttpOnly` cookie as well so you have the option to store the cookie client-side again.

For native applications, use the device's built-in secure storage.

## Securing secret hashes

If you have endpoints that can return a session object, ensure that the session secret hash is omitted. Instead of using `JSON.stringify()` directly, we recommend creating a dedicated function for encoding the session object into JSON.

```ts
function encodeSessionPublicJSON(session: Session): string {
	// Omit Session.secretHash
	const json = JSON.stringify({
		id: session.id,
		created_at: Math.floor(session.createdAt.getTime() / 1000)
	});
	return json;
}
```

## CSRF protection

Cross-site request forgery protection must be implemented for websites that uses cookies and accepts form submissions. Even if you only have endpoints that accept JSON request bodies, implementing a basic protection is recommended.

While the `SameSite` cookie attribute provides some CSRF protection, it doesn't protect your website from subdomain takeovers and the cookie will be set without the attribute on older browsers.

For websites only targeting modern browsers (post-2020), the `Origin` header can be used to check the request origin. Requests without the `Origin` header should be blocked with a status of `403` or similar. Some frameworks already have a similar CSRF protection built in, including Next.js (only for server actions), SvelteKit, and Astro (v5+).

```ts
function verifyRequestOrigin(method: string, originHeader: string): boolean {
	if (method === "GET" || method === "HEAD") {
		return true;
	}
	return originHeader === "example.com";
}

// Enable strict origin check only on production environments.
function verifyRequestOrigin(method: string, originHeader: string): boolean {
	if (env !== ENV.PROD) {
		return true;
	}
	if (method === "GET" || method === "HEAD") {
		return true;
	}
	return originHeader === "example.com";
}
```

To support older browsers, use an anti-CSRF token stored in the server or the [signed double-submit cookies](https://thecopenhagenbook.com/csrf#signed-double-submit-cookies) for a stateless approach.
