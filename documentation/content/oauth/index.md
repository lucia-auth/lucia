---
title: "OAuth integration"
description: "Learn about the OAuth integration for Lucia"
---

Lucia provides an external, server-side library that makes implementing authentication flow with OAuth and Open ID Connect easy.

It mainly handles 2 parts of the authentication process. First, it generates an authorization URL for your users to be redirected to. Once the user authenticates with the provider, they will be redirected back to your application with a code. You can then pass this code to the integration to be validated.

We support a handful of popular providers out of the box (full list below), but we also provide helpers that support most OAuth 2.0 and Open ID Connect implementations.

```
npm i @lucia-auth/oauth
pnpm add @lucia-auth/oauth
yarn add @lucia-auth/oauth
```

Get started with [OAuth 2.0 authorization code grant type](/oauth/basics/oauth2) or [OAuth 2.0 with PKCE](/oauth/basics/oauth2-pkce).

## Step-by-step guides

We also have framework specific guides.

- [No framework](/guidebook/github-oauth)
- [Astro](/guidebook/github-oauth/astro)
- [Express](/guidebook/github-oauth/express)
- [Next.js App Router](/guidebook/github-oauth/nextjs-app)
- [Next.js Pages Router](/guidebook/github-oauth/nextjs-pages)
- [Nuxt](/guidebook/github-oauth/nuxt)
- [SvelteKit](/guidebook/github-oauth/sveltekit)

## Built-in providers

- Apple
- Atlassian
- Auth0
- Azure Active Directory
- Bitbucket
- Box
- Amazon Cognito
- Discord
- Dropbox
- Facebook
- GitHub
- GitLab
- Google
- Kakao
- Keycloak
- Lichess
- Line
- LinkedIn
- osu!
- Patreon
- Reddit
- Salesforce
- Slack
- Spotify
- Strava
- Twitch
- Twitter
