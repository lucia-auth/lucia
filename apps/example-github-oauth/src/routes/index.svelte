<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ session }) => {
		if (!session.lucia) return {};
		return {
			status: 302,
			redirect: '/profile'
		};
	};
</script>

<script lang="ts">
	const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID
	const githubLink = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=user:email`;
</script>

<div class="box">
	<h2>Login to continue</h2>
	<div class="github">
		<a href={githubLink}>Login with Github</a>
	</div>
</div>
