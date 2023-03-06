---
package: "@lucia-auth/oauth"
type: "patch"
---

# Fix Discord default scope
Fix the default scope for the Discord provider. The default was set to "indentity" but the Discord documentation says it should be "identify".

### Solution
Change "identity" to "indentify" in `packages/integration-oauth/src/providers/discord.ts`.
Also update the documentation for the Discord provider.
