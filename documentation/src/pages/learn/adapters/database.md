---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Database"
---

Lucia uses adapters to connect to your database. The following chart shows the basic structure of the database, though they may vary from database to database. The names of the tables and columns cannot be altered.

## `user`

The `user` table stores the users. The `[any]` column represents the any number of columns you can add to store additional user data. Refer to [Store additional user data](/learn/basics/store-additional-user-data). For `id`, use a auto-generated uuid or auto-increment int8, or `string` if you generate your own user id.

| name            | type               | description                                                      | reference |
| --------------- | ------------------ | ---------------------------------------------------------------- | --------- |
| id              | string (uuid/cuid) | Should be auto-generated UUID or similar by defaults             |           |
| provider_id     | string             | Stores the provider id using the form: `providerName:identifier` |           |
| hashed_password | string \| null     | `null` if the user doesn't have a password                       |           |
| [any]           | any                | This represents any number of columns of any name                |

## `session`

The `session` table stores the user's sessions (including the access token).

| name         | type          | description                                    | reference |
| ------------ | ------------- | ---------------------------------------------- | --------- |
| user_id      | string        |                                                | user.id   |
| access_token | string        |                                                |           |
| expires      | number (int8) | The expiration time (Unix) of the access token |           |

## `refresh_token`

The `refresh_token` table stores the user's refresh tokens.

| name          | type   | description | reference |
| ------------- | ------ | ----------- | --------- |
| user_id       | string |             | user.id   |
| refresh_token | string |             |           |
