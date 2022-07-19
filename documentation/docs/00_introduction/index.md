Lucia is a JWT based authentication library for SvelteKit that works with your code, and not the other way around. It provides the necessary building blocks for implementing authentication, allowing you to customize it to your own needs.

> This library requires a database to work. If you need a free option, check out [Supabase](https://supabase.com), which Lucia supports out of the box.

## Why Lucia ?

There are tons of client-side authentication services out there like Firebase, Auth0, or Supabase. But, they don't support SSR (SvelteKit) out of the box, and even if you get it to work, it's usually a very hacky solution that isn't worth the time. On the other hand, there are authentication libraries like NextAuth for Next.js that handles everything once you configure the database. But it's still limited in how it can be customized. Lucia aims to be a flexible customizable solution that is simple and intuitive.

## Overview

Lucia is for JWT based authentication. It works by using 3 tokens:

-   Access token
-   Refresh token
-   Fingerprint

Access tokens are short-lived JSON Web Tokens (JWTs) that can be used to verify a user. Refresh tokens are used to re-issue access tokens once they expire. Fingerprint is a token that is used to make sure the user using the access and refresh token is the same user as the one who created it. Lucia handles the creation, verification, refreshing, and deleting of these tokens. Rest of the authentication process, like verifying the user's email, is left up to you.

When creating and authenticating users, Lucia doesn't use username-passwords as it would limit it to 1 authentication method. Because of this, Lucia uses auth ids and identifiers on top of the normal user ids. Auth ids represent the authentication method used. For example, "email" can be used for email, "sms" for SMS, and "github" for Github authentication. An identifier is something unique to the user, like email, phone number, or a Github username. With the auth id, this allows Lucia to differentiate users from multiple sources (email, SMS, OAuth, etc) while having a unified database of users.

Lucia does not require the use of passwords, though it can be used if needed like for email-password authentication. If you are implementing OAuth, for example, you can ommit the password since you can trust the OAuth service to have verified the user.