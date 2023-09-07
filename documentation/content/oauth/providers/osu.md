---
title: "osu! OAuth provider"
description: "Learn how to use the osu! OAuth provider"
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

### `OsuAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

```ts
// implements OAuth2ProviderAuth<OsuAuth<_Auth>>
interface OsuAuth<_Auth extends Auth> {
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
	validateCallback: (code: string) => Promise<OsuUserAuth<_Auth>>;
}
```

| type                          |
| ----------------------------- |
| [`OsuUserAuth`](#osuuserauth) |

##### Generics

| name    | extends                                    | default |
| ------- | ------------------------------------------ | ------- |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) | `Auth`  |

### `OsuTokens`

```ts
type OsuTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: number;
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

type OsuGameMode = "fruits" | "mania" | "osu" | "taiko";
```

### `OsuUserAuth`

Extends [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).

```ts
interface OsuUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
	osuUser: OsuUser;
	osuTokens: OsuTokens;
}
```

| properties  | type                      | description       |
| ----------- | ------------------------- | ----------------- |
| `osuUser`   | [`OsuUser`](#osuuser)     | Osu user          |
| `osuTokens` | [`OsuTokens`](#osutokens) | Access tokens etc |

##### Generics

| name    | extends                                    |
| ------- | ------------------------------------------ |
| `_Auth` | [`Auth`](/reference/lucia/interfaces/auth) |
