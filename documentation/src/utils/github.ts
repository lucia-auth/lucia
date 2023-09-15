type Contributor = {
	avatar: string;
	profileLink: string;
	username: string;
};

let contributors: Contributor[];

export const getGithubContributors = async (): Promise<Contributor[]> => {
	if (contributors) return contributors;
	const contributorsResponse = await fetch(
		"https://api.github.com/repos/lucia-auth/lucia/contributors?per_page=100",
		{
			headers: {
				Authorization: `Bearer ${import.meta.env.GITHUB_API_KEY}`
			}
		}
	);

	if (!contributorsResponse.ok) {
		throw new Error("Failed to fetch data from GitHub");
	}

	const contributorsResult = (await contributorsResponse.json()) as {
		avatar_url: string;
		html_url: string;
		login: string;
	}[];

	contributors = contributorsResult.map((val) => {
		const url = new URL(val.avatar_url);
		url.searchParams.set("s", "128"); // set image size to 128 x 128
		url.searchParams.delete("v");
		return {
			avatar: url.href,
			profileLink: val.html_url,
			username: val.login
		};
	});
	return contributors;
};
