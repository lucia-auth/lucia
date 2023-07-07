---
order: 0
title: "osu!"
description: "Learn about using the osu! provider in Lucia OAuth integration"
---

OAuth integration for osu!. Refer to [osu! OAuth documentation](https://osu.ppy.sh/docs/index.html#authentication) for getting the required credentials. Provider id is `osu`.

```ts
import { osu } from "@lucia-auth/oauth/providers";
import { auth } from "./lucia.js";

const osuAuth = osu(auth, config);
```

## `osu()`

```ts
const osu: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => OsuProvider;
```

##### Parameters

| name                   | type                                       | description                         | optional |
| ---------------------- | ------------------------------------------ | ----------------------------------- | :------: |
| `auth`                 | [`Auth`](/reference/lucia/interfaces/auth) | Lucia instance                      |          |
| `configs.clientId`     | `string`                                   | osu! OAuth app client id            |          |
| `configs.clientSecret` | `string`                                   | osu! OAuth app client secret        |          |
| `configs.redirectUri`  | `string`                                   | one of the authorized redirect URIs |          |
| `configs.scope`        | `string[]`                                 | an array of scopes                  |    ✓     |

##### Returns

| type                          | description   |
| ----------------------------- | ------------- |
| [`OsuProvider`](#osuprovider) | osu! provider |

## Interfaces

### `OsuProvider`

Satisfies [`OAuthProvider`](/reference/oauth/interfaces#oauthprovider).

#### `getAuthorizationUrl()`

Returns the authorization url for user redirection and a state for storage. The state should be stored in a cookie and validated on callback.

```ts
const getAuthorizationUrl: () => Promise<[url: URL, state: string]>;
```

##### Returns

| name    | type     | description          |
| ------- | -------- | -------------------- |
| `url`   | `URL`    | authorize url        |
| `state` | `string` | state parameter used |

#### `validateCallback()`

Validates the callback code.

```ts
const validateCallback: (code: string) => Promise<OsuUserAuth>;
```

##### Parameters

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| `code` | `string` | The authorization code from callback |

##### Returns

| type                          |
| ----------------------------- |
| [`OsuUserAuth`](#osuuserauth) |

##### Errors

Request errors are thrown as [`OAuthRequestError`](/reference/oauth/interfaces#oauthrequesterror).

### `OsuUserAuth`

```ts
type OsuUserAuth = ProviderUserAuth & {
	osuUser: OsuUser;
	osuTokens: OsuTokens;
};
```

| type                                                               |
| ------------------------------------------------------------------ |
| [`ProviderUserAuth`](/reference/oauth/interfaces#provideruserauth) |
| [`OsuUser`](#osuuser)                                              |
| [`OsuTokens`](#osutokens)                                          |

```ts
import type { OsuTokens, OsuUser } from "@lucia-auth/oauth/providers";
```

### `OsuTokens`

```ts
type OsuTokens = {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	token_type: string;
};
```

### `OsuUser`

```ts
type OsuUser = {
	avatar_url: string;
	country_code: string;
	default_group: string;
	id: number;
	is_active: boolean;
	is_bot: boolean;
	is_deleted: boolean;
	is_online: boolean;
	is_supporter: boolean;
	last_visit: string;
	pm_friends_only: boolean;
	profile_colour: string | null;
	username: string;
	country: {
		code: string;
		name: string;
	};
	cover: {
		custom_url: string | null;
		url: string;
		id: string | null;
	};
	discord: string | null;
	has_supported: boolean;
	interests: string | null;
	join_date: string;
	kudosu: {
		available: number;
		total: number;
	};
	location: string | null;
	max_blocks: number;
	max_friends: number;
	occupation: string | null;
	playmode: OsuGameMode;
	playstyle: ("mouse" | "keyboard" | "tablet" | "touch")[];
	post_count: number;
	profile_order: (
		| "me"
		| "recent_activity"
		| "beatmaps"
		| "historical"
		| "kudosu"
		| "top_ranks"
		| "medals"
	)[];
	title: string | null;
	title_url: string | null;
	twitter: string | null;
	website: string | null;
	is_restricted: boolean;
	account_history: {
		description: string | null;
		id: number;
		length: number;
		permanent: boolean;
		timestamp: string;
		type: "note" | "restriction" | "silence";
	}[];
	active_tournament_banner: {
		id: number;
		tournament_id: number;
		image: string;
	} | null;
	badges: {
		awarded_at: string;
		description: string;
		image_url: string;
		url: string;
	}[];
	beatmap_playcounts_count: number;
	favourite_beatmapset_count: number;
	follower_count: number;
	graveyard_beatmapset_count: number;
	groups: {
		colour: string | null;
		has_listing: boolean;
		has_playmodes: boolean;
		id: number;
		identifier: string;
		is_probationary: boolean;
		name: string;
		short_name: string;
		playmodes: OsuGameMode[] | null;
	}[];
	loved_beatmapset_count: number;
	mapping_follower_count: number;
	monthly_playcounts: {
		start_date: string;
		count: number;
	}[];
	page: {
		html: string;
		raw: string;
	};
	pending_beatmapset_count: number;
	previous_usernames: string[];
	rank_highest: {
		rank: number;
		updated_at: string;
	} | null;
	rank_history: {
		mode: OsuGameMode;
		data: number[];
	};
	ranked_beatmapset_count: number;
	replays_watched_counts: {
		start_date: string;
		count: number;
	}[];
	scores_best_count: number;
	scores_first_count: number;
	scores_recent_count: number;
	statistics: OsuUserStatistics;
	statistics_rulesets: Record<OsuGameMode, OsuUserStatistics | undefined>;
	support_level: number;
	user_achievements: {
		achieved_at: string;
		achievement_id: number;
	}[];
};
```

### `OsuGameMode`

```ts
type OsuGameMode = "fruits" | "mania" | "osu" | "taiko";
```

### `OsuUserStatistics`

```ts
type OsuUserStatistics = {
	grade_counts: {
		a: number;
		s: number;
		sh: number;
		ss: number;
		ssh: number;
	};
	hit_accuracy: number;
	is_ranked: boolean;
	level: {
		current: number;
		progress: number;
	};
	maximum_combo: number;
	play_count: number;
	play_time: number;
	pp: number;
	global_rank: number;
	ranked_score: number;
	replays_watched_by_others: number;
	total_hits: number;
	total_score: number;
	country_rank: number;
};
```
