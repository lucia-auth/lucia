---
package: "integration-oauth" # package name
type: "minor" # "major", "minor", "patch"
---

Update OAuth Provider type to allow for a custom `redirectUri` to be passed to `getAuthorizationUrl` and update all providers accordingly.
Also add the option to pass a default `redirectUri` to the github provider config.