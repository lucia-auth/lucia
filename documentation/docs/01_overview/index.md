Lucia is for JWT based authentication. It works by using 3 tokens:

-   Access token
-   Refresh token
-   Fingerprint token

Access tokens are short-lived JSON Web Tokens (JWTs) that can be used to verify a user. Refresh tokens are used to re-issue access tokens once they expire. Fingerprint tokens are tokens that is used to make sure the user using the access and refresh token is the same user as the one who created it.

When creating and authenticating users, Lucia doesn't use username-passwords as it would limit it to 1 authentication method. Because of this, Lucia uses auth ids and identifiers on top of the normal user ids. Auth ids represent the authentication method used. For example, "email" can be used for email, "sms" for SMS, and "github" for Github authentication. An identifier is something unique to the user within the authentication method, like email, phone number, or a Github username. With the auth id, it allows Lucia to differentiate users from multiple sources (email, SMS, OAuth, etc) while having a unified database of users.

Lucia does not require the use of passwords, though it can be used if needed like for email-password authentication. If you are implementing OAuth, for example, you can ommit the password since you can trust the OAuth service to have verified the user.