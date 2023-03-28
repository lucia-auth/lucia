---
package: "@lucia-auth/oauth" # package name
type: "patch" # "major", "minor", "patch"
---

Update providers
    - Add `GithubTokens.refresh_token`, `GithubTokens.refresh_token_expires_in`, `expires_in`
    - Add `https://www.googleapis.com/auth/userinfo.profile` scope to Google provider by default