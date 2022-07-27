A basic example of a working adapter for mongoose (MongoDB).

## Prerequisites

1. Set up the mongoose models for the `Users` and `RefreshTokens` collections.
2. Have a secret key stored in an environment variable.

## Mongoose Adapter

```ts
import lucia from "lucia-sveltekit";
import type { Adapter } from "lucia-sveltekit/types";
import { dev } from "$app/env";
import { Users } from "../models/users";
import { RefreshTokens } from "../models/refreshTokens";
import { LUCIA_SECRET } from "./_env";
import * as db from "$lib/db";

const mongoAdapter: Adapter = {
  getUserFromRefreshToken: async (refresh_token) => {
    const token = await RefreshTokens.findOne({ refresh_token }).exec();
    if (!token) return null;
    const user = await Users.findOne({ id: token.user_id }).exec();
    // If no user is found, `user` will be null already
    return user;
  },

  getUserFromIdentifierToken: async (identifier_token) =>
    await Users.findOne({ identifier_token }).exec(),

  createUser: async (id, data) => {
    const { hashed_password, identifier_token, user_data } = data;
    const user = new Users({
      id,
      hashed_password,
      identifier_token,
      user_data,
    });
    await user.save();
  },
  
  deleteUser: async (id) => {
    await Users.deleteOne({ id }).exec();
  },

  saveRefreshToken: async (refresh_token, user_id) => {
    const token = new RefreshTokens({
      id: refresh_token,
      refresh_token,
      user_id,
    });
    await token.save();
  },

  deleteRefreshToken: async (refresh_token) => {
    await RefreshTokens.deleteOne({ refresh_token }).exec();
  },

  deleteUserRefreshTokens: async (user_id) => {
    await RefreshTokens.deleteMany({ user_id }).exec();
  },
};

export const auth = lucia({
  adapter: mongoAdapter,
  secret: LUCIA_SECRET,
  env: dev ? "DEV" : "PROD",
});
```
