## Overview

An adapter takes the following structure:

```ts
interface Adapter {
    getUserFromRefreshToken: (
        refreshToken: string
    ) => Promise<DatabaseUser<Record<string, any>> | null>;
    getUserFromIdentifierToken: (
        identifierToken: string
    ) => Promise<DatabaseUser<Record<string, any>> | null>;
    getUserFromId: (
        identifierToken: string
    ) => Promise<DatabaseUser<Record<string, any>> | null>;
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
    updateUser: (
        userId: string,
        data: {
            identifier_token?: string | null;
            hashed_password?: string | null;
            user_data?: Record<string, any>;
        }
    ) => Promise<DatabaseUser<Record<string, any>>>;
}
```

## Properties

### getUserFromRefreshToken

Gets the row from `users` connected to the refresh token and returns it as an object.

```ts
const getDataFromRefreshToken: (
    refreshToken: string
) => Promise<DatabaseUser<Record<string, any>> | null>;
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
const getDataFromIdentifierToken: (
    identifierToken: string
) => Promise<DatabaseUser<Record<string, any>> | null>;
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

### getUserFromId

Gets the row from `users` table with the user id and returns it as an object.

```ts
const getDataFromIdentifierToken: (
    userId: string
) => Promise<DatabaseUser<Record<string, any>> | null>;
```

#### Parameters

| name            | type   | description                     |
| --------------- | ------ | ------------------------------- |
| identifierToken | string | `users.identifier_token` column |

#### Returns

Returns `null` if a user does not exist.

| name | type                                           | description |
| ---- | ---------------------------------------------- | ----------- |
|      | [DatabaseUser](/references/types#databaseuser) |             |

### createUser

Creates a new row in `users` table.

```ts
const createAccount: (
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
const deleteUser: (userId: string) => Promise<void>;
```

#### Parameters

| name   | type   | description |
| ------ | ------ | ----------- |
| userId | string | `id` column |

### saveRefreshToken

Creates a new row in `refresh_tokens` table.

```ts
const saveRefreshToken: (userId: string, refreshToken: string) => Promise<void>;
```

#### Parameters

| name         | type   | description                           |
| ------------ | ------ | ------------------------------------- |
| userId       | string | `refresh_tokens.user_id` column       |
| refreshToken | string | `refresh_tokens.refresh_token` column |

### deleteRefreshToken

Deletes a row in `refresh_tokens` table where the refresh token matches.

```ts
const deleteRefreshToken: (refreshToken: string) => Promise<void>;
```

#### Parameters

| name         | type   | description            |
| ------------ | ------ | ---------------------- |
| refreshToken | string | `refresh_token` column |

### deleteUserRefreshTokens

Deletes all rows in `refresh_tokens` table where the user id matches.

```ts
const deleteUserRefreshTokens: (userId: string) => Promise<void>;
```

#### Parameters

| name   | type   | description                     |
| ------ | ------ | ------------------------------- |
| userId | string | `refresh_tokens.user_id` column |

### updateUser

Updates user's column where the value is not `undefined` (If the value is `null`, the column value should be set to `null` as it is a value).

```ts
const updateUser: (
    userId: string,
    data: {
        identifier_token?: string | null;
        hashed_password?: string | null;
        user_data?: Record<string, any>;
    }
) => Promise<DatabaseUser<Record<string, any>>>;
```

#### Returns

\*Throws an error if a user doesn't exist.

| name | type                                           | description |
| ---- | ---------------------------------------------- | ----------- |
|      | [DatabaseUser](/references/types#databaseuser) |             |

#### Parameters

| name                  | type                           | description                                           |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| userId                | string                         | `user_id` column                                      |
| data.identifier_token | string, null, undefined        | Value of `users.identifier_token` column              |
| data.hashed_password  | string, null, undefined        | Value of `users.hashed_password` column               |
| data.user_data        | Record<string, any>, undefined | Each key/values are their own column in `users` table |

## Errors

Database related errors should be thrown using Lucia's [`Error`](/references/error-handling)

| name                            | description                                   |
| ------------------------------- | --------------------------------------------- |
| DATABASE_FETCH_FAILED           | Failed to get data from database              |
| DATABASE_UPDATE_FAILED          | Failed to update database (write, delete)     |
| AUTH_DUPLICATE_IDENTIFIER_TOKEN | Violates `identifier_token` unique constraint |
| AUTH_DUPLICATE_USER_DATA        | Violates some column's unique constraint      |
| AUTH_INVALID_USER_ID            | Violates some column's unique constraint      |
