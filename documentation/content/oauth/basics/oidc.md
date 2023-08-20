---
title: "Open ID Connect"
description: "Learn how to implement"
---

## Handle ID Token

You can use [`decodeIdToken()`](/reference/oauth/modules/main#decodeidtoken) to decode ID Tokens. **This does not validate them**, though validation is rarely necessary assuming the ID Token is used immediately.

```ts
import { decodeIdToken } from "@lucia-auth/oauth";

const user = decodeIdToken<Claims>(idToken);
const { sub, email } = user;

type Claims = {
	email: string;
};
```
