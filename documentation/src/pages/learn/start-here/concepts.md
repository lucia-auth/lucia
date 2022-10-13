---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Concepts"
---

## Provider ids

Users can be identified using either of 2 attributes: user id and provider id. You can think of user id as for referencing users internally, and provider id for referencing users using external data. This means you can use the user's input or data from OAuth provider to validate and get a user.

Provider id is the combination of the provider name (the authentication method used), and an identifier (something unique to that user within the authentication method). It takes the form of `${providerName}:${identifier}`. For example, for email/password, `email` can be the provider name and the user's email can be the identifier; and for Github OAuth, `github` can be the provider name and the user's Github user id can be the identifier.