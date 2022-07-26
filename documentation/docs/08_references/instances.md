## Lucia

```ts
Lucia<UserData extends {}>
```

Refer to [Server APIs](/server-apis).

## Token

### value

The value of the token.

```ts
const value: string;
```

### createCookie()

Creates a new http-only cookie.

```ts
const createCookie: () => string;
```

## AccessToken

Extends [`Token`](/references/instances#token). Represents an access token token.

```ts
AccessToken<UserData extends {}>
```

### user

Validates the access token using the fingerprint token and returns the user of the access token.

```ts
const user: (fingerprintToken: string) => Promise<User<UserData>>;
```

#### Parameters

| name             | types  | description           |
| ---------------- | ------ | --------------------- |
| fingerprintToken | string | The fingerprint token |

#### Returns

| name      | types                                    | description |
| --------- | ---------------------------------------- | ----------- |
| User | [User](/references/types#User) |             |

#### Errors

| name                      | description                                         |
| ------------------------- | --------------------------------------------------- |
| AUTH_INVALID_ACCESS_TOKEN | The access token and the fingerprint does not match |

## RefreshToken

Extends [`Token`](/references/instances#token). Represents a refresh token token.

> Note: While this also has `createCookie` method, it returns an empty cookie and should not be used.

### userId

Validates the refresh token using the fingerprint token and returns the user id of the user of the access token.

```ts
const user: (fingerprintToken: string) => Promise<string>;
```

#### Parameters

| name             | types  | description           |
| ---------------- | ------ | --------------------- |
| fingerprintToken | string | The fingerprint token |

#### Returns

| name | types  | description         |
| ---- | ------ | ------------------- |
|      | string | User id of the user |

#### Errors

| name                      | description                                               |
| ------------------------- | --------------------------------------------------------- |
| AUTH_INVALID_ACCESS_TOKEN | The access token and the fingerprint token does not match |

### encrypt

Encrypts the refresh token and creates a new encrypted refresh token.

```ts
const encrypt: () => EncryptedRefreshToken;
```

#### Returns

| name | types                                                                | description                               |
| ---- | -------------------------------------------------------------------- | ----------------------------------------- |
|      | [EncryptedRefreshToken](/references/instances#encryptedrefreshtoken) | An encrypted version of the refresh token |

## EncryptedRefreshToken

Extends [`Token`](/references/instances#token). Represents an encrypted refresh token.

### decrypt

Decrypts the encrypted refresh token and creates a new refresh token.

```ts
const decrypt: () => RefreshToken;
```

#### Returns

Will return a `RefreshToken` with a `value` of `""` if the encrypted refresh token's value cannot be correctly decrypted.

| name | types                                              | description                               |
| ---- | -------------------------------------------------- | ----------------------------------------- |
|      | [RefreshToken](/references/instances#refreshtoken) | An encrypted version of the refresh token |

## FingerprintToken

Extends [`Token`](/references/instances#token). Represents a fingerprint token.