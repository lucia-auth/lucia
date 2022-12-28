---
_order: 1
title: "Concepts"
---

The main focus of Lucia is session and user management, not user authentication (=is the user who they claim to be?). Since it’s a very common and basic strategy, it does provide a way to use passwords, but it’s 100% optional. If you know for sure who the user is (via user id from OAuth, email from magic links, email/phone number from OTP, username from username/password, etc), you can create a new user and session based on that info. This means Lucia can be used with most, if not all, authentication methods. This is a very deliberate design choice and the core idea behind Lucia.

## How Lucia works

Sessions can be created for existing users. This session is stored in the database, and the session id is stored as a cookie. When a user makes a request to the server, Lucia can check the validity of the session id by cross-checking it with the database. Sessions expire after some time, and need to be renewed, and so inactive users will be logged out.

## Provider ids

Users can be identified using either of 2 attributes: user id and provider id. You can think of user id as for referencing users internally, and provider id for referencing users using external data. This means you can use the user's input or data from OAuth provider to get the user.

Provider id is the combination of the provider name (the authentication method used), and an identifier (something unique to that user within the authentication method). It takes the form of `${providerName}:${identifier}`. For example, for email/password, `email` can be the provider name and the user's email can be the identifier; and for Github OAuth, `github` can be the provider name and the user's GitHub user id can be the identifier.

## Session states

Sessions can be in one of 3 states: active, idle, and dead. Active sessions can be used to check the validity of requests. These expire after a while, and once they do, they are considered idle. For some period of time, idle sessions can be renewed for a new active session. Idle sessions that have passed that period, however, are considered dead and cannot be used in any way. This makes sure inactive sessions are invalidated, while active user sessions are persisted.

## Database adapters

To support multiple databases, Lucia uses database adapters. These adapters provide a set of identical methods to read from and update the database. Custom adapters can be created as well if Lucia does not provide one.

In additional to normal "complete" adapters, table-specific adapters can be provided for more granular control. This means sessions can be stored in a different database than where users are stored.
