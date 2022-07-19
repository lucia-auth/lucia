## Overview

Adapters are set of functions that Lucia can call to update the database and allows Lucia to be used with any databases.

## Database structure

### users

Stores user data (including passwords). `[user_data]` may be any number of columns that represent any data, which will be accessible in `session` object.

| column           | types  | description                                 |
| ---------------- | ------ | ------------------------------------------- |
| id               | string | unique                                      |
| hashed_password  | string |                                             |
| identifier_token | string | unqiue                                      |
| [user_data]      | any    | Will be passed on to `session` object as is |

### refresh_tokens

Stores refresh tokens.

| column        | types         | description           |
| ------------- | ------------- | --------------------- |
| id            | string/number | unique                |
| refresh_token | string        |                       |
| used_id       | string        | references `users.id` |
