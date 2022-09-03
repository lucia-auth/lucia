## Overview

Configurations for `Lucia()`.

```ts
interface Configurations {
    adapter: Adapter;
    secret: string;
    generateUserId?: () => string;
}
```

## Properties

### secret

A random string used to hash strings (Eg. `aWmJoT0gOdjh2kZc2Zv3BTErb29qQNWEunlj`).

```ts
const secret: string;
```

### adapter

An [adapter](/adapters).

```ts
const adapter: Adapter;
```

### env

The environment the app is running in (http or https).

```ts
const env: "DEV" | "PROD"
```

In general, the value should be defined as the following.

```ts
import { dev } from "$app/environment"
const env = dev ? "DEV" : "PROD"
```

### generateUserId

_(Optional)_ Generates unique ids for users.

```ts
const generateUserId: () => Promise<string>;
```
