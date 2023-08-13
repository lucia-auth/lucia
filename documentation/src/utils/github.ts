export const getGithubContributors = async (): Promise<
	{
		avatar: string;
		profileLink: string;
		username: string;
	}[]
> => {
	const contributorsResponse = await fetch(
		"https://api.github.com/repos/pilcrowonpaper/lucia/contributors?per_page=100",
		{
			headers: {
				Authorization: `Bearer ${import.meta.env.GITHUB_API_KEY}`
			}
		}
	);

	if (!contributorsResponse.ok) {
		throw new Error("Failed to fetch data from Github");
	}

	const contributorsResult = (await contributorsResponse.json()) as {
		avatar_url: string;
		html_url: string;
		login: string;
	}[];

	return contributorsResult.map((val) => {
		const url = new URL(val.avatar_url);
		url.searchParams.set("s", "128"); // set image size to 128 x 128
		url.searchParams.delete("v");
		return {
			avatar: url.href,
			profileLink: val.html_url,
			username: val.login
		};
	});
};
