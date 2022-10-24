---
order: 9
layout: "@layouts/DocumentLayout.astro"
title: "Using forms"
---

When using forms for sign in and account creation, the page has to be refreshed for the session to update (the hooks has to re-run) However, when using [`use:enhance`](https://kit.svelte.dev/docs/modules#$app-forms-enhance) action, the default behavior is that the user will be redirected using [`goto()`](https://kit.svelte.dev/docs/modules#$app-navigation-goto), which does not re-run hooks. To use SvelteKit's form actions, you must override the default behavior and redirect users using `window.location.href`.

```svelte
<script lang="ts">
	import { applyAction, enhance } from "$app/forms";
</script>

<form
	use:enhance={() => {
		return async ({ result }) => {
			if (result.type === "redirect") {
				window.location.href = result.location;
				return;
			}
			applyAction(result);
		};
	}}
/>
```
