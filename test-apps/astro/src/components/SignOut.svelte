<script lang="ts">
	import { signOut } from "@lucia-auth/astro/client";
	const handleSignOut = async () => {
		await signOut("/api/logout");
		window.location.href = "/";
	};
</script>

<button on:click={handleSignOut}>Sign out</button>
