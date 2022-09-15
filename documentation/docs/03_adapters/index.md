## Overview

Adapters provide a set of functions that Lucia can call to interact with the database and allows Lucia to be used with (almost) all relational and document-based databases.

## Database structure

### user

Stores user data (including passwords). `[user_data]` may be any number of columns that represent any data, which will be accessible in `session`.

| column           | types  | description                                |
| ---------------- | ------ | ------------------------------------------ |
| id               | string | unique                                     |
| hashed_password  | string |                                            |
| identifier_token | string | unique                                     |
| [user_data]      | any    | Will be passed on to `session` store as is |

### refresh_token

Stores refresh tokens.

| column        | types  | description          |
| ------------- | ------ | -------------------- |
| refresh_token | string |                      |
| user_id       | string | references `user.id` |
