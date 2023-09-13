import { component$ } from "@builder.io/qwik";

export default component$(() => {
	return (
		<>
			<h1>Sign in</h1>
			<a href="/signin/github">Sign in with GitHub</a>
		</>
	);
});
