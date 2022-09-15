Lucia's authentication is based on JSON web tokens. It works by using 3 tokens:

-   Access token
-   Refresh token
-   Fingerprint token

Access tokens are short-lived JSON Web Tokens (JWTs) that can be used to verify a user. Refresh tokens are used to re-issue access tokens once they expire. Fingerprint tokens are tokens that is to verify the user using the access and refresh token is the same user who created it.

When creating and authenticating users, Lucia doesn't use username-passwords as it would limit it to 1 authentication method. Because of this, Lucia uses auth methods and identifiers on top of the normal user ids to identify users. Auth methods represent the authentication method used. For example, "email" can be used for email, "sms" for SMS, and "github" for Github authentication. These can be anything, and it just needs to be the same across the authentication method. An identifier is something unique to the user within the used authentication method, like email, phone number, or a Github username. With the combination of both, it allows Lucia to identify users from multiple sources (email, SMS, OAuth, etc) while having a single database of users.

Lucia does not require the use of passwords, though it can be used if needed. If you're implementing OAuth, for example, you can omit the password since you can trust the OAuth service to have verified the user and provided the identifier.

### How does it work?

As stated above, Lucia works by using 3 tokens. These are all stored as http-only cookies. However, because they're stored as cookies, refresh tokens are sent with every request. This is less then ideal as there's a larger window that a third party can intercept the request and use the token. To make it "safer" to expose the token, Lucia stores the refresh token encrypted and are decrypted when needed.

To prevent CSRF attacks, Lucia only accepts tokens sent inside the authorization header (and not cookies) for POST requests. To prevent a third party re-using a XSS stolen token, Lucia requires a fingerprint token cookie (which cannot be read in the client) to be sent with the access/refresh token.

Finally, refresh tokens are re-issued after refreshing an access token (rotation). Refresh tokens are only considered valid if they fulfill the following 2 conditions:

1. The token is a valid JWT
2. The token is stored in the database

Since a normal user will usually not have a invalid refresh token, if a refresh token fulfills 1 but not 2, one can assume that:

1. A third party attempted a refresh
2. A third party successfully attempted a refresh and the original user hold an invalid token

In such case, Lucia will invalidate all of refresh tokens of the user.

