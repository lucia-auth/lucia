---
package: "@lucia-auth/oauth" # package name
type: "minor" # "major", "minor", "patch"
---

Github oAuth provider doesn't return an email by default. Email can be null.

My code fetches the primary email from the user's Github profile. This way, we don't have to return null for a Github profile.

This is also now a thing in Next-Auth. See this issue: https://github.com/nextauthjs/next-auth/issues/374

My code is a replication straight from the next-auth library's Github oAuth part. See: https://github.com/nextauthjs/next-auth/blob/main/packages/next-auth/src/providers/github.ts#L80