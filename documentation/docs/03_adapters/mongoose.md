## Overview

An adapter to use with MongoDB via Mongoose.

### Installation

```bash
npm i @lucia-sveltekit/adapter-mongoose
```

## Usage

```ts
import adapter from "@lucia-sveltekit/adapter-mongoose";
import mongoose from "mongoose";

// set models here

const auth = lucia({
    adapter: adapter(mongoose, url),
    // ...
});
```

#### Parameters

| name     | type     | description            |
| -------- | -------- | ---------------------- |
| mongoose | Mongoose | Mongoose instance      |
| url      | string   | MongoDB connection URL |

## Models

Set these models before setting the adapter. Note that the table names are `user` and `refresh_token`. 

### users

`[user_data]` represents any number of additional columns that may be used.

```ts
const User = mongoose.model(
    "user",
    new mongoose.Schema(
        {
            _id: String,
            identifier_token: {
                type: String,
                unique: true,
                required: true,
            },
            hashed_password: String,
            [user_id]: any,
        },
        { _id: false }
    )
);
```

### refresh_tokens

```ts
const RefreshToken = mongoose.model(
    "refresh_token",
    new mongoose.Schema({
        refresh_token: String,
        user_id: String,
    })
);
```

## Contributors

-   [@SkepticMystic](https://github.com/SkepticMystic)
