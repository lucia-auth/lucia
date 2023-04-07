<script lang="ts">
	import '../../app.css';
</script>

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<meta name="viewport" content="width=device-width" />
		<title>Demo mailbox</title>
	</head>
	<body>
		<header class="px-4 fixed top-0 flex w-full place-content-between py-4 place-items-center">
			<a href="/" class="text-xl font-semibold">Lucia Demo</a>
			<a href="/email" class="hover:underline text-indigo-500" target="_blank">Open mailbox</a>
		</header>
		<main class="mx-auto max-w-sm px-4 py-16">
			<slot />
		</main>
	</body>
</html>

<style lang="postcss">
	:global(main h1) {
		@apply mb-2 w-full text-3xl font-semibold;
	}
	:global(main label) {
		@apply mb-1 w-full text-sm font-medium;
	}
	:global(main input) {
		@apply my-1 mb-2 w-full rounded border px-2 py-1.5;
	}
	:global(main input[type="submit"]) {
		@apply mb-2 w-full cursor-pointer rounded border bg-black px-2 py-1.5 font-medium text-white;
	}
	:global(main p.message) {
		@apply text-sm;
	}
	:global(main p.error) {
		@apply text-sm text-red-400;
	}
	:global(main a) {
		@apply mx-auto block w-fit text-indigo-500  hover:underline;
	}
	:global(form) {
		@apply my-2;
	}
	:global(main form p) {
		@apply text-sm text-zinc-500;
	}
</style>
