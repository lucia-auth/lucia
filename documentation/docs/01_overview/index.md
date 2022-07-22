Lucia is for JWT based authentication. It works by using 3 tokens:

-   Access token
-   Refresh token
-   Fingerprint token

Access tokens are short-lived JSON Web Tokens (JWTs) that can be used to verify a user. Refresh tokens are used to re-issue access tokens once they expire. Fingerprint tokens are tokens that is used to make sure the user using the access and refresh token is the same user as the one who created it.

When creating and authenticating users, Lucia doesn't use username-passwords as it would limit it to 1 authentication method. Because of this, Lucia uses auth ids and identifiers on top of the normal user ids. Auth ids represent the authentication method used. For example, "email" can be used for email, "sms" for SMS, and "github" for Github authentication. An identifier is something unique to the user within the authentication method, like email, phone number, or a Github username. With the auth id, it allows Lucia to indenitify users from multiple sources (email, SMS, OAuth, etc) while having a single database of users. It's for identifying users and not for storing user data (create a new column is `users` table to store email, for example).

Lucia does not require the use of passwords, though it can be used if needed like for email-password authentication. If you are implementing OAuth, for example, you can ommit the password since you can trust the OAuth service to have verified the user.

### How does it work?

As stated above, Lucia works by using 3 tokens. These are all stored as http-only cookies. However, because of that refresh tokens are sent with every request, which is less then ideal as there's a larger window of time that a third party can intercept the request and use the token than if it wasn't. To make it "safe" to expose the token, Lucia stores the refresh token encrypted and they're decrypted when needed. 

To prevent CSRF attack, Lucia only accepts tokens sent inside the authorization header (and not cookies). To prevent a third party re-using a XSS stolen token, Lucia requires a fingerprint token cookie (which cannot be read in the client) to be sent with access/refresh token.

Finally, refresh tokens are re-issued after refreshing an access token (rotation). Refresh tokens are only considered valid if they fufill the following 2 conditions:

1. The token is a valid JWT
2. The token is stored in the database

Since a normal user will usually not have a invalid refresh token, if a refresh token fufills 1 but not 2, one can assume that:

1. A third party attempted a refresh
2. A third party successfully attempted a refresh and the original user hold an invalid token

In such case, Lucia will invalidate all of refresh tokens of the user.