---
package: "@lucia-auth/oauth"
type: "patch"
---

Re-use `originFromDomain` utility function in Auth0 and Keycloak providers, allowing to connect to insecure origins of self-hosted Keycloak instances.