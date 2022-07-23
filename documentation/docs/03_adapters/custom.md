## Overview

An adapter takes the following structure:

```ts
interface Adapter {
    getUserFromRefreshToken: (
        refreshToken: string
    ) => Promise<DatabaseUser | null>;
    getUserFromIdentifierToken: (
        identifierToken: string
    ) => Promise<DatabaseUser | null>;
    createUser: (
        userId: string,
        data: {
            identifier_token: string;
            hashed_password: string | null;
            user_data: Record<string, any>;
        }
    ) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    saveRefreshToken: (refreshToken: string, userId: string) => Promise<void>;
    deleteRefreshToken: (refreshToken: string) => Promise<void>;
    deleteUserRefreshTokens: (userId: string) => Promise<void>;
}
```

## Properties

### getUserFromRefreshToken

Gets the row from `users` connected to the refresh token and returns it as an object.

```ts
getDataFromRefreshToken: (refreshToken: string) => Promise<DatabaseUser | null>;
```

#### Parameters

| name         | type   | description                           |
| ------------ | ------ | ------------------------------------- |
| refreshToken | string | `refresh_tokens.refresh_token` column |

#### Returns

Returns `null` if a user does not exist.

| name         | type         | description |
| ------------ | ------------ | ----------- |
| DatabaseUser | DatabaseUser |             |

### getUserFromIdentifierToken

Gets the row from `users` table with the identifier token and returns it as an object.

```ts
getDataFromIdentifierToken: (identifierToken: string) =>
    Promise<DatabaseUser | null>;
```

#### Parameters

| name            | type   | description                     |
| --------------- | ------ | ------------------------------- |
| identifierToken | string | `users.identifier_token` column |

#### Returns

Returns `null` if a user does not exist.

| name         | type         | description |
| ------------ | ------------ | ----------- |
| DatabaseUser | DatabaseUser |             |

### createUser

Creates a new row in `users` table.

```ts
createAccount: (
    userId: string,
    data: {
        hashed_password: string | null;
        identifier_token: string;
        user_data: Record<string, any>;
    }
) => Promise<void>;
```

#### Parameters

| name                  | type                | description                              |
| --------------------- | ------------------- | ---------------------------------------- |
| userId                | string              | `id` column                              |
| data.hashed_password  | string              | `hashed_password` column                 |
| data.identifier_token | string              | `identifier_token` column                |
| data.user_data        | Record<string, any> | Each keys should saved as its own column |

### deleteUser

Deletes a row in `users` table where the user id matches.

```ts
deleteUser: (userId: string) => Promise<void>;
```

#### Parameters

| name   | type   | description |
| ------ | ------ | ----------- |
| userId | string | `id` column |

### saveRefreshToken

Creates a new row in `refresh_tokens` table.

```ts
saveRefreshToken: (userId: string, refreshToken: string) => Promise<void>;
```

#### Parameters

| name         | type   | description                           |
| ------------ | ------ | ------------------------------------- |
| userId       | string | `refresh_tokens.user_id` column       |
| refreshToken | string | `refresh_tokens.refresh_token` column |

### deleteRefreshToken

Deletes a row in `refresh_tokens` table where the refresh token matches.

```ts
deleteRefreshToken: (refreshToken: string) => Promise<void>;
```

#### Parameters

| name         | type   | description            |
| ------------ | ------ | ---------------------- |
| refreshToken | string | `refresh_token` column |

### deleteUserRefreshTokens

Deletes all rows in `refresh_tokens` table where the user id matches.

```ts
deleteUserRefreshTokens: (userId: string) => Promise<void>;
```

#### Parameters

| name   | type   | description      |
| ------ | ------ | ---------------- |
| userId | string | `user_id` column |

## Errors

Database related errors should be thrown using [`LuciaError`](/references/error-handling)

| name                           | description                                   |
| ------------------------------ | --------------------------------------------- |
| DATABASE_FETCH_FAILED          | Failed to get data from database              |
| DATABASE_UPDATE_FAILED         | Failed to update database (write, delete)     |
| AUTH_DUPLICATE_IDENTIFIER_TOKEN | Violates `identifier_token` unique constraint |
| AUTH_DUPLICATE_USER_DATA       | Violates some column's unique constraint      |
