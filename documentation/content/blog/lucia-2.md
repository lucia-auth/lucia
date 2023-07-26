---
title: "Lucia 2.0"
description: "Announcing Lucia 2.0"
---

We're super excited to announce Lucia 2.0!

This update brings new big features to the library as well as major improvements to our APIs. A big focus for 2.0 was bringing stability, and that included future proofing it. This should mean 2.0 marks the end of our "rapid development" stage.

There is unfortunately a slew of breaking changes, but it shouldn't take more than 20 minutes for most users. At worst, it should only take an hour or so. Please read the [migration guide]() for details. And, if you encounter any issues, feel free to ask them on our Discord server!

You might've noticed that we updated our docs (again)! Some key features are still missing (namely dark mode and search) but it should be just better all around. We also added the [Guidebook](/guidebook). This is a collection of tutorials and guides on using Lucia, and it should cover the lack of resources compared to other solutions. It's still a work-in-progress and expect more content soon!

Thank you to everyone who has provided us with valuable feedback and helped out with the development!

## New package name

The core library `lucia-auth` has been renamed to `lucia`! All other package names (such as `@lucia-auth/oauth`) remain the same.

## Revamped sessions

With Lucia 2.0, we are removing the concept of session renewals entirely. To be exact, we'll be extending the expiration of the session instead of replacing it.

### Better APIs for session validation

The `User` object is now available inside the `Session` object. This means we are removing `AuthRequest.validateSessionUser()` which should be less confusing.

```ts
const session = await authRequest.validate();
if (session) {
	const user = session.user;
}
```

## Custom session attributes

Custom attributes can now be defined for sessions in addition to users!

```ts
const session = await auth.createSession({
	userId,
	attributes: {
		country
	}
});
```

## Bearer token support

You can now send session ids inside the `Authorization` header as bearer tokens and validate them with `AuthRequest.validateBearerToken()`. Even better, you don't have to handle session renewals since new sessions won't be created when you validate them! This means you can now use Lucia with SPAs and native applications without workarounds.

## Remove primary and single use keys

This was one of the biggest regret with v1, especially single use keys. It was clunky and did not align with our goals and approach. We have decided to remove it instead of caring the burden of maintaining it long term.

### Token integration deprecated

This might be the biggest change for v2. Please see the [Email authentication with verification links](/guidebook/sign-in-with-email-and-password) for a guide on replacing verification tokens.

## Custom database table names

All official adapters allow to use any table names! [We truly live in an age of wonders.](https://www.youtube.com/live/GYkq9Rgoj8E?feature=share&t=2331)

## New adapters and OAuth providers

We added a bunch of new adapters:

- libSQL
- `postgres`
- Unstorage
- Upstash Redis

and OAuth providers:

- Spotify
- Lichess
- osu!
- (Work in progress: Apple)