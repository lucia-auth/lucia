---
title: "Migrate from Lucia v3"
---

# Migrate from Lucia v3

Because Lucia v3 is lightweight and relatively low-level, migrating your project shouldn't take long. Moreover, most of your knowledge will still be very useful. No database migrations are necessary.

APIs on sessions are covered in the [Basic session API](/sessions/basic-api) page.

- `Lucia.createSession()` => `generateSessionToken()` and `createSession()`
- `Lucia.validateSession()` => `validateSessionToken()`
- `Lucia.invalidateSession()` => `invalidateSession()`

APIs on cookies are covered in the [Session cookies](/sessions/cookies) page.

- `Lucia.createSessionCookie()` => `setSessionTokenCookie()`
- `Lucia.createBlankSessionCookie()` => `deleteSessionTokenCookie()`

The one change to how sessions work is that session tokens are now hashed before storage. The pre-hash token is the client-assigned session ID and the hash is the internal session ID. The easiest option would be to purge all existing sessions, but if you want keep existing sessions, SHA-256 and hex-encode the session IDs stored in the database. Or, you can skip the hashing altogether. Hashing is a good measure against database leaks, but not absolutely necessary.

```ts
export function createSession(userId: number): Session {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const sessionId = encodeBase32LowerCaseNoPadding(bytes);
	// Insert session into database.
	return session;
}

export function validateSessionToken(sessionId: string): SessionValidationResult {
	// Get and validate session
	return { session, user };
}
```

If you need help or have any questions, please ask them on [Discord](https://discord.com/invite/PwrK3kpVR3) or on [GitHub discussions](https://github.com/lucia-auth/lucia/discussions).
