A basic example of a working adapter for mongoose (MongoDB).

## Prerequisites

1. Set up the mongoose models for the `Users` and `RefreshTokens` collections.
   - Examples of minimal models are given below.
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

const transformMongooseObj = (obj: Record<string, any>) => {
  delete obj.__v;
  delete obj._id;
  return obj;
};

const mongoAdapter: Adapter = {
  getUserFromRefreshToken: async (refresh_token) => {
    const token = await RefreshTokens.findOne({ refresh_token }).exec();
    if (!token) return null;
    const user: DatabaseUser | null = await Users.findOne({
      id: token.user_id,
    }).lean();
    if (!user) return null;
    return transformMongooseObj(user);
  },

  getUserFromIdentifierToken: async (identifier_token) => {
    const user: DatabaseUser | null = await Users.findOne({
      identifier_token,
    }).lean();
    if (!user) return null;
    return transformMongooseObj(user);
  },

  createUser: async (id, data) => {
    const { hashed_password, identifier_token, user_data } = data;
    const user = new Users({
      id,
      hashed_password,
      identifier_token,
      ...user_data,
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

## Model Examples

Here are two minimal examples of working mongoose models:

### Users

```ts
import mongoose from "mongoose";
import type { DatabaseUser } from "lucia-sveltekit/types";

export const Users = mongoose.model<DatabaseUser>(
  "Users",
  new mongoose.Schema(
    {
      id: { type: String, unique: true },
      hashed_password: String,
      identifier_token: { type: String, unique: true },
    },
    { strict: false } // Allows arbitrary user_data to be added to the user doc
  ),
  "users"
);
```

### Refresh Tokens

```ts
import mongoose from "mongoose";

interface RefreshTokenDoc {
  id: string;
  refresh_token: string;
  user_id: string;
}

export const RefreshTokens = mongoose.model<RefreshTokenDoc>(
  "RefreshTokens",
  new mongoose.Schema({
    id: { type: String, unique: true },
    refresh_token: String,
    user_id: String,
  }),
  "refresh_tokens"
);
```
