export type Page = [title: string, href: string];
export interface Section {
	title: string;
	pages: Page[];
}

export type Content = Array<Page | Section>;

export function isSelected(href: string, currentPathname: string): boolean {
	if (removeLeadingSlash(href) === removeLeadingSlash(currentPathname)) {
		return true;
	}
	return currentPathname.startsWith(removeLeadingSlash(href) + "/");
}

export function removeLeadingSlash(s: string): string {
	if (s.endsWith("/")) {
		return s.split("/").slice(0, -1).join("/");
	}
	return s;
}
