---
_order: 0
title: "Reddit"
---

OAuth integration for Reddit. Refer to [Reddit OAuth documentation archive](https://github.com/reddit-archive/reddit/wiki/OAuth2) for getting the required credentials.

### Initialization

```ts
import reddit from "@lucia-auth/oauth/reddit";
import { auth } from "./lucia.js";

const redditAuth = reddit(auth, configs);
```

```ts
const reddit: (
	auth: Auth,
	configs: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scope?: string[];
	}
) => RedditProvider;
```

The Reddit integration uses the `Buffer` module. Make sure your deployment environment supports it (e.g. Cloudflare Pages doesn't!).
In case `Buffer` is not supported make sure to install a polyfill.

If you are using SvelteKit this can be a solution:

`npm i -D @rollup/plugin-inject`

```ts
// vite.config.ts

import { sveltekit } from "@sveltejs/kit/vite";
import inject from "@rollup/plugin-inject";
import type { UserConfig } from "vite";

const config: UserConfig = {
	plugins: [sveltekit()],
	build: {
		rollupOptions: {
			plugins: [inject({ Buffer: ["Buffer", "Buffer"] })]
		}
	}
};

export default config;

```

#### Parameter

| name                 | type                                        | description                                     | optional |
|----------------------| ------------------------------------------- |-------------------------------------------------| -------- |
| auth                 | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance                                  |          |
| configs.clientId     | `string`                                    | Reddit OAuth app client id                      |          |
| configs.clientSecret | `string`                                    | Reddit OAuth app client secret                  |          |
| configs.redirectUri  | `string`                                    | Reddit OAuth app redirect Uri                   |          |
| configs.scope        | `string[]`                                  | an array of scopes (`identiy` is always selected) | true     |

### Redirect user to authorization url

Redirect the user to Reddit's authorization url, which can be retrieved using `getAuthorizationUrl()`.

```ts
import reddit from "@lucia-auth/oauth/reddit";
import { auth } from "./lucia.js";

const redditAuth = reddit(auth, configs);

const [authorizationUrl, state] = redditAuth.getAuthorizationUrl();

// the state can be stored in cookies or localstorage for request validation on callback
setCookie("state", state, {
	path: "/",
	httpOnly: true, // only readable in the server
	maxAge: 60 * 60 // a reasonable expiration date
}); // example with cookie
```

### Validate callback

The authorization code and state can be retrieved from the `code` and `state` search params, respectively, inside the callback url. Validate that the state is the same as the one stored in either cookies or localstorage before passing the `code` to `validateCallback()`.

```ts
import reddit from "@lucia-auth/oauth/reddit";
const redditAuth = reddit();

// get code and state from search params
const url = new URL(callbackUrl);
const code = url.searchParams.get("code") || ""; // http://localhost:3000/api/reddit?code=abc&state=efg => abc
const state = url.searchParams.get("state") || ""; // http://localhost:3000/api/reddit?code=abc&state=efg => efg

// get state stored in cookie (refer to previous step)
const storedState = headers.cookie.get("state");

// validate state
if (state !== storedState) throw new Error(); // invalid state

const redditSession = await redditAuth.validateCallback(code);
```

## `reddit()` (default)

Refer to [`Initialization`](/oauth/providers/reddit#initialization).

## `RedditProvider`

```ts
interface RedditProvider {
	getAuthorizationUrl: <State = string | null | undefined = undefined>(state?: State) => State extends null ? [url: string] : [url: string, state: string];
	validateCallback: (code: string) => Promise<RedditProviderSession>;
}
```

Implements [`OAuthProvider`](/oauth/reference/api-reference#oauthprovider).

### `getAuthorizationUrl()`

Refer to [`OAuthProvider.getAuthorizationUrl()`](/oauth/reference/api-reference#getauthorizationurl).
This integration generates a `permanent` token. For more information refer to [Reddit OAuth documentation archive](https://github.com/reddit-archive/reddit/wiki/OAuth2#authorization).

### `validateCallback()`

Implements [`OAuthProvider.validateCallback()`](/oauth/reference/api-reference#getauthorizationurl). `code` can be acquired from the `code` search params inside the callback url.

```ts
const validateCallback: (code: string) => Promise<RedditProviderSession>;
```

#### Returns

| type                                                                     |
|--------------------------------------------------------------------------|
| [`RedditProviderSession`](/oauth/providers/reddit#redditprovidersession) |

## `RedditProviderSession`

```ts
interface RedditProviderSession {
	existingUser: User | null;
	createUser: (userAttributes?: Lucia.UserAttributes) => Promise<User>;
	providerUser: RedditUser;
	accessToken: string;
}
```

Implements [`ProviderSession`](/oauth/reference/api-reference#providersession).

| name                                             | type                                               | description         |
| ------------------------------------------------ |----------------------------------------------------|---------------------|
| existingUser                                     | [`User`](/reference/types/lucia-types#user)` \| null` | existing user - null if non-existent (= new user) |
| [createUser](/oauth/providers/github#createuser) | `Function`                                         |                     |
| providerUser                                     | [`RedditUser`](/oauth/providers/reddit#reddituser) | Reddit user         |
| accessToken                                      | `string`                                           | Reddit access token |

### `createUser()`

```ts
const createUser: (userAttributes?: Lucia.UserAttributes) => Promise<User>;
```

Creates a new using [`Lucia.createUser()`](/reference/api/server-api#createuser) using the following parameter:

| name               | value                                                                  |
| ------------------ |------------------------------------------------------------------------|
| provider           | `"reddit"`                                                             |
| identifier         | Reddit user id ([`RedditUser.id`](/oauth/providers/reddit#reddituser)) |
| options.attributes | `userAttributes`                                                       |

## `RedditUser`

```ts
interface RedditUser {
	is_employee: boolean,
	seen_layout_switch: boolean,
	has_visited_new_profile: boolean,
	pref_no_profanity: boolean,
	has_external_account: boolean,
	pref_geopopular: string,
	seen_redesign_modal: boolean,
	pref_show_trending: boolean,
	subreddit: {
		default_set: boolean,
		user_is_contributor: boolean,
		banner_img: string,
		restrict_posting: boolean,
		user_is_banned: boolean,
		free_form_reports: boolean,
		community_icon: string,
		show_media: boolean,
		icon_color: string,
		user_is_muted: boolean,
		display_name: string,
		header_img: string,
		title: string,
		coins: number,
		previous_names: string[],
		over_18: boolean,
		icon_size: [ number, number ],
		primary_color: string,
		icon_img: string,
		description: string,
		allowed_media_in_comments: any[],
		submit_link_label: string,
		header_size: any,
		restrict_commenting: boolean,
		subscribers: number,
		submit_text_label: string,
		is_default_icon: boolean,
		link_flair_position: string,
		display_name_prefixed: string,
		key_color: string,
		name: string,
		is_default_banner: boolean,
		url: string,
		quarantine: boolean,
		banner_size: [ number, number ],
		user_is_moderator: boolean,
		accept_followers: boolean,
		public_description: string,
		link_flair_enabled: boolean,
		disable_contributor_requests: boolean,
		subreddit_type: string,
		user_is_subscriber: boolean
	},
	pref_show_presence: boolean,
	snoovatar_img: string,
	snoovatar_size: [ number, number ],
	gold_expiration: any,
	has_gold_subscription: boolean,
	is_sponsor: boolean,
	num_friends: number,
	features: {
		mod_service_mute_writes: boolean,
		promoted_trend_blanks: boolean,
		show_amp_link: boolean,
		chat: boolean,
		is_email_permission_required: true,
		mod_awards: boolean,
		expensive_coins_package: boolean,
		mweb_xpromo_revamp_v2: { owner: string, variant: string, experiment_id: number },
		awards_on_streams: boolean,
		mweb_xpromo_modal_listing_click_daily_dismissible_ios: true,
		chat_subreddit: boolean,
		cookie_consent_banner: boolean,
		modlog_copyright_removal: boolean,
		do_not_track: boolean,
		images_in_comments: boolean,
		mod_service_mute_reads: boolean,
		chat_user_settings: boolean,
		use_pref_account_deployment: boolean,
		mweb_xpromo_interstitial_comments_ios: boolean,
		mweb_xpromo_modal_listing_click_daily_dismissible_android: boolean,
		premium_subscriptions_table: boolean,
		mweb_xpromo_interstitial_comments_android: true,
		crowd_control_for_post: boolean,
		mweb_nsfw_xpromo: { owner: string, variant: string, experiment_id: number },
		noreferrer_to_noopener: boolean,
		chat_group_rollout: boolean,
		resized_styles_images: boolean,
		spez_modal: boolean,
		mweb_sharing_clipboard: { owner: string, variant: string, experiment_id: number }
	},
	can_edit_name: boolean,
	verified: boolean,
	pref_autoplay: boolean,
	coins: number,
	has_paypal_subscription: boolean,
	has_subscribed_to_premium: boolean,
	id: string,
	has_stripe_subscription: boolean,
	oauth_client_id: string,
	can_create_subreddit: boolean,
	over_18: boolean,
	is_gold: boolean,
	is_mod: boolean,
	awarder_karma: number,
	suspension_expiration_utc: any,
	has_verified_email: boolean,
	is_suspended: boolean,
	pref_video_autoplay: boolean,
	has_android_subscription: boolean,
	in_redesign_beta: boolean,
	icon_img: string,
	pref_nightmode: boolean,
	awardee_karma: number,
	hide_from_robots: boolean,
	password_set: boolean,
	link_karma: number,
	force_password_reset: boolean,
	total_karma: number,
	seen_give_award_tooltip: boolean,
	inbox_count: number,
	seen_premium_adblock_modal: boolean,
	pref_top_karma_subreddits: boolean,
	pref_show_snoovatar: boolean,
	name: string,
	pref_clickgadget: number,
	created: number,
	gold_creddits: number,
	created_utc: number,
	has_ios_subscription: boolean,
	pref_show_twitter: boolean,
	in_beta: boolean,
	comment_karma: number,
	accept_followers: boolean,
	has_subscribed: boolean,
	linked_identities: any[],
	seen_subreddit_chat_ftux: boolean
};
```
