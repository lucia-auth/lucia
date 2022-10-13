---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Concepts"
---

## How Lucia works under the hood

Once a user signs in, an access token and a refresh token is issued. The access token can be used to identify the user and is valid for the duration of the session (8 hours). Once the access token expires, the one-time refresh token can be used to create a new session, thus creating a new access and refresh token. Both of these tokens are stored as http-only cookies and can only be read from the server. Lucia will only considered cookies valid if the request is coming from a trusted domain.

## Provider ids

Users can be identified using either of 2 attributes: user id and provider id. You can think of user id as for referencing users internally, and provider id for referencing users using external data. This means you can use the user's input or data from OAuth provider to validate and get a user.

Provider id is the combination of the provider name (the authentication method used), and an identifier (something unique to that user within the authentication method). It takes the form of `${providerName}:${identifier}`. For example, for email/password, `email` can be the provider name and the user's email can be the identifier; and for Github OAuth, `github` can be the provider name and the user's Github user id can be the identifier.

## Database adapters

To support multiple databases, Lucia uses database adapters. These adapters provide a set of identical methods to read from and update the database. Custom adapters can be created as well if Lucia does not provide one.