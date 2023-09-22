---
package: "@lucia-auth/oauth"
type: "minor"
---

Fix several issues encountered in the Slack provider:
- Change requested scopes from `["oidc", "profile", ...]` to `["openid", "profile", "email", ...]`
- Add `redirectUri` to `validateAuthorizationCode` options
