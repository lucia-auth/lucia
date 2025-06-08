---
title: "Lucia"
---

# Lucia

Lucia is an open source project to provide resources on implementing authentication using JavaScript and TypeScript.

If you have any questions on auth, feel free to ask them in our [Discord server](https://discord.com/invite/PwrK3kpVR3) or on [GitHub Discussions](https://github.com/lucia-auth/lucia/discussions)!

## Implementation notes

- The code example in this website uses the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (`crypto`). It's not anything great but it is available in many modern runtimes. Use whatever secure crypto package is available in your runtime.
- We may also reference packages from the [Oslo project](https://oslojs.dev). As a disclaimer, this package is written by the main author of Lucia. These packages are runtime-agnostic and light-weight, but can be considered as a placeholder for your own implementation or preferred packages.
- SQLite is used for SQL queries but the TypeScript code uses a placeholder database client.

## Related projects

- [The Copenhagen Book](https://thecopenhagenbook.com): A free online resource covering the various auth concepts in web applications.
- [Oslo](https://oslojs.dev): Simple, runtime agnostic, and fully-typed packages with minimal dependency for auth and cryptography.
- [Arctic](https://arcticjs.dev): OAuth 2.0 client library with support for 50+ providers.

## Disclaimer

All example code in this site is licensed under the [Zero-Clause BSD license](https://github.com/lucia-auth/lucia/blob/main/LICENSE-0BSD). You're free to use, copy, modify, and distribute it without any attribution. The license is approved by the [Open Source Initiative (OSI)](https://opensource.org/license/0bsd) and [Google](https://opensource.google/documentation/reference/patching#forbidden).

Everything else is licensed under the [MIT license](https://github.com/lucia-auth/lucia/blob/main/LICENSE-MIT).

_Copyright © 2024 pilcrow and contributors_
