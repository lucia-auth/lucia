---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Concepts"
---

## How Lucia works

Once a user signs in, a new session is issued for the user. The session is stored in the database, and the session id is stored as a cookie. When a user makes a request to the server, Lucia can check the validity of the session id by cross-checking with the database. Sessions expire after some time, and need to be renewed, and so inactive users will be logged out. 

## Session states

Sessions (and their ids) can be in one of 3 states: active, idle, and dead. Active sessions can be used to check the validity of requests and get the current user. These expire after a while, and once they do, they are considered idle. For some period of time, idle sessions can be renewed for a new active session. Idle sessions that have passed that period, however, are considered dead and cannot be used in any way. This makes sure inactive users are logged out, while active user sessions are persisted.

## Provider ids

Users can be identified using either of 2 attributes: user id and provider id. You can think of user id as for referencing users internally, and provider id for referencing users using external data. This means you can use the user's input or data from OAuth provider to validate and get a user.

Provider id is the combination of the provider name (the authentication method used), and an identifier (something unique to that user within the authentication method). It takes the form of `${providerName}:${identifier}`. For example, for email/password, `email` can be the provider name and the user's email can be the identifier; and for Github OAuth, `github` can be the provider name and the user's Github user id can be the identifier.

## Database adapters

To support multiple databases, Lucia uses database adapters. These adapters provide a set of identical methods to read from and update the database. Custom adapters can be created as well if Lucia does not provide one.