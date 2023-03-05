---
_order: 1
title: "Provider API"
---

API reference for provider return types.

```ts
const providerAuth: OAuthProvider = provider();
```

## `OAuthProvider`

```ts
type OAuthProvider = {
	getAuthorizationUrl: () => Promise<[url: URL, state: string]>;
	validateCallback: (code: string) => Promise<ProviderSession>;
};
```

### `getAuthorizationUrl()`

Returns the authorization url for user redirection and a state for storage. This should generate and use a state using [`generateState()`](/oauth/reference/api#generatestate).

```ts
const getAuthorizationUrl: () => Promise<[url: URL, state: string]>;
```

#### Parameter

| name  | type     | description                                                                           | optional |
| ----- | -------- | ------------------------------------------------------------------------------------- | -------- |
| state | `string` | an opaque value used by the client to maintain state between the request and callback | true     |

#### Returns

| name    | type     | description          |
| ------- | -------- | -------------------- |
| `url`   | `URL`    | authorize url        |
| `state` | `string` | state parameter used |

### `validateCallback()`

Validates the callback and returns the session.

```ts
const validateCallback: (code: string) => Promise<ProviderSession>;
```

#### Parameter

| name | type     | description                                                |
| ---- | -------- | ---------------------------------------------------------- |
| code | `string` | authorization code from callback - refer to provider's doc |

#### Returns

| type                                                                | description       |
| ------------------------------------------------------------------- | ----------------- |
| [`ProviderSession`](/oauth/reference/api-reference#providersession) | the oauth session |

#### Errors

| name           | description                          |
| -------------- | ------------------------------------ |
| FAILED_REQUEST | invalid code, network error, unknown |

## `ProviderSession`

```ts
type ProviderSession = {
	existingUser: User | null;
	createUser: (userAttributes: Lucia.UserAttributes) => Promise<User>;
	createKey: (userId: string) => Promise<Key>;
	providerUser: ProviderUser;
	tokens: {
		accessToken: string;
		[data: string]: string;
	};
};
```

| name                                                    | type                                                  | description                                                    |
| ------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| existingUser                                            | [`User`](/reference/types/lucia-types#user)` \| null` | existing user - null if non-existent (= new user)              |
| [createUser](/oauth/reference/api-reference#createuser) | `Function`                                            |                                                                |
| [createKey](/oauth/reference/api-reference#createkey)   | `Function`                                            |                                                                |
| providerUser                                            | `ProviderUser>`                                       | user info from the used provider - refer below                 |
| tokens                                                  | `any`                                                 | access tokens (`accessToken`) among other tokens - refer below |

#### `existingUser`

| provider | type                                                     |
| -------- | -------------------------------------------------------- |
| Discord  | [`DiscordUser`](/oauth/providers/discord#discorduser)    |
| Facebook | [`FacebookUser`](/oauth/providers/facebook#facebookuser) |
| Github   | [`GithubUser`](/oauth/providers/github#githubuser)       |
| Google   | [`GoogleUser`](/oauth/providers/google#googleuser)       |
| Patreon  | [`PatreonUser`](/oauth/providers/patreon#patreonuser)    |
| Reddit   | [`RedditUser`](/oauth/providers/reddit#reddituser)       |
| Twitch   | [`TwitchUser`](/oauth/providers/twitch#twitchuser)       |

#### `tokens`

| provider | type                                                         |
| -------- | ------------------------------------------------------------ |
| Discord  | [`Discordtokens`](/oauth/providers/discord#discordtokens)    |
| Facebook | [`Facebooktokens`](/oauth/providers/facebook#facebooktokens) |
| Github   | [`Githubtokens`](/oauth/providers/github#githubtokens)       |
| Google   | [`Googletokens`](/oauth/providers/google#googletokens)       |
| Patreon  | [`Patreontokens`](/oauth/providers/patreon#patreontokens)    |
| Reddit   | [`Reddittokens`](/oauth/providers/reddit#reddittokens)       |
| Twitch   | [`Twitchtokens`](/oauth/providers/twitch#twitchtokens)       |

### `createKey()`

Creates a new persistent key using the authorized session by calling [`Lucia.createKey()`](/reference/api/server-api#createkey) for the target user.

```ts
const createKey: (userId: string) => Promise<Key>;
```

#### Parameter

| name   | type     | description    |
| ------ | -------- | -------------- |
| userId | `string` | target user id |

#### Returns

| type                                      | description           |
| ----------------------------------------- | --------------------- |
| [`Key`](/reference/types/lucia-types#key) | the newly created key |

#### Errors

Refer to [Lucia.createUser()](/reference/api/server-api#createkey)

### `createUser()`

Creates a new user for the authorized session by calling [`Lucia.createUser()`](/reference/api/server-api#createuser) using the provided user attributes. Refer to the provider's doc for the provider and identifier used.

```ts
const createUser: (userAttributes: Lucia.UserAttribute) => Promise<User>;
```

#### Parameter

| name           | type                                                                      | description                                 |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------- |
| userAttributes | [`Lucia.UserAttributes`](/reference/types/lucia-namespace#userattributes) | additional user data to store in user table |

#### Returns

| type                                        | description            |
| ------------------------------------------- | ---------------------- |
| [`User`](/reference/types/lucia-types#user) | the newly created user |

#### Errors

Refer to [Lucia.createUser()](/reference/api/server-api#createuser)
