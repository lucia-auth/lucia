import {
	type FrameworkId,
	frameworkIds,
	isValidFrameworkId
} from "src/utils/framework";

import type { AstroGlobal } from "astro";

export const handleRequest = (Astro: AstroGlobal) => {
	const setFrameworkId = async (frameworkId: FrameworkId | null) => {
		if (frameworkId) {
			Astro.cookies.set("framework", frameworkId, {
				path: "/"
			});
			Astro.request.headers.set("framework_id", frameworkId);
		} else {
			Astro.cookies.set("framework", "", {
				path: "/",
				maxAge: 0
			});
			Astro.request.headers.delete("framework_id");
		}
	};

	const getFrameworkId = (): FrameworkId | null => {
		const getRequestFrameworkId = (): FrameworkId | null => {
			const frameworkIdHeader = Astro.request.headers.get("framework_id");
			if (isValidFrameworkId(frameworkIdHeader)) return frameworkIdHeader;
			for (const frameworkId of frameworkIds) {
				if (Astro.url.searchParams.has(frameworkId)) return frameworkId;
			}
			if (Astro.url.searchParams.has("none")) return null;
			const cookieFrameworkId = Astro.cookies.get("framework").value ?? null;
			if (isValidFrameworkId(cookieFrameworkId)) return cookieFrameworkId;
			return null;
		};
		const frameworkId = getRequestFrameworkId();
		setFrameworkId(frameworkId);
		return frameworkId;
	};
	return {
		...Astro.request,
		getFrameworkId,
		setFrameworkId
	} as const;
};
